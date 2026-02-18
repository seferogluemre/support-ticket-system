/**
 * WebSocket Library
 *
 * Type-safe WebSocket wrapper with Web Worker support for reliable
 * real-time communication even when tab is in background.
 *
 * ## Features
 *
 * - **Worker-based**: Runs in Web Worker to prevent browser throttling
 * - **Auto-reconnect**: Exponential backoff with configurable limits
 * - **Heartbeat**: Automatic ping/pong to detect dead connections
 * - **Health monitoring**: Automatic reconnection on visibility/network changes
 * - **Message queue**: Queues messages when disconnected
 * - **Type-safe**: Full TypeScript support
 *
 * ## Usage
 *
 * ```typescript
 * import { WebSocketWrapper, buildSocketUrl } from '@/lib/websocket';
 *
 * // Build URL with authentication
 * const url = buildSocketUrl(
 *   sessionToken,
 *   isStaffMode,
 *   companyMemberStatus,
 *   companyUuid
 * );
 *
 * // Create WebSocket instance
 * const socket = new WebSocketWrapper({
 *   url,
 *   reconnect: true,
 *   debug: true,
 *   name: 'chat-socket',
 * });
 *
 * // Listen to events
 * socket.on('message', (message) => {
 *   console.log('Received:', message);
 * });
 *
 * socket.on('stateChange', (state) => {
 *   console.log('State:', state);
 * });
 *
 * // Connect
 * socket.connect();
 *
 * // Send message
 * socket.send({ type: 'chat', content: 'Hello!' });
 *
 * // Cleanup
 * socket.terminate();
 * ```
 */

export * from './client';