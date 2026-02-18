import type { QueryClient } from "@tanstack/react-query";
import type { RouteComponent } from "@tanstack/react-router";
import type { QueryOptionsLike } from "./route-loaders";
import {
    createRouteLoader,
    createRoutePendingComponent,
    validateCompanyContext,
} from "./route-loaders";

/**
 * Base context type that all route contexts must extend
 */
interface BaseRouteContext {
    queryClient: QueryClient;
}

/**
 * Company context type - extends base with company-specific fields
 */
export interface CompanyContext extends BaseRouteContext {
    currentCompany?: { uuid?: string } | null;
}

/**
 * Company member context type - extends base with company member-specific fields
 */
export interface CompanyMemberContext extends BaseRouteContext {
    currentCompanyMember?: { uuid?: string } | null;
}

/**
 * Generic route configuration
 */
interface RouteConfig<TContext = unknown> {
    /** Component to render for this route */
    component: RouteComponent;
    /** Function to get query options */
    getQueries: (context: TContext) => QueryOptionsLike | QueryOptionsLike[];
    /** Loading message to display during data fetch */
    pendingMessage?: string;
}

/**
 * Scoped route configuration with UUID extraction
 */
interface ScopedRouteConfig<TContext extends BaseRouteContext> {
    /** Component to render for this route */
    component: RouteComponent;
    /** Function to get query options, receives extracted UUID */
    getQueries: (
        uuid: string,
        context: TContext
    ) => QueryOptionsLike | QueryOptionsLike[];
    /** Loading message to display during data fetch */
    pendingMessage?: string;
}

/**
 * Create a generic route config with custom context handling (base implementation)
 *
 * Use with createFileRoute:
 * @example
 * ```typescript
 * export const Route = createFileRoute('/path')(
 *   createGenericRouteConfig({
 *     component: DashboardPage,
 *     getQueries: (context) => dashboardQueryOptions(),
 *     pendingMessage: 'Loading dashboard...',
 *   })
 * );
 * ```
 */
export function createGenericRouteConfig<TContext = unknown>(
    config: RouteConfig<TContext>
) {
    return {
        loader: createRouteLoader((context: TContext) => {
            return config.getQueries(context);
        }),
        pendingComponent: config.pendingMessage
            ? createRoutePendingComponent(config.pendingMessage)
            : undefined,
        component: config.component,
    } as const;
}

/**
 * Generic factory for creating scoped route configs with UUID extraction
 *
 * @param extractUuid - Function to extract and validate UUID from context
 * @returns A route config creator function
 */
function createScopedRouteConfigFactory<TContext extends BaseRouteContext>(
    extractUuid: (context: TContext) => string
) {
    return (config: ScopedRouteConfig<TContext>) => {
        return createGenericRouteConfig<TContext>({
            component: config.component,
            getQueries: (context) => {
                const uuid = extractUuid(context);
                return config.getQueries(uuid, context);
            },
            pendingMessage: config.pendingMessage,
        });
    };
}

/**
 * Create a company-scoped route config with automatic companyUuid validation and prefetching
 *
 * Use with createFileRoute:
 * @example
 * ```typescript
 * export const Route = createFileRoute('/path')(
 *   createCompanyRouteConfig({
 *     component: CannedMessagesPage,
 *     getQueries: (companyUuid) => cannedMessagesListQueryOptions(companyUuid),
 *     pendingMessage: 'Loading canned messages...',
 *   })
 * );
 * ```
 */
export const createCompanyRouteConfig =
    createScopedRouteConfigFactory<CompanyContext>((context) =>
        validateCompanyContext(context)
    );

/**
 * Create a company member-scoped route config with automatic companyMemberUuid validation and prefetching
 *
 * Use with createFileRoute:
 * @example
 * ```typescript
 * export const Route = createFileRoute('/path')(
 *   createCompanyMemberRouteConfig({
 *     component: CompanyMemberSettingsPage,
 *     getQueries: (companyMemberUuid) => companyMemberSettingsQueryOptions(companyMemberUuid),
 *     pendingMessage: 'Loading company member settings...',
 *   })
 * );
 * ```
 */
export const createCompanyMemberRouteConfig =
    createScopedRouteConfigFactory<CompanyMemberContext>((context) => {
        if (!context.currentCompanyMember?.uuid) {
            throw new Error("No company member selected");
        }
        return context.currentCompanyMember.uuid;
    });
