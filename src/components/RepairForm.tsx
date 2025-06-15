// src/components/RepairForm.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; 
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useRepairContext } from '@/context/RepairContext';
import { useInventoryContext } from '@/context/InventoryContext';
import type { Repair, RepairStatus } from '@/types/repair';
import type { InventoryItem } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area';

const repairFormSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: "Phone number must be in XXX-XXX-XXXX format." }),
  deviceBrand: z.string().min(1, { message: "Device brand is required." }),
  deviceModel: z.string().min(1, { message: "Device model is required." }),
  issueDescription: z.string().min(10, { message: "Issue description must be at least 10 characters." }),
  estimatedCost: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive({ message: "Estimated cost must be a positive number." })
  ),
  repairStatus: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled'] as [RepairStatus, ...RepairStatus[]]),
  usedParts: z.array(z.object({
    partId: z.string(),
    name: z.string(),
    itemType: z.string(),
    phoneBrand: z.string(),
    quantity: z.preprocess(
      (val) => parseInt(z.string().parse(val), 10),
      z.number().int().min(1, "Quantity must be at least 1.")
    ),
    unitCost: z.preprocess(
      (val) => parseFloat(z.string().parse(val)),
      z.number().positive("Unit cost must be positive.")
    ),
  })).optional(),
});

export type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairFormProps {
  onSuccess?: () => void;
  repairToEdit?: Repair | null;
}

export function RepairForm({ onSuccess, repairToEdit }: RepairFormProps) {
  const { addRepair, updateRepair } = useRepairContext();
  const { inventoryItems, getItemById } = useInventoryContext();
  const { toast } = useToast();

  const defaultValues = repairToEdit
    ? {
        ...repairToEdit,
        estimatedCost: repairToEdit.estimatedCost.toString(),
        usedParts: repairToEdit.usedParts?.map(p => ({
          ...p,
          quantity: p.quantity.toString(), 
          unitCost: p.unitCost.toString(), 
        })) || [],
      }
    : {
        customerName: '',
        phoneNumber: '',
        deviceBrand: '',
        deviceModel: '',
        issueDescription: '',
        estimatedCost: '',
        repairStatus: 'Pending' as RepairStatus,
        usedParts: [],
      };

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts",
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [availableParts, setAvailableParts] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (repairToEdit) {
      form.reset(defaultValues);
    }
  }, [repairToEdit, form, defaultValues]);

  useEffect(() => {
    if (searchTerm) {
      setAvailableParts(
        inventoryItems.filter(item =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (item.quantityInStock ?? 0) > 0 &&
          !fields.some(usedPart => usedPart.partId === item.id)
        )
      );
    } else {
      setAvailableParts([]);
    }
  }, [searchTerm, inventoryItems, fields]);

  const handleAddPart = (part: InventoryItem) => {
    append({
      partId: part.id,
      name: part.itemName,
      itemType: part.itemType,
      phoneBrand: part.phoneBrand,
      quantity: "1",
      unitCost: part.buyingPrice.toString(),
    });
    setSearchTerm('');
  };

  const onSubmit = (data: RepairFormValues) => {
    const processedData = {
      ...data,
      estimatedCost: parseFloat(data.estimatedCost as unknown as string).toString(), 
      usedParts: data.usedParts?.map(p => ({
        ...p,
        quantity: parseInt(p.quantity as unknown as string, 10),
        unitCost: parseFloat(p.unitCost as unknown as string),
      })) || [],
    };

    if (repairToEdit) {
      updateRepair({
        ...processedData,
        id: repairToEdit.id,
        dateReceived: repairToEdit.dateReceived,
        statusHistory: repairToEdit.statusHistory
      } as Repair); 
      toast({ title: 'Repair Updated', description: `Repair for ${data.customerName} has been updated.` });
    } else {
      addRepair(processedData as Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>);
      toast({ title: 'Repair Added', description: `New repair for ${data.customerName} has been added.` });
    }
    form.reset(defaultValues); 
    onSuccess?.();
  };

  const totalPartsCost = form.watch('usedParts')?.reduce((acc, part) => {
    const quantity = parseInt(part.quantity as unknown as string, 10) || 0;
    const cost = parseFloat(part.unitCost as unknown as string) || 0;
    return acc + (quantity * cost);
  }, 0) || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="XXX-XXX-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="deviceBrand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Apple, Samsung" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deviceModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., iPhone 13, Galaxy S22" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="issueDescription"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Issue Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the issue with the device..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 99.99" {...field} step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repairStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repair Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-lg font-medium mb-2">Used Parts</h3>
          <div className="mb-4">
            <FormLabel htmlFor="part-search">Add Part from Inventory</FormLabel>
            <div className="flex gap-2">
              <Input
                id="part-search"
                placeholder="Search inventory by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {availableParts.length > 0 && searchTerm && (
              <ScrollArea className="h-[150px] mt-2 border rounded-md">
                <div className="p-2">
                  {availableParts.map(part => (
                    <div key={part.id}
                         className="flex justify-between items-center p-2 hover:bg-accent/50 rounded-md cursor-pointer"
                         onClick={() => handleAddPart(part)}>
                      <span>{part.itemName} (Stock: {part.quantityInStock})</span>
                      <Button type="button" size="sm" variant="outline" >Add</Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {fields.map((field, index) => {
            const partId = form.getValues(`usedParts.${index}.partId`);
            const inventoryItem = getItemById(partId);
            const currentInventoryStock = inventoryItem?.quantityInStock ?? 0;

            let quantityCurrentlyInThisRepair = 0;
            if (repairToEdit && repairToEdit.usedParts) {
              const existingPartInThisRepair = repairToEdit.usedParts.find(p => p.partId === partId);
              if (existingPartInThisRepair) {
                quantityCurrentlyInThisRepair = Number(existingPartInThisRepair.quantity) || 0;
              }
            }
            
            const effectiveMaxQuantity = currentInventoryStock + quantityCurrentlyInThisRepair;

            return (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end p-3 border rounded-md mb-3">
                <FormField
                  control={form.control}
                  name={`usedParts.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input {...nameField} readOnly className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`usedParts.${index}.quantity`}
                  render={({ field: quantityField }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...quantityField}
                          min="1"
                          max={effectiveMaxQuantity > 0 ? effectiveMaxQuantity.toString() : "1"} 
                          onChange={(e) => {
                            let value = parseInt(e.target.value, 10);
                            if (isNaN(value)) value = 1;
                            if (value > effectiveMaxQuantity && effectiveMaxQuantity > 0) value = effectiveMaxQuantity;
                            else if (value > 1 && effectiveMaxQuantity <= 0) value = 1; 
                            
                            if (value < 1) value = 1;
                            quantityField.onChange(value.toString());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {inventoryItem && currentInventoryStock === 0 && quantityCurrentlyInThisRepair === 0 && (
                        <p className="text-xs text-destructive">Out of stock</p>
                      )}
                       {inventoryItem && currentInventoryStock < (parseInt(quantityField.value as string, 10) || 0) - quantityCurrentlyInThisRepair && (
                        <p className="text-xs text-destructive">Requested quantity exceeds available stock.</p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`usedParts.${index}.unitCost`}
                  render={({ field: costField }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...costField} step="0.01" readOnly className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Icons.trash className="h-4 w-4" />
                  <span className="sr-only">Remove Part</span>
                </Button>
              </div>
            );
          })}
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No parts added yet.</p>}

           {fields.length > 0 && (
              <div className="mt-4 text-right font-semibold">
                  Total Parts Cost: ${totalPartsCost.toFixed(2)}
              </div>
          )}
        </div>

        <div className="flex justify-end pt-4 sticky bottom-0 bg-background pb-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : repairToEdit ? (
              <Icons.edit className="mr-2 h-4 w-4" />
            ) : (
              <Icons.plusCircle className="mr-2 h-4 w-4" />
            )}
            {repairToEdit ? 'Update Repair' : 'Add Repair'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
