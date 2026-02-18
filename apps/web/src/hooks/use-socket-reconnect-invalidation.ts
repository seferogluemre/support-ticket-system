import type { WebSocketWrapper } from '#lib/websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Hook to invalidate TanStack Query cache when WebSocket reconnects.
 *
 * This ensures data stays fresh after connection recovery from:
 * - Network interruptions
 * - Server restarts
 * - Tab backgrounding (mobile browsers)
 *
 * @param socketInstance - The WebSocket wrapper instance to monitor
 * @param options - Configuration options
 */
export function useSocketReconnectInvalidation(
  socketInstance: WebSocketWrapper | null | undefined,
  options?: {
    /** Query keys to invalidate on reconnect. If not provided, invalidates all queries. */
    queryKeys?: unknown[][];
    /** Whether the hook is enabled */
    enabled?: boolean;
    /** Callback to run on reconnection */
    onReconnect?: () => void;
    /** Debug logging */
    debug?: boolean;
  },
) {
  const queryClient = useQueryClient();
  const hasInitiallyConnectedRef = useRef(false);
  const { queryKeys, enabled = true, debug = false, onReconnect } = options ?? {};

  // Store queryKeys in ref to avoid re-subscribing on every render
  // when caller doesn't memoize the array
  const queryKeysRef = useRef(queryKeys);
  queryKeysRef.current = queryKeys;

  useEffect(() => {
    if (!enabled || !socketInstance) return;

    const handleReconnect = () => {
      // Skip invalidation on initial connection
      if (!hasInitiallyConnectedRef.current) {
        hasInitiallyConnectedRef.current = true;
        if (debug) {
          // biome-ignore lint/suspicious/noConsole: Debug logging
          console.log('[useSocketReconnectInvalidation] Initial connection, skipping invalidation');
        }
        return;
      }

      if (debug) {
        // biome-ignore lint/suspicious/noConsole: Debug logging
        console.log('[useSocketReconnectInvalidation] Socket reconnected, invalidating queries');
      }

      // Execute callback if provided
      if (onReconnect) {
        onReconnect();
      }

      // Invalidate specific query keys or all queries
      const currentQueryKeys = queryKeysRef.current;
      if (currentQueryKeys && currentQueryKeys.length > 0) {
        for (const queryKey of currentQueryKeys) {
          queryClient.invalidateQueries({ queryKey });
        }
      } else {
        // Invalidate all queries
        queryClient.invalidateQueries();
      }
    };

    // Subscribe to 'open' event (fires after successful connection/reconnection)
    const subscriptionId = socketInstance.on('open', handleReconnect);

    return () => {
      if (socketInstance && subscriptionId) {
        socketInstance.off(subscriptionId);
      }
    };
  }, [socketInstance, enabled, queryClient, debug, onReconnect]); // queryKeys removed - using ref instead
}
