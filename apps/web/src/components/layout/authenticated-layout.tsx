import { Outlet } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { AppSidebar } from '#/components/layout/app-sidebar';
import { SidebarProvider } from '#/components/ui/sidebar';
import { SearchProvider } from '#/context/search-context';
import { cn } from '#/lib/utils';

interface Props {
  children?: React.ReactNode;
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false';
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <main
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
          )}
        >
          {children ? children : <Outlet />}
        </main>
      </SidebarProvider>
    </SearchProvider>
  );
}
