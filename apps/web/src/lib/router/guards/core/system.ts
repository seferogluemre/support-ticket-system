import { redirect } from '@tanstack/react-router';

/**
 * Generic Route Guards Core Library
 *
 * A minimal, project-agnostic route guard system for role-based access control.
 * Define custom guards with full control over access logic and redirects.
 *
 * @example
 * ```ts
 * const guards = createRouteGuardSystem({
 *   getSession: (ctx) => ctx.session,
 *   getDefaultRedirect: (session) => session?.isAdmin ? '/admin' : '/dashboard',
 *   guards: {
 *     adminOnly: defineGuard({
 *       handler: (ctx, session, helpers) => {
 *         if (!session?.isAdmin) helpers.redirectTo('/dashboard');
 *         return { allowed: true, session };
 *       },
 *     }),
 *   },
 * });
 *
 * // Use in routes
 * beforeLoad: ({ context }) => guards.adminOnly(context);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Base session interface - extend this for your project
 */
export interface BaseSession {
  id: string;
}

/**
 * Session extractor function type
 */
export type SessionExtractor<TContext, TSession extends BaseSession> = (
  context: TContext,
) => TSession | undefined;

/**
 * Redirect resolver function type
 */
export type RedirectResolver<TSession extends BaseSession, TContext = unknown> = (
  session: TSession | undefined,
  context: TContext,
) => string;

/**
 * Route guard result
 */
export interface RouteGuardResult<TSession extends BaseSession> {
  allowed: boolean;
  redirectTo?: string;
  session?: TSession;
}

/**
 * Guard helper functions provided to custom guards
 */
export interface GuardHelpers<TSession extends BaseSession, TContext> {
  /** Redirect to a path (throws redirect) */
  redirectTo: (path: string) => never;
  /** Get the default redirect path for the current session */
  getDefaultRedirect: () => string;
  /** Get the unauthenticated redirect path */
  getUnauthenticatedRedirect: () => string;
  /** Check if session exists */
  isAuthenticated: () => boolean;
  /** Get session from context */
  getSession: () => TSession | undefined;
  /** Get the full context */
  getContext: () => TContext;
}

/**
 * Custom guard function type
 */
export type CustomGuardFn<
  TSession extends BaseSession,
  TContext,
  TOptions = void,
  TResult extends RouteGuardResult<TSession> = RouteGuardResult<TSession>,
> = TOptions extends void
  ? (
      context: TContext,
      session: TSession | undefined,
      helpers: GuardHelpers<TSession, TContext>,
    ) => TResult
  : (
      context: TContext,
      session: TSession | undefined,
      helpers: GuardHelpers<TSession, TContext>,
      options: TOptions,
    ) => TResult;

/**
 * Guard definition
 */
export interface GuardDefinition<
  TSession extends BaseSession,
  TContext,
  TOptions = void,
  TResult extends RouteGuardResult<TSession> = RouteGuardResult<TSession>,
> {
  handler: CustomGuardFn<TSession, TContext, TOptions, TResult>;
  /** Whether to require authentication before running the guard (default: true) */
  requireAuth?: boolean;
}

/**
 * Map of guard names to their definitions
 */
export type GuardDefinitions<
  TSession extends BaseSession,
  TContext,
  // biome-ignore lint/suspicious/noExplicitAny: Required for flexible guard options typing
> = Record<string, GuardDefinition<TSession, TContext, any, RouteGuardResult<TSession>>>;

/**
 * Route guard system configuration
 */
export interface RouteGuardSystemConfig<
  TSession extends BaseSession,
  TContext = unknown,
  TGuards extends GuardDefinitions<TSession, TContext> = GuardDefinitions<TSession, TContext>,
> {
  getSession: SessionExtractor<TContext, TSession>;
  getDefaultRedirect: RedirectResolver<TSession, TContext>;
  unauthenticatedRedirect?: string;
  guards?: TGuards;
}

// ============================================================================
// Internal Helpers
// ============================================================================

function createGuardHelpers<TSession extends BaseSession, TContext>(
  context: TContext,
  getSession: SessionExtractor<TContext, TSession>,
  getDefaultRedirect: RedirectResolver<TSession, TContext>,
  unauthenticatedRedirect: string,
): GuardHelpers<TSession, TContext> {
  const session = getSession(context);

  return {
    redirectTo: (path: string): never => {
      throw redirect({ to: path });
    },
    getDefaultRedirect: () => getDefaultRedirect(session, context),
    getUnauthenticatedRedirect: () => unauthenticatedRedirect,
    isAuthenticated: () => !!session,
    getSession: () => session,
    getContext: () => context,
  };
}

// ============================================================================
// Type Inference Helpers
// ============================================================================

type InferGuardReturn<
  TDef,
  TSession extends BaseSession,
  // biome-ignore lint/suspicious/noExplicitAny: Required for type inference
> = TDef extends GuardDefinition<any, any, any, infer R> ? R : RouteGuardResult<TSession>;

// biome-ignore lint/suspicious/noExplicitAny: Required for type inference
type InferGuardOptions<TDef> = TDef extends GuardDefinition<any, any, infer O, any> ? O : void;

type CreateGuardFunctions<
  TSession extends BaseSession,
  TContext,
  TGuards extends GuardDefinitions<TSession, TContext>,
> = {
  [K in keyof TGuards]: InferGuardOptions<TGuards[K]> extends void
    ? (context: TContext) => InferGuardReturn<TGuards[K], TSession>
    : undefined extends InferGuardOptions<TGuards[K]>
      ? (
          context: TContext,
          options?: InferGuardOptions<TGuards[K]>,
        ) => InferGuardReturn<TGuards[K], TSession>
      : (
          context: TContext,
          options: InferGuardOptions<TGuards[K]>,
        ) => InferGuardReturn<TGuards[K], TSession>;
};

// ============================================================================
// Main Function
// ============================================================================

/**
 * Create a route guard system with custom guards
 *
 * @example
 * ```ts
 * const guards = createRouteGuardSystem({
 *   getSession: (ctx) => ctx.session,
 *   getDefaultRedirect: (session) => session?.isAdmin ? '/admin' : '/dashboard',
 *   guards: {
 *     adminOnly: defineGuard({
 *       handler: (ctx, session, helpers) => {
 *         if (!session?.isAdmin) helpers.redirectTo('/dashboard');
 *         return { allowed: true, session };
 *       },
 *     }),
 *     tenantAccess: defineGuard({
 *       handler: (ctx, session, helpers, options: { tenantId: string }) => {
 *         if (!session?.tenants?.includes(options.tenantId)) {
 *           helpers.redirectTo('/');
 *         }
 *         return { allowed: true, session, tenantId: options.tenantId };
 *       },
 *     }),
 *   },
 * });
 *
 * // Usage
 * guards.adminOnly(context);
 * guards.tenantAccess(context, { tenantId: '123' });
 * ```
 */
export function createRouteGuardSystem<
  TSession extends BaseSession,
  TContext = unknown,
  TGuards extends GuardDefinitions<TSession, TContext> = GuardDefinitions<TSession, TContext>,
>(config: RouteGuardSystemConfig<TSession, TContext, TGuards>) {
  const {
    getSession,
    getDefaultRedirect,
    unauthenticatedRedirect = '/sign-in',
    guards: guardDefinitions = {} as TGuards,
  } = config;

  // Build guard functions from definitions
  const guardFunctions = {} as CreateGuardFunctions<TSession, TContext, TGuards>;

  for (const [name, definition] of Object.entries(guardDefinitions)) {
    const { handler, requireAuth: requireAuthForGuard = true } = definition as GuardDefinition<
      TSession,
      TContext,
      unknown,
      RouteGuardResult<TSession>
    >;

    const guardFn = (context: TContext, options?: unknown) => {
      const session = getSession(context);
      const helpers = createGuardHelpers(
        context,
        getSession,
        getDefaultRedirect,
        unauthenticatedRedirect,
      );

      if (requireAuthForGuard && !session) {
        throw redirect({ to: unauthenticatedRedirect });
      }

      return handler(context, session, helpers, options);
    };

    (guardFunctions as Record<string, unknown>)[name] = guardFn;
  }

  return guardFunctions;
}

// ============================================================================
// Guard Definition Helper
// ============================================================================

/**
 * Helper to define a guard with proper typing
 *
 * @example
 * ```ts
 * const myGuard = defineGuard<MySession, MyContext, { id: string }>({
 *   handler: (ctx, session, helpers, options) => {
 *     if (!session) helpers.redirectTo('/login');
 *     return { allowed: true, session };
 *   },
 * });
 * ```
 */
export function defineGuard<
  TSession extends BaseSession,
  TContext = unknown,
  TOptions = void,
  TResult extends RouteGuardResult<TSession> = RouteGuardResult<TSession>,
>(
  definition: GuardDefinition<TSession, TContext, TOptions, TResult>,
): GuardDefinition<TSession, TContext, TOptions, TResult> {
  return definition;
}
