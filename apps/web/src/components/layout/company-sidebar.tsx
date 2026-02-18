import { CompanySection } from '#/components/layout/company-section';
import { NavGroup } from '#/components/layout/nav-group';
import { NavUser } from '#/components/layout/nav-user';
import { Button } from '#/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '#/components/ui/sidebar';
import { useSession } from '#/hooks/use-session';
import { useSidebarType } from '#/hooks/use-sidebar-type';
import { hasSystemScope } from '#/lib/auth';
import { IconArrowLeft } from '@tabler/icons-react';
import { companySidebarData } from './data/company-sidebar-data';

export function CompanySidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session } = useSession();
  const { setSidebarType } = useSidebarType();
  
  const userHasSystemScope = hasSystemScope(session);

  const handleBackToSystemAdmin = () => {
    setSidebarType('system-admin');
  };

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex flex-col gap-2">
          {userHasSystemScope && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSystemAdmin}
              className="w-full justify-start gap-2"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to System Admin</span>
            </Button>
          )}
          <CompanySection />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {companySidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}