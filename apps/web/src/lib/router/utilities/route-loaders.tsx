import type { QueryClient, queryOptions } from "@tanstack/react-query";

// biome-ignore lint/suspicious/noExplicitAny: any is used to satisfy the type
export type QueryOptionsLike = ReturnType<typeof queryOptions<any, any, any, any>>;

/**
 * Generic route loader helper
 * Pre-fetches data before route navigation for SSR-like experience
 *
 * @param queryClient - TanStack Query client instance
 * @param queries - Array of query options from queryOptions()
 */
export async function prefetchQueries(
    queryClient: QueryClient,
    queries: readonly QueryOptionsLike[]
): Promise<void> {
    await Promise.all(
        queries.map((query) => queryClient.ensureQueryData(query))
    );
}

/**
 * Create a standardized loader for routes
 * @param getQueries - Function that returns query options to prefetch
 *
 * Context will have queryClient in the parent route context (from __root.tsx)
 */
export function createRouteLoader<TContext = unknown>(
    getQueries: (context: TContext) => QueryOptionsLike | QueryOptionsLike[]
) {
    return async (loaderContext: {
        context: TContext & { queryClient: QueryClient };
    }) => {
        const { context } = loaderContext;
        const queries = getQueries(context as TContext);
        const queryArray = Array.isArray(queries) ? queries : [queries];

        await prefetchQueries(context.queryClient, queryArray);
    };
}

/**
 * Generic pending component for route loading states
 */
export function RoutePendingComponent({ message }: { message?: string }) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                    {message || "Loading..."}
                </p>
            </div>
        </div>
    );
}

/**
 * Create a standardized pending component for a specific route
 */
export function createRoutePendingComponent(message: string) {
    return () => <RoutePendingComponent message={message} />;
}

/**
 * Validate that current company exists in context
 * Throws error if company is not available
 */
export function validateCompanyContext(context: {
    currentCompany?: { uuid?: string } | null;
}): string {
    if (!context.currentCompany?.uuid) {
        throw new Error("No company selected");
    }
    return context.currentCompany.uuid;
}
