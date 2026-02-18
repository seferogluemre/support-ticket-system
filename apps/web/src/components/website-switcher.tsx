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
import { useWebsiteContext } from '#/context/website-context';
import { useWebsiteSearch } from '#/hooks/use-website-search';
import { cn } from '#/lib/utils';
import type { WebsiteResponse } from '#/types/api';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { useMemo, useState } from 'react';

interface WebsiteSwitcherProps {
  className?: string;
}

export function WebsiteSwitcher({ className }: WebsiteSwitcherProps) {
  const { currentWebsite, setCurrentWebsite, canSwitchWebsite } = useWebsiteContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Use shared website search logic
  const { websites: searchWebsites, isLoading, isSystemAdmin } = useWebsiteSearch({
    search,
    enabled: open,
  });

  // Sort alphabetically (searchWebsites already has correct logic from hook)
  const sortedWebsites = useMemo(() => {
    return [...searchWebsites].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [searchWebsites]);

  const handleSelect = (website: WebsiteResponse) => {
    setCurrentWebsite(website);
    setOpen(false);
    setSearch('');
  };

  // Always render for system admin, or for users with multiple websites
  if (!canSwitchWebsite) {
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
              tooltip={currentWebsite?.name ?? 'Website Seçiniz'}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentWebsite?.name ?? 'Website Seçiniz'}</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={!isSystemAdmin}>
          {/* System admin: disable client-side filtering (backend search) */}
          {/* Regular user: enable client-side filtering (frontend search) */}
          <CommandInput placeholder="Website ara..." value={search} onValueChange={setSearch} />
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : sortedWebsites.length === 0 ? (
            <CommandEmpty>Website bulunamadı.</CommandEmpty>
          ) : (
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {sortedWebsites.map((website) => (
                  <CommandItem
                    key={website.uuid}
                    value={website.uuid}
                    keywords={[website.name]} // For client-side search
                    onSelect={() => handleSelect(website)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentWebsite?.uuid === website.uuid ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{website.name}</span>
                      {(website as WebsiteResponse & { domains?: Array<{ domain: string }> })
                        .domains?.[0] && (
                        <span className="text-xs text-muted-foreground">
                          {
                            (website as WebsiteResponse & { domains?: Array<{ domain: string }> })
                              .domains![0].domain
                          }
                        </span>
                      )}
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
