"use client";

import { Button } from "#/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface AsyncComboboxItem {
  value: string;
  label: string;
}

interface AsyncComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch: (query: string) => Promise<AsyncComboboxItem[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  debounceMs?: number;
}

const AsyncCombobox = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No results found.",
  className,
  debounceMs = 300,
}: AsyncComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AsyncComboboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AsyncComboboxItem | null>(null);

  // Update selected item when value changes externally
  useEffect(() => {
    if (!value) {
      setSelectedItem(null);
    }
  }, [value]);

  const performSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
      
      // Update selected item label if found in results
      if (value) {
        const found = results.find((item) => item.value === value);
        if (found && (!selectedItem || selectedItem.label !== found.label)) {
          setSelectedItem(found);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch, value, selectedItem]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(search);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [search, performSearch, debounceMs]);

  const handleSelect = (selectedValue: string) => {
    const item = searchResults.find((item) => item.value === selectedValue)
      || (selectedItem?.value === selectedValue ? selectedItem : null);
    if (item) {
      setSelectedItem(item);
      onChange?.(selectedValue);
    }
    setOpen(false);
  };

  // Combine selected item with search results, avoiding duplicates
  const displayResults = useMemo(() => {
    if (selectedItem) {
      const isSelectedInResults = searchResults.some((item) => item.value === selectedItem.value);
      if (!isSelectedInResults) {
        return [selectedItem, ...searchResults];
      }
    }
    return searchResults;
  }, [searchResults, selectedItem]);

  const hasResults = displayResults.length > 0;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          role="combobox"
          variant="outline"
        >
          {selectedItem?.label || placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{
          width: 'var(--radix-popover-trigger-width)',
          minWidth: 'var(--radix-popover-trigger-width)'
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            value={search}
          />
          <CommandList>
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">
                  Searching...
                </span>
              </div>
            ) : (
              <>
                {!search && !hasResults && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Start typing to search
                  </div>
                )}
                {search && !hasResults && !isSearching && (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                )}
                {hasResults && (
                  <CommandGroup>
                    {displayResults.map((item) => (
                      <CommandItem
                        key={item.value}
                        onSelect={() => handleSelect(item.value)}
                        value={item.value}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            value === item.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { AsyncCombobox };
export type { AsyncComboboxItem, AsyncComboboxProps };

