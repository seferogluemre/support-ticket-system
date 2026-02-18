import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { useSidebarType } from '#/hooks/use-sidebar-type';
import { IconBuilding, IconShield } from '@tabler/icons-react';
import { LayoutDashboard } from 'lucide-react';

/**
 * SidebarTypeSwitcher - Component to manually switch between sidebar types
 * 
 * Allows users to toggle between:
 * - Company sidebar (company-scoped views)
 * - System Admin sidebar (system-wide views)
 */
export function SidebarTypeSwitcher() {
  const { sidebarType, setSidebarType } = useSidebarType();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {sidebarType === 'company' ? (
            <>
              <IconBuilding className="size-4" />
              <span>Company View</span>
            </>
          ) : (
            <>
              <IconShield className="size-4" />
              <span>System Admin</span>
            </>
          )}
          <LayoutDashboard className="size-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSidebarType('company')}
          className="gap-2"
        >
          <IconBuilding className="size-4" />
          <span>Company View</span>
          {sidebarType === 'company' && (
            <span className="ml-auto text-xs">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSidebarType('system-admin')}
          className="gap-2"
        >
          <IconShield className="size-4" />
          <span>System Admin</span>
          {sidebarType === 'system-admin' && (
            <span className="ml-auto text-xs">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}