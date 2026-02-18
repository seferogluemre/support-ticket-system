import { useRouteContext } from '@tanstack/react-router';
import type { RouterContext } from '#types/router-context';
import { AppSession } from '#lib/auth';

interface UseSessionReturn {
  /** User session data */
  session: AppSession | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Hook to get current authenticated user session
 *
 * Centralized hook for accessing user session data across the app.
 * Uses TanStack Router context from _authenticated route.
 *
 * @example
 * ```tsx
 * import { hasSystemScope } from '#/lib/auth';
 *
 * const { session } = useSession();
 * const userName = session?.name || 'Guest';
 *
 * if (hasSystemScope(session)) {
 *   // Show system admin features
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const routerContext = useRouteContext({ strict: false }) as RouterContext | undefined;
  const session = routerContext?.session;

  return {
    session: session ?? null,
    isAuthenticated: !!session,
  };
}
