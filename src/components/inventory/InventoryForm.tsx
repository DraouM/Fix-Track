'use client';

import React from 'react';
import { useForm } from 'react-hook-form'; // FormProvider will come from ui/form
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  Form, // Import Form alias from ui/form
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PHONE_BRANDS, ITEM_TYPES, inventoryItemSchema, type InventoryFormValues, type InventoryItem, PhoneBrand, ItemType } from '@/types/inventory';
import { Icons } from '@/components/icons';

interface InventoryFormProps {
  onSuccess?: () => void;
  itemToEdit?: InventoryItem | null;
  onSubmitForm: (data: InventoryFormValues) => void;
}

export function InventoryForm({ onSuccess, itemToEdit, onSubmitForm }: InventoryFormProps) {
  const { toast } = useToast();

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
    toast({
      title: itemToEdit ? 'Item Updated' : 'Item Added',
      description: `${data.itemName} has been successfully ${itemToEdit ? 'updated' : 'added'}.`,
    });
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}> {/* Use Form alias */}
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
              <FormItem>
                <FormLabel>Phone Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PHONE_BRANDS.filter(brand => brand !== 'All').map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ITEM_TYPES.filter(type => type !== 'All').map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

    
