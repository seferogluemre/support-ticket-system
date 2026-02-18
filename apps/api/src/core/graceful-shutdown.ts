import type { AnyElysia } from 'elysia';
import { ServerInstance } from './server-instance';

/**
 * Graceful shutdown handler for the application
 */
export const setupGracefulShutdown = (app: AnyElysia) => {
  const gracefulShutdown = async (signal: string) => {
    try {
      // Stop the server
      if (app.server) {
        app.server.stop();
      }

      // Clear server instance
      ServerInstance.server = null;

      // Only log in production or for non-restart signals
      if (process.env.NODE_ENV === 'production' || signal !== 'SIGUSR2') {
        // biome-ignore lint/suspicious/noConsole: Shutdown message
        console.log(`\n${signal} received. Graceful shutdown completed.`);
      }

      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart signal

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
};
