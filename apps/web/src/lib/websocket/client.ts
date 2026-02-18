import type { ClientWebSocketMessage, ServerWebSocketMessage } from '#/types/api';
import { env } from '#config/env.ts';

// Import worker using Vite's inline worker syntax
// This embeds the worker code as a blob URL, avoiding path resolution issues
import WebSocketWorker from './worker?worker&inline';

/**
 * WebSocket Connection States
 */
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  CLOSED = 'CLOSED',
}

/**
 * WebSocket Event Types
 */
interface WebSocketEvents {
  open: (event: { timestamp: number }) => void;
  close: (event: { code: number; reason: string }) => void;
  error: (error: { message: string }) => void;
  message: (message: ServerWebSocketMessage) => void;
  stateChange: (state: WebSocketState) => void;
  reconnecting: (attempt: number, delay: number) => void;
}

/**
 * Event Listener with unique ID
 */
interface EventListenerEntry {
  id: string;
  listener: (...args: unknown[]) => void;
}

/**
 * WebSocket Wrapper Configuration
 */
interface WebSocketWrapperConfig {
  url: string;
  reconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  queueMessages?: boolean;
  debug?: boolean;
  /**
   * Optional URL transformer for reconnection attempts.
   * Use this to modify the URL before reconnecting (e.g., remove temporary params).
   * If not provided, the current URL is used as-is.
   */
  reconnectUrlTransformer?: (url: string) => string;
  /**
   * Enable automatic connection health monitoring.
   * When enabled, the wrapper will automatically:
   * - Check connection when tab becomes visible
   * - Reconnect when browser comes back online
   * - Check connection when window regains focus
   * - Periodically check connection health (every 5 minutes when visible)
   *
   * Default: true
   */
  enableConnectionHealthMonitoring?: boolean;
  /**
   * Interval for periodic health checks (in ms).
   * Only applies when enableConnectionHealthMonitoring is true.
   *
   * Default: 30000 (30 seconds)
   */
  healthCheckIntervalMs?: number;
  /**
   * Name for logging purposes (helps identify which socket in logs)
   */
  name?: string;
}

/**
 * Resolved configuration with all required fields except optional callbacks
 */
type ResolvedWebSocketWrapperConfig = Required<
  Omit<WebSocketWrapperConfig, 'reconnectUrlTransformer' | 'name'>
> &
  Pick<WebSocketWrapperConfig, 'reconnectUrlTransformer' | 'name'>;

/**
 * Worker incoming message types
 */
interface WorkerOutgoingMessage {
  type: 'open' | 'close' | 'error' | 'message' | 'state-change' | 'reconnecting' | 'log';
  payload?: unknown;
}

/**
 * Type-safe WebSocket Wrapper using Web Worker
 *
 * The WebSocket connection runs in a dedicated Web Worker to prevent
 * browser throttling when the tab is in background.
 *
 * Benefits:
 * - Heartbeat timers are not throttled
 * - Connection stays alive in background
 * - Real-time message delivery even when tab is not focused
 */
export class WebSocketWrapper {
  private worker: Worker;
  private config: ResolvedWebSocketWrapperConfig;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private eventListeners: Map<keyof WebSocketEvents, EventListenerEntry[]> = new Map();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  /** Track if socket has ever successfully connected (for health monitoring) */
  private hasConnectedOnce = false;
  private boundHandlers: {
    visibilityChange?: () => void;
    online?: () => void;
    offline?: () => void;
    focus?: () => void;
  } = {};

  constructor(config: WebSocketWrapperConfig) {
    this.config = {
      reconnect: true,
      reconnectMaxAttempts: Infinity, // Never stop trying to reconnect
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      queueMessages: true,
      debug: false,
      enableConnectionHealthMonitoring: true,
      healthCheckIntervalMs: 30 * 1000, // 30 seconds
      ...config,
    };

    // Create worker instance
    this.worker = new WebSocketWorker();

    // Setup worker message handler
    this.worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
      this.handleWorkerMessage(event.data);
    };

    // Send initial config to worker
    this.worker.postMessage({
      type: 'set-config',
      payload: {
        url: this.config.url,
        reconnect: this.config.reconnect,
        reconnectMaxAttempts: this.config.reconnectMaxAttempts,
        reconnectBaseDelay: this.config.reconnectBaseDelay,
        reconnectMaxDelay: this.config.reconnectMaxDelay,
        heartbeatInterval: this.config.heartbeatInterval,
        heartbeatTimeout: this.config.heartbeatTimeout,
        debug: this.config.debug,
      },
    });

    // Setup connection health monitoring if enabled
    if (this.config.enableConnectionHealthMonitoring) {
      this.setupConnectionHealthMonitoring();
    }
  }

  /**
   * Setup connection health monitoring handlers
   * These ensure the connection stays alive even when:
   * - Tab is in background for extended periods
   * - Network connectivity changes
   * - Window loses and regains focus
   */
  private setupConnectionHealthMonitoring(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const logPrefix = this.config.name ? `[${this.config.name}]` : '[WebSocket]';

    // Visibility change handler
    this.boundHandlers.visibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.checkAndReconnect(`${logPrefix} Tab became visible`);
      }
    };
    document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);

    // Online handler
    this.boundHandlers.online = () => {
      this.log(`${logPrefix} Browser came online`);
      this.checkAndReconnect(`${logPrefix} Network restored`);
    };
    window.addEventListener('online', this.boundHandlers.online);

    // Offline handler (just logging)
    this.boundHandlers.offline = () => {
      this.log(`${logPrefix} Browser went offline`);
    };
    window.addEventListener('offline', this.boundHandlers.offline);

    // Focus handler
    this.boundHandlers.focus = () => {
      this.checkAndReconnect(`${logPrefix} Window focused`);
    };
    window.addEventListener('focus', this.boundHandlers.focus);

    // Periodic health check
    this.healthCheckInterval = setInterval(() => {
      // Only check if page is visible (don't waste resources when hidden)
      // Also only check if socket has connected at least once before (avoid unwanted initial connections)
      if (document.visibilityState === 'visible' && this.hasConnectedOnce) {
        if (this.state === WebSocketState.CLOSED || this.state === WebSocketState.DISCONNECTED) {
          this.log(`${logPrefix} Periodic health check - connection dead, forcing reconnect`);
          this.forceReconnect();
        }
      }
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Check connection health and reconnect if needed
   * Only reconnects if socket has connected at least once before
   */
  private checkAndReconnect(reason: string): void {
    // Only attempt reconnect if socket has been connected before
    // This prevents unwanted initial connections for newly created sockets
    if (!this.hasConnectedOnce) {
      return;
    }

    if (this.state === WebSocketState.CLOSED || this.state === WebSocketState.DISCONNECTED) {
      this.log(`${reason} - connection dead, forcing reconnect`);
      this.forceReconnect();
    } else if (this.state === WebSocketState.CONNECTED) {
      // Even if connected, verify with a check (server may have closed connection silently)
      this.checkConnection();
    }
  }

  /**
   * Cleanup connection health monitoring handlers
   */
  private cleanupConnectionHealthMonitoring(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (this.boundHandlers.visibilityChange) {
      document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);
    }
    if (this.boundHandlers.online) {
      window.removeEventListener('online', this.boundHandlers.online);
    }
    if (this.boundHandlers.offline) {
      window.removeEventListener('offline', this.boundHandlers.offline);
    }
    if (this.boundHandlers.focus) {
      window.removeEventListener('focus', this.boundHandlers.focus);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.boundHandlers = {};
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(message: WorkerOutgoingMessage): void {
    switch (message.type) {
      case 'open':
        this.state = WebSocketState.CONNECTED;
        this.hasConnectedOnce = true; // Mark that socket has connected at least once
        this.emit('open', message.payload as { timestamp: number });
        break;

      case 'close':
        this.state = WebSocketState.DISCONNECTED;
        this.emit('close', message.payload as { code: number; reason: string });
        break;

      case 'error':
        this.emit('error', message.payload as { message: string });
        break;

      case 'message':
        this.emit('message', message.payload as ServerWebSocketMessage);
        break;

      case 'state-change':
        this.state = message.payload as WebSocketState;
        this.emit('stateChange', this.state);
        break;

      case 'reconnecting': {
        const data = message.payload as { attempt: number; delay: number };
        this.emit('reconnecting', data.attempt, data.delay);
        break;
      }

      case 'log':
        if (this.config.debug) {
          // biome-ignore lint/suspicious/noConsole: Debug mode logging
          console.log('[WebSocketWorker]', ...(message.payload as unknown[]));
        }
        break;
    }
  }

  /**
   * Update URL and reconnect
   */
  public updateUrl(newUrl: string): void {
    if (this.config.url === newUrl) {
      this.log('URL unchanged, skipping reconnect');
      return;
    }

    // Apply URL transformer if needed (for reconnection logic)
    let transformedUrl = newUrl;
    if (this.config.reconnectUrlTransformer) {
      transformedUrl = this.config.reconnectUrlTransformer(newUrl);
    }

    this.config.url = transformedUrl;
    this.worker.postMessage({ type: 'update-url', payload: transformedUrl });
  }

  /**
   * Update URL without triggering reconnect
   */
  public setUrl(newUrl: string): void {
    if (this.config.url === newUrl) {
      this.log('URL unchanged');
      return;
    }

    this.config.url = newUrl;
    this.worker.postMessage({ type: 'set-url', payload: newUrl });
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    this.worker.postMessage({ type: 'connect' });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.worker.postMessage({ type: 'disconnect' });
  }

  /**
   * Force reconnect - resets retry counter and immediately attempts to reconnect
   * Useful when tab becomes visible again after being in background
   */
  public forceReconnect(): void {
    this.worker.postMessage({ type: 'force-reconnect' });
  }

  /**
   * Check connection health and reconnect if needed
   * Called when visibility changes to ensure connection is alive
   */
  public checkConnection(): void {
    this.worker.postMessage({ type: 'check-connection' });
  }

  /**
   * Send message to server
   */
  public send(message: ClientWebSocketMessage): void {
    this.worker.postMessage({ type: 'send', payload: message });
  }

  /**
   * Subscribe to events
   * @returns Unique subscription ID for unsubscribing
   */
  public on<K extends keyof WebSocketEvents>(event: K, listener: WebSocketEvents[K]): string {
    const id = crypto.randomUUID();

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listeners = this.eventListeners.get(event);
    listeners?.push({
      id,
      listener: listener as (...args: unknown[]) => void,
    });

    return id;
  }

  /**
   * Unsubscribe from events by subscription ID
   */
  public off(subscriptionId: string): boolean {
    for (const [event, listeners] of this.eventListeners.entries()) {
      const index = listeners.findIndex((entry) => entry.id === subscriptionId);
      if (index !== -1) {
        listeners.splice(index, 1);

        if (listeners.length === 0) {
          this.eventListeners.delete(event);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Get current connection state
   */
  public getState(): WebSocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);

    if (!listeners) return;

    for (const entry of listeners) {
      try {
        entry.listener(...args);
      } catch (error) {
        this.log(`Error in ${event} listener:`, error);
      }
    }
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      // biome-ignore lint/suspicious/noConsole: Debug mode logging
      console.log('[WebSocketWrapper]', ...args);
    }
  }

  /**
   * Terminate worker (cleanup)
   */
  public terminate(): void {
    this.cleanupConnectionHealthMonitoring();
    this.disconnect();
    this.worker.terminate();
  }
}

/**
 * Create socket instance with dynamic URL builder
 * Session token store'dan alınacak
 */
const BASE_URL = env.apiUrl.replace('http', 'ws') + '/chat/ws';

/**
 * Build WebSocket URL with session token, staff mode and company member status
 *
 * Simple design:
 * - Frontend always sends the intended status via x-company-member-status
 * - Backend always accepts and stores this status
 * - Admin changes are synced via WebSocket broadcast (staff-presence-update)
 * - sessionStorage is the frontend cache, Redis is the backend source of truth
 */
export function buildSocketUrl(
  sessionToken?: string | null,
  isStaffMode?: boolean,
  companyMemberStatus?: 'online' | 'away' | null,
  companyUuid?: string | null,
): string {
  const url = new URL(BASE_URL);

  // Visitor mode: Send current page info
  if (!isStaffMode && typeof window !== 'undefined') {
    url.searchParams.set('x-current-url', window.location.href);
    url.searchParams.set('x-page-title', document.title);
  }

  if (isStaffMode) {
    // Staff mode: Backend cookie authentication kullanacak
    url.searchParams.set('x-staff-mode', 'true');

    // Company member status (online/away) for staff connections
    // Backend will always accept this status
    if (companyMemberStatus) {
      url.searchParams.set('x-company-member-status', companyMemberStatus);
    }

    // Company context for staff
    if (companyUuid) {
      url.searchParams.set('x-company-uuid', companyUuid);
    }
  } else if (sessionToken) {
    // Visitor mode: Session token kullan
    url.searchParams.set('x-session-token', sessionToken);
  }

  return url.toString();
}
