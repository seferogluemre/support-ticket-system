import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar';
import { useCompanyContext } from '#/context/company-context';
import { useSession } from '#/hooks/use-session';
import { hasSystemScope } from '#/lib/auth';
import { cn } from '#/lib/utils';
import type { CompanyResponse } from '#/types/api';
import { IconBuilding } from '@tabler/icons-react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CompanySectionProps {
  className?: string;
}

/**
 * CompanySection - Unified company display/selector for sidebar header
 *
 * Variations:
 * 1. Single company (user has only one membership) → Disabled card display
 * 2. Multiple companies (user has multiple memberships) → Company switcher dropdown
 * 3. System admin → Disabled card display (company already selected before entering)
 */
export function CompanySection({ className }: CompanySectionProps) {
  const { currentCompany, setCurrentCompany, companies } = useCompanyContext();
  const { session } = useSession();
  const [open, setOpen] = useState(false);

  const userHasSystemScope = hasSystemScope(session);

  // Sort companies alphabetically
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [companies]);

  const handleSelect = (company: CompanyResponse) => {
    setCurrentCompany(company);
    setOpen(false);
  };

  // Determine if we should show the switcher or a static card
  // System admin: always show as disabled card (they already selected a company)
  // Single company user: show as disabled card
  // Multi company user (non-system-admin with multiple memberships): show as switcher
  const isMultiCompanyUser = companies.length > 1 && !userHasSystemScope;
  const showAsSwitcher = isMultiCompanyUser;

  // For single company users, auto-select the only company
  // For multi-company users, displayCompany can be null (they need to select)
  const displayCompany = currentCompany ?? (companies.length === 1 ? companies[0] : null);

  // Don't render if:
  // - No company to display AND not a multi-company user (who needs to select)
  if (!displayCompany && !isMultiCompanyUser) {
    return null;
  }

  // Static card display for single company users or system admins
  // At this point, displayCompany must exist (guarded by early return above)
  if (!showAsSwitcher && displayCompany) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(
              'cursor-default hover:bg-transparent active:bg-transparent',
              className
            )}
            style={{ padding: 'calc(var(--spacing) * 2) !important' }}
            tooltip={displayCompany.name}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {displayCompany.logoFileSrc ? (
                <img
                  src={displayCompany.logoFileSrc}
                  alt={displayCompany.name}
                  className="size-6 rounded"
                />
              ) : (
                <IconBuilding className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayCompany.name}</span>
              <span className="truncate text-xs text-muted-foreground">Company</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Switcher display for multi-company users (simple dropdown, no search)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                className
              )}
              style={{ padding: 'calc(var(--spacing) * 2) !important' }}
              tooltip={displayCompany?.name ?? 'Company Seçiniz'}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {displayCompany?.logoFileSrc ? (
                  <img
                    src={displayCompany.logoFileSrc}
                    alt={displayCompany.name}
                    className="size-6 rounded"
                  />
                ) : (
                  <IconBuilding className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {displayCompany?.name ?? 'Company Seçiniz'}
                </span>
                <span className="truncate text-xs text-muted-foreground">Company</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
          >
            {sortedCompanies.map((company) => (
              <DropdownMenuItem
                key={company.uuid}
                onClick={() => handleSelect(company)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {company.logoFileSrc ? (
                    <img
                      src={company.logoFileSrc}
                      alt={company.name}
                      className="size-4 rounded"
                    />
                  ) : (
                    <IconBuilding className="size-4 shrink-0" />
                  )}
                </div>
                <span className="font-medium flex-1">{company.name}</span>
                {displayCompany?.uuid === company.uuid && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}