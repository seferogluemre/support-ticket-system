import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '#/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { ScrollArea } from '#/components/ui/scroll-area';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '#/components/ui/sidebar';
import { useCompanyContext } from '#/context/company-context';
import { useCompanySearch } from '#/hooks/use-company-search';
import { cn } from '#/lib/utils';
import type { CompanyResponse } from '#/types/api';
import { Check, ChevronsUpDown } from 'lucide-react';
import { IconBuilding } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { currentCompany, setCurrentCompany, canSwitchCompany } = useCompanyContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Use shared company search logic
  const { companies: searchCompanies, isLoading, hasSystemScope } = useCompanySearch({
    search,
    enabled: open,
  });

  // Sort alphabetically (searchCompanies already has correct logic from hook)
  const sortedCompanies = useMemo(() => {
    return [...searchCompanies].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [searchCompanies]);

  const handleSelect = (company: CompanyResponse) => {
    setCurrentCompany(company);
    setOpen(false);
    setSearch('');
    // Don't navigate - stay on current page when switching companies
  };

  // Always render for system admin, or for users with multiple companies
  if (!canSwitchCompany) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn('data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground', className)}
              style={{padding: "calc(var(--spacing) * 2) !important"}}
              tooltip={currentCompany?.name ?? 'Company Seçiniz'}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {currentCompany?.logoFileSrc ? (
                  <img
                    src={currentCompany.logoFileSrc}
                    alt={currentCompany.name}
                    className="size-6 rounded"
                  />
                ) : (
                  <IconBuilding className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentCompany?.name ?? 'Company Seçiniz'}</span>
                <span className="truncate text-xs">Company</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={!hasSystemScope}>
          {/* System admin: disable client-side filtering (backend search) */}
          {/* Regular user: enable client-side filtering (frontend search) */}
          <CommandInput placeholder="Company ara..." value={search} onValueChange={setSearch} />
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : sortedCompanies.length === 0 ? (
            <CommandEmpty>Company bulunamadı.</CommandEmpty>
          ) : (
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {sortedCompanies.map((company) => (
                  <CommandItem
                    key={company.uuid}
                    value={company.uuid}
                    keywords={[company.name]} // For client-side search
                    onSelect={() => handleSelect(company)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentCompany?.uuid === company.uuid ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex items-center gap-2">
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
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}