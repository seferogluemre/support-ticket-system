/**
 * WebSocket Worker
 *
 * Runs WebSocket connection in a dedicated Web Worker to prevent
 * browser throttling when tab is in background.
 *
 * Benefits:
 * - Timers (heartbeat) are not throttled in workers
 * - Connection stays alive even when tab is backgrounded
 * - Messages are received in real-time
 */

// Worker message types from main thread
interface WorkerIncomingMessage {
  type:
    | 'connect'
    | 'disconnect'
    | 'send'
    | 'update-url'
    | 'set-url'
    | 'set-config'
    | 'force-reconnect'
    | 'check-connection';
  payload?: unknown;
}

// Worker message types to main thread
interface WorkerOutgoingMessage {
  type:
    | 'open'
    | 'close'
    | 'error'
    | 'message'
    | 'state-change'
    | 'reconnecting'
    | 'log';
  payload?: unknown;
}

// WebSocket states
type WebSocketState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'CLOSED';

// Configuration
interface WorkerConfig {
  url: string;
  reconnect: boolean;
  reconnectMaxAttempts: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  debug: boolean;
}

// Default configuration
let config: WorkerConfig = {
  url: '',
  reconnect: true,
  reconnectMaxAttempts: Infinity, // Never stop trying to reconnect
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
  debug: false,
};

// State
let socket: WebSocket | null = null;
let state: WebSocketState = 'DISCONNECTED';
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let isIntentionallyClosed = false;
let messageQueue: unknown[] = [];

// Logging
function log(...args: unknown[]): void {
  if (config.debug) {
    postMessage({ type: 'log', payload: args } as WorkerOutgoingMessage);
  }
}

// Send message to main thread
function emit(type: WorkerOutgoingMessage['type'], payload?: unknown): void {
  postMessage({ type, payload } as WorkerOutgoingMessage);
}

// Set state and notify main thread
function setState(newState: WebSocketState): void {
  if (state === newState) return;
  state = newState;
  log('State changed:', newState);
  emit('state-change', newState);
}

// Start heartbeat
function startHeartbeat(): void {
  stopHeartbeat();

  heartbeatTimer = setInterval(() => {
    if (state === 'CONNECTED' && socket?.readyState === WebSocket.OPEN) {
      const pingMessage = JSON.stringify({
        id: crypto.randomUUID(),
        type: 'ping',
      });
      socket.send(pingMessage);
      log('Sent ping');
      waitForPong();
    }
  }, config.heartbeatInterval);
}

// Wait for pong response
function waitForPong(): void {
  if (heartbeatTimeoutTimer) {
    clearTimeout(heartbeatTimeoutTimer);
  }

  heartbeatTimeoutTimer = setTimeout(() => {
    log('Heartbeat timeout - connection may be dead');
    socket?.close();
  }, config.heartbeatTimeout);
}

// Handle pong response
function handlePong(): void {
  if (heartbeatTimeoutTimer) {
    clearTimeout(heartbeatTimeoutTimer);
    heartbeatTimeoutTimer = null;
  }
  log('Heartbeat pong received');
}

// Stop heartbeat
function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (heartbeatTimeoutTimer) {
    clearTimeout(heartbeatTimeoutTimer);
    heartbeatTimeoutTimer = null;
  }
}

// Flush queued messages
function flushMessageQueue(): void {
  if (messageQueue.length === 0) return;

  log(`Flushing ${messageQueue.length} queued messages`);
  const queue = [...messageQueue];
  messageQueue = [];

  for (const message of queue) {
    sendMessage(message);
  }
}

// Send message
function sendMessage(message: unknown): void {
  if (state !== 'CONNECTED' || socket?.readyState !== WebSocket.OPEN) {
    log('Queueing message (not connected):', message);
    messageQueue.push(message);
    return;
  }

  try {
    const payload = JSON.stringify(message);
    socket.send(payload);
    log('Sent message:', message);
  } catch (error) {
    log('Failed to send message:', error);
    emit('error', { message: `Failed to send message: ${error}` });
  }
}

// Attempt reconnection with exponential backoff
function attemptReconnect(): void {
  // Only check max attempts if it's a finite number
  if (Number.isFinite(config.reconnectMaxAttempts) && reconnectAttempts >= config.reconnectMaxAttempts) {
    log('Max reconnection attempts reached');
    setState('CLOSED');
    return;
  }

  setState('RECONNECTING');
  reconnectAttempts++;

  const delay = Math.min(
    config.reconnectBaseDelay * Math.pow(2, reconnectAttempts - 1),
    config.reconnectMaxDelay
  );

  log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  emit('reconnecting', { attempt: reconnectAttempts, delay });

  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
}

// Force reconnect - used when visibility changes or manual reconnect is needed
function forceReconnect(): void {
  log('Force reconnect requested');
  
  // Reset reconnect attempts to allow fresh retry cycle
  reconnectAttempts = 0;
  
  // If already connected, just return
  if (socket?.readyState === WebSocket.OPEN) {
    log('Already connected, skipping force reconnect');
    emit('state-change', 'CONNECTED');
    return;
  }
  
  // If currently reconnecting, cancel and start fresh
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Reset intentionally closed flag
  isIntentionallyClosed = false;
  
  // Start reconnection immediately
  connect();
}

// Cleanup resources
function cleanup(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  stopHeartbeat();

  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;

    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }

    socket = null;
  }
}

// Connect to WebSocket server
function connect(): void {
  if (!config.url) {
    log('No URL configured');
    return;
  }

  if (
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING
  ) {
    log('Already connected or connecting');
    return;
  }

  isIntentionallyClosed = false;
  setState('CONNECTING');

  try {
    socket = new WebSocket(config.url);

    socket.onopen = (event) => {
      log('WebSocket opened');
      reconnectAttempts = 0;
      setState('CONNECTED');
      emit('open', { timestamp: event.timeStamp });
      startHeartbeat();
      flushMessageQueue();
    };

    socket.onclose = (event) => {
      log('WebSocket closed:', event.code, event.reason);
      stopHeartbeat();
      setState('DISCONNECTED');
      emit('close', { code: event.code, reason: event.reason });

      if (!isIntentionallyClosed && config.reconnect) {
        attemptReconnect();
      }
    };

    socket.onerror = () => {
      log('WebSocket error occurred');
      emit('error', { message: 'WebSocket error occurred' });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle pong internally
        if (data.type === 'pong') {
          handlePong();
          return;
        }

        log('Received message:', data);
        emit('message', data);
      } catch (error) {
        log('Failed to parse message:', error);
        emit('error', { message: `Failed to parse message: ${error}` });
      }
    };
  } catch (error) {
    log('Failed to create WebSocket:', error);
    emit('error', { message: `Failed to create WebSocket: ${error}` });
    attemptReconnect();
  }
}

// Disconnect from WebSocket server
function disconnect(): void {
  isIntentionallyClosed = true;
  cleanup();
  setState('CLOSED');
}

// Update URL and reconnect
function updateUrl(newUrl: string): void {
  if (config.url === newUrl) {
    log('URL unchanged, skipping reconnect');
    return;
  }

  config.url = newUrl;
  log('URL updated, reconnecting...', newUrl);

  cleanup();
  connect();
}

// Set URL without reconnecting
function setUrl(newUrl: string): void {
  if (config.url === newUrl) {
    log('URL unchanged');
    return;
  }

  config.url = newUrl;
  log('URL updated (no reconnect):', newUrl);
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'connect':
      connect();
      break;

    case 'disconnect':
      disconnect();
      break;

    case 'send':
      sendMessage(payload);
      break;

    case 'update-url':
      updateUrl(payload as string);
      break;

    case 'set-url':
      setUrl(payload as string);
      break;

    case 'set-config':
      config = { ...config, ...(payload as Partial<WorkerConfig>) };
      log('Config updated:', config);
      break;
      
    case 'force-reconnect':
      forceReconnect();
      break;
      
    case 'check-connection':
      // Check connection health and reconnect if needed
      if (state === 'CLOSED' || (state === 'DISCONNECTED' && !isIntentionallyClosed)) {
        log('Connection check: initiating reconnect');
        forceReconnect();
      } else if (state === 'CONNECTED' && socket?.readyState === WebSocket.OPEN) {
        log('Connection check: already connected');
        emit('state-change', 'CONNECTED');
      } else {
        log('Connection check: state is', state);
      }
      break;
  }
};

// Notify main thread that worker is ready
log('WebSocket Worker initialized');
