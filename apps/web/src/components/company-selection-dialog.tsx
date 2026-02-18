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
import { useCompanySearch } from '#/hooks/use-company-search';
import type { CompanyResponse } from '#/types/api';
import { IconBuilding } from '@tabler/icons-react';
import { useState } from 'react';

interface CompanySelectionDialogProps {
  open: boolean;
  onCompanySelect: (company: CompanyResponse) => void;
}

export function CompanySelectionDialog({ open, onCompanySelect }: CompanySelectionDialogProps) {
  const [search, setSearch] = useState('');

  // Use shared company search logic (will use backend for system admin)
  const { companies, isLoading, hasSystemScope } = useCompanySearch({
    search,
    enabled: open,
  });

  const handleSelect = (company: CompanyResponse) => {
    onCompanySelect(company);
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
          <DialogTitle>Company Seçin</DialogTitle>
          <DialogDescription>
            Devam etmek için bir company seçmeniz gerekmektedir
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Command shouldFilter={!hasSystemScope}>
            {/* System admin: backend search, Regular user: frontend search */}
            <CommandInput
              placeholder="Company ara..."
              value={search}
              onValueChange={setSearch}
            />
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>
            ) : companies.length === 0 ? (
              <CommandEmpty>Company bulunamadı.</CommandEmpty>
            ) : (
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {companies.map((company) => (
                    <CommandItem
                      key={company.uuid}
                      value={company.uuid}
                      keywords={[company.name]}
                      onSelect={() => handleSelect(company)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                          {company.logoFileSrc ? (
                            <img
                              src={company.logoFileSrc}
                              alt={company.name}
                              className="size-4 rounded"
                            />
                          ) : (
                            <IconBuilding className="size-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{company.name}</span>
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
