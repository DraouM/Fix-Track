
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from '@/hooks/use-toast'; // Updated import
import { PHONE_BRANDS, ITEM_TYPES, inventoryItemSchema, type InventoryFormValues, type InventoryItem } from '@/types/inventory';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface InventoryFormProps {
  onSuccess?: () => void;
  itemToEdit?: InventoryItem | null;
  onSubmitForm: (data: InventoryFormValues) => void;
}

export function InventoryForm({ onSuccess, itemToEdit, onSubmitForm }: InventoryFormProps) {
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [itemTypePopoverOpen, setItemTypePopoverOpen] = useState(false);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: itemToEdit
      ? {
          ...itemToEdit,
          buyingPrice: itemToEdit.buyingPrice.toString(), 
          sellingPrice: itemToEdit.sellingPrice.toString(), 
          quantityInStock: itemToEdit.quantityInStock?.toString() ?? '',
        }
      : {
          itemName: '',
          phoneBrand: undefined, 
          itemType: undefined,
          buyingPrice: '',
          sellingPrice: '',
          quantityInStock: '',
        },
  });

  const handleSubmit = (data: InventoryFormValues) => {
    onSubmitForm(data);
    toast.success(`${data.itemName} has been successfully ${itemToEdit ? 'updated' : 'added'}.`);
    form.reset({ 
        itemName: '', 
        phoneBrand: undefined, 
        itemType: undefined, 
        buyingPrice: '', 
        sellingPrice: '', 
        quantityInStock: '' 
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., iPhone 13 Screen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phoneBrand"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Phone Brand</FormLabel>
                <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandPopoverOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? PHONE_BRANDS.find(
                              (brand) => brand === field.value
                            )
                          : "Select brand"}
                        <Icons.chevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search brand..." />
                      <CommandList>
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          {PHONE_BRANDS.filter(b => b !== 'All').map((brand) => (
                            <CommandItem
                              value={brand}
                              key={brand}
                              onSelect={() => {
                                form.setValue("phoneBrand", brand);
                                setBrandPopoverOpen(false);
                              }}
                            >
                              <Icons.check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  brand === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {brand}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemType"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Item Type</FormLabel>
                <Popover open={itemTypePopoverOpen} onOpenChange={setItemTypePopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={itemTypePopoverOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? ITEM_TYPES.find(
                              (itemType) => itemType === field.value
                            )
                          : "Select type"}
                        <Icons.chevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search item type..." />
                      <CommandList>
                        <CommandEmpty>No item type found.</CommandEmpty>
                        <CommandGroup>
                          {ITEM_TYPES.filter(it => it !== 'All').map((itemType) => (
                            <CommandItem
                              value={itemType}
                              key={itemType}
                              onSelect={() => {
                                form.setValue("itemType", itemType);
                                setItemTypePopoverOpen(false);
                              }}
                            >
                              <Icons.check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  itemType === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {itemType}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buying Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 50.00" {...field} step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100.00" {...field} step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="quantityInStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity in Stock (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 10" {...field} min="0" step="1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : itemToEdit ? (
            <Icons.edit className="mr-2 h-4 w-4" />
          ) : (
            <Icons.plusCircle className="mr-2 h-4 w-4" />
          )}
          {itemToEdit ? 'Update Item' : 'Add Item'}
        </Button>
      </form>
    </Form>
  );
}
