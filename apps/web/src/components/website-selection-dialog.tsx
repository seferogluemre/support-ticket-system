import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '#/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '#/components/ui/dialog';
import { ScrollArea } from '#/components/ui/scroll-area';
import { useWebsiteSearch } from '#/hooks/use-website-search';
import type { WebsiteResponse } from '#/types/api';
import { Globe } from 'lucide-react';
import { useState } from 'react';

interface WebsiteSelectionDialogProps {
  open: boolean;
  onWebsiteSelect: (website: WebsiteResponse) => void;
}

export function WebsiteSelectionDialog({ open, onWebsiteSelect }: WebsiteSelectionDialogProps) {
  const [search, setSearch] = useState('');

  // Use shared website search logic (will use backend for system admin)
  const { websites, isLoading, isSystemAdmin } = useWebsiteSearch({
    search,
    enabled: open,
  });

  const handleSelect = (website: WebsiteResponse) => {
    onWebsiteSelect(website);
    setSearch('');
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Website Seçin</DialogTitle>
          <DialogDescription>
            Devam etmek için bir website seçmeniz gerekmektedir
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Command shouldFilter={!isSystemAdmin}>
            {/* System admin: backend search, Regular user: frontend search */}
            <CommandInput
              placeholder="Website ara..."
              value={search}
              onValueChange={setSearch}
            />
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>
            ) : websites.length === 0 ? (
              <CommandEmpty>Website bulunamadı.</CommandEmpty>
            ) : (
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {websites.map((website) => (
                    <CommandItem
                      key={website.uuid}
                      value={website.uuid}
                      keywords={[website.name]}
                      onSelect={() => handleSelect(website)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{website.name}</span>
                          {(website as WebsiteResponse & { domains?: Array<{ domain: string }> })
                            .domains?.[0] && (
                            <span className="text-xs text-muted-foreground">
                              {
                                (
                                  website as WebsiteResponse & {
                                    domains?: Array<{ domain: string }>;
                                  }
                                ).domains![0].domain
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            )}
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}
