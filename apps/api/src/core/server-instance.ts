import type { Server } from 'bun';

/**
 * Type alias for Bun Server - uses unknown for WebSocket data as we don't need strong typing
 * for server references used primarily for broadcasting
 */
export type BunServer = Server<unknown>;

/**
 * Global singleton to hold the Bun Server instance.
 * Useful for accessing the server in detached contexts like cron jobs.
 */
export class ServerInstance {
  private static _server: BunServer | null = null;

  static set server(server: BunServer | null) {
    this._server = server;
  }

  static get server(): BunServer | null {
    return this._server;
  }
}

