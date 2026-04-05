import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/clientUtils";
import type { InventoryItem } from "@/types/inventory";
import { tokenize } from "@/lib/flexibleSearch";

interface InventoryPartSelectorProps {
  onSelect: (part: InventoryItem | null) => void;
}

export function InventoryPartSelector({
  onSelect,
}: InventoryPartSelectorProps) {
  const { t } = useTranslation();
  const { filteredAndSortedItems: inventoryItems, loading } = useInventory();
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleSelect = useCallback(
    (item: InventoryItem | null) => {
      setSelectedItem(null); // Reset selection so user can add another part easily
      if (item) {
        onSelect(item);
      }
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-xs font-bold text-muted-foreground hover:text-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
        >
          {selectedItem
            ? selectedItem.itemName
            : loading
            ? t('repairs.loadingParts')
            : t('repairs.selectPart')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-lg border-gray-100 dark:border-slate-800 rounded-xl">
        <Command
          filter={(value, search) => {
            const searchTokens = tokenize(search);
            if (searchTokens.length === 0) return 1;
            const targetLower = value.toLowerCase();
            return searchTokens.every(token => targetLower.includes(token)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={t('repairs.searchParts')} className="text-xs" />
          <CommandList className="max-h-[250px]">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              {t('repairs.noPartsFound')}
            </CommandEmpty>
            <CommandGroup>
              {inventoryItems
                .filter(
                  (item) => item.quantityInStock && item.quantityInStock > 0
                ) // Only show items with stock
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.itemName} ${item.phoneBrand || ''} ${item.itemType || ''} ${item.barcode || ''} ${item.id}`}
                    onSelect={() => {
                      handleSelect(item);
                      setOpen(false);
                    }}
                    className="flex justify-between items-center py-2 px-3 border-b border-gray-50 dark:border-slate-800/50 last:border-0 hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 w-full relative">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-xs text-foreground">
                          {item.phoneBrand && item.phoneBrand !== "All" ? `${item.phoneBrand} - ` : ''}{item.itemName}
                        </p>
                        <p className="text-xs font-black text-primary shrink-0 ml-2">
                          {formatCurrency(item.sellingPrice || 0)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-muted-foreground opacity-50" />
                          <Badge variant="secondary" className="text-[9px] font-bold tracking-widest uppercase bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-md px-1.5 py-0">
                            {t('repairs.inStock', { count: item.quantityInStock })}
                          </Badge>
                        </div>
                        <Check
                          className={cn(
                            "h-3 w-3 text-primary transition-opacity",
                            selectedItem?.id === item.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
