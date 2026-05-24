import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  /** Extra haystack tokens for the search index (e.g. company name, phone). */
  keywords?: string[];
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Optional className for the popover content (controls width). */
  contentClassName?: string;
  /** Show a counter line under the dropdown. */
  showCount?: boolean;
}

export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Выберите...",
      searchPlaceholder = "Поиск...",
      emptyMessage = "Ничего не найдено",
      disabled,
      className,
      contentClassName,
      showCount = false,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = React.useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value],
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate text-left">{selected ? selected.label : placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("p-0 w-[var(--radix-popover-trigger-width)] max-w-[640px]", contentClassName)}
        >
          <Command
            filter={(itemValue, search) => {
              if (!search) return 1;
              return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[320px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  // cmdk's default filter searches the `value` prop. Encode
                  // label + description + keywords into it so the filter
                  // works against everything we know about the option.
                  const haystack = [opt.label, opt.description, ...(opt.keywords ?? [])]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <CommandItem
                      key={opt.value}
                      value={`${haystack} ${opt.value}`}
                      onSelect={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === opt.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            {showCount && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Записей: {options.length}
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

SearchableSelect.displayName = "SearchableSelect";
