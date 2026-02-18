import { NavigationProgress } from '#/components/navigation-progress';
import { Toaster } from '#/components/ui/sonner';
import { env } from '#/config/env';
import GeneralError from '#components/errors/general-error.tsx';
import NotFoundError from '#components/errors/not-found-error.tsx';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster 
          expand={false}
          richColors
          closeButton
          duration={5000}
        />
        {env.devtools.reactQuery && <ReactQueryDevtools buttonPosition="bottom-left" />}
        {env.devtools.tanstackRouter && <TanStackRouterDevtools position="bottom-right" />}
      </>
    );
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
});
