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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";
import type { InventoryItem } from "@/types/inventory";

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
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t('repairs.searchParts')} />
          <CommandList>
            <CommandEmpty>{t('repairs.noPartsFound')}</CommandEmpty>
            <CommandGroup>
              {inventoryItems
                .filter(
                  (item) => item.quantityInStock && item.quantityInStock > 0
                ) // Only show items with stock
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={(currentValue) => {
                      const selectedItem = inventoryItems.find(
                        (i) => i.id === currentValue
                      );
                      handleSelect(selectedItem || null);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedItem?.id === item.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{item.itemName}</span>
                      <span className="text-xs text-gray-500">
                        {t('repairs.inStock', { count: item.quantityInStock })} | {t('repairs.price', { symbol: '$', amount: item.sellingPrice.toFixed(2) })}
                      </span>
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
