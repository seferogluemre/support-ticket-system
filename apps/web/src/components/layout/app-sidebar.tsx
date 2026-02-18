import { CompanySidebar } from '#/components/layout/company-sidebar';
import { SystemAdminSidebar } from '#/components/layout/system-admin-sidebar';
import type { Sidebar } from '#/components/ui/sidebar';
import { useSidebarType } from '#/hooks/use-sidebar-type';
import { useSession } from '#/hooks/use-session';
import { hasSystemScope } from '#/lib/auth';

/**
 * AppSidebar - Dynamic sidebar component
 *
 * Displays different sidebars based on:
 * 1. User's scope (SYSTEM vs COMPANY)
 * 2. SessionStorage 'sidebar-type' preference
 *
 * Rules:
 * - Users with SYSTEM scope can switch between both sidebars
 * - Users with COMPANY scope can only see CompanySidebar
 * - System sidebar is only accessible to SYSTEM scope users
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarType } = useSidebarType();
  const { session } = useSession();
  
  const userHasSystemScope = hasSystemScope(session);

  // If user doesn't have system scope, always show company sidebar
  if (!userHasSystemScope) {
    return <CompanySidebar {...props} />;
  }

  // System scope users can switch between sidebars
  if (sidebarType === 'company') {
    return <CompanySidebar {...props} />;
  }

  return <SystemAdminSidebar {...props} />;
}
