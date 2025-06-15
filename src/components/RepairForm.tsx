
// src/components/RepairForm.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useRepairContext } from '@/context/RepairContext';
import { useInventoryContext } from '@/context/InventoryContext';
import type { Repair, RepairStatus, PaymentStatus } from '@/types/repair'; // Import PaymentStatus
import type { InventoryItem } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const repairFormSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  phoneNumber: z.string()
    .regex(/^0[567]\d{8}$/, { message: "Phone number must be a 10-digit Algerian number (e.g., 05XXXXXXXX)." })
    .optional()
    .or(z.literal('')),
  deviceBrand: z.string().min(1, { message: "Device brand is required." }),
  deviceModel: z.string().min(1, { message: "Device model is required." }),
  issueDescription: z.string().min(10, { message: "Issue description must be at least 10 characters." }),
  estimatedCost: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive({ message: "Estimated cost must be a positive number." })
  ),
  repairStatus: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled'] as [RepairStatus, ...RepairStatus[]]),
  paymentStatus: z.enum(['Unpaid', 'Paid', 'Partially Paid', 'Refunded'] as [PaymentStatus, ...PaymentStatus[]]), // Added paymentStatus
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

const PREDEFINED_BRANDS = [
  { value: 'Apple', label: 'Apple' },
  { value: 'Samsung', label: 'Samsung' },
  { value: 'Google', label: 'Google' },
  { value: 'OnePlus', label: 'OnePlus' },
  { value: 'Xiaomi', label: 'Xiaomi' },
  { value: 'Huawei', label: 'Huawei' },
  { value: 'Oppo', label: 'Oppo' },
  { value: 'Vivo', label: 'Vivo' },
  { value: 'Realme', label: 'Realme' },
  { value: 'Sony', label: 'Sony' },
  { value: 'LG', label: 'LG' },
  { value: 'Motorola', label: 'Motorola' },
  { value: 'Nokia', label: 'Nokia' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Condor', label: 'Condor' },
  { value: 'Iris', label: 'Iris' },
  { value: 'StreamSystem', label: 'Stream System' },
  { value: 'Other', label: 'Other' },
];

const getPaymentStatusDotBadgeClass = (status: PaymentStatus): string => {
  switch (status) {
    case 'Paid':
      return 'bg-green-500';
    case 'Unpaid':
      return 'bg-red-500'; // Or use theme's destructive color if preferred: 'bg-destructive'
    case 'Partially Paid':
      return 'bg-yellow-500';
    case 'Refunded':
      return 'bg-gray-400'; // Or use theme's muted/outline
    default:
      return 'bg-gray-400';
  }
};


export function RepairForm({ onSuccess, repairToEdit }: RepairFormProps) {
  const { repairs, addRepair, updateRepair } = useRepairContext();
  const { inventoryItems, getItemById } = useInventoryContext();
  const { toast } = useToast();

  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  const memoizedDefaultValues = useMemo(() => {
    return repairToEdit
      ? {
          ...repairToEdit,
          phoneNumber: repairToEdit.phoneNumber || '',
          estimatedCost: parseFloat(repairToEdit.estimatedCost),
          paymentStatus: repairToEdit.paymentStatus || 'Unpaid',
          usedParts: repairToEdit.usedParts?.map(p => ({
            ...p,
            quantity: p.quantity,
            unitCost: p.unitCost,
          })) || [],
        }
      : {
          customerName: '',
          phoneNumber: '',
          deviceBrand: '',
          deviceModel: '',
          issueDescription: '',
          estimatedCost: 0,
          repairStatus: 'Pending' as RepairStatus,
          paymentStatus: 'Unpaid' as PaymentStatus,
          usedParts: [],
        };
  }, [repairToEdit]);

  const newFormDefaults = useMemo(() => ({
      customerName: '',
      phoneNumber: '',
      deviceBrand: '',
      deviceModel: '',
      issueDescription: '',
      estimatedCost: 0,
      repairStatus: 'Pending' as RepairStatus,
      paymentStatus: 'Unpaid' as PaymentStatus,
      usedParts: [],
  }), []);


  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: memoizedDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts",
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [availableParts, setAvailableParts] = useState<InventoryItem[]>([]);

  useEffect(() => {
    form.reset(memoizedDefaultValues);
  }, [memoizedDefaultValues, form.reset]);

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
      quantity: 1,
      unitCost: part.buyingPrice,
    });
    setSearchTerm('');
  };

  const onSubmit = (data: RepairFormValues) => {
    const processedData = {
      ...data,
      phoneNumber: data.phoneNumber || undefined,
      estimatedCost: data.estimatedCost.toString(), // Ensure estimatedCost is string for Repair type
      paymentStatus: data.paymentStatus,
      usedParts: data.usedParts?.map(p => ({
        ...p,
      })) || [],
    };

    if (repairToEdit) {
      updateRepair({
        ...repairToEdit,
        ...processedData,
      } as Repair); // Ensure all fields of Repair are present
      toast({ title: 'Repair Updated', description: `Repair for ${data.customerName} has been updated.` });
    } else {
      addRepair(processedData as Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>);
      toast({ title: 'Repair Added', description: `New repair for ${data.customerName} has been added.` });
    }

    form.reset(newFormDefaults);
    onSuccess?.();
  };

  const totalPartsCost = form.watch('usedParts')?.reduce((acc, part) => {
    const quantity = part.quantity || 0;
    const cost = part.unitCost || 0;
    return acc + (quantity * cost);
  }, 0) || 0;

  const uniqueDeviceModels = React.useMemo(() => {
    const models = new Set<string>();
    repairs.forEach(repair => models.add(repair.deviceModel));
    const currentFormModel = form.getValues("deviceModel");
    if(currentFormModel) models.add(currentFormModel);
    return Array.from(models).map(model => ({ value: model, label: model }));
  }, [repairs, form]);

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
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="05XXXXXXXX" {...field} />
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
              <FormItem className="flex flex-col">
                <FormLabel>Device Brand</FormLabel>
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
                          ? PREDEFINED_BRANDS.find(
                              (brand) => brand.value === field.value
                            )?.label
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
                          {PREDEFINED_BRANDS.map((brand) => (
                            <CommandItem
                              value={brand.label}
                              key={brand.value}
                              onSelect={() => {
                                form.setValue("deviceBrand", brand.value);
                                setBrandPopoverOpen(false);
                              }}
                            >
                              <Icons.check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  brand.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {brand.label}
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
            name="deviceModel"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Device Model</FormLabel>
                <Popover open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={modelPopoverOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select or type model"}
                        <Icons.chevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command filter={(value, search) => {
                        if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                        return 0;
                      }}
                    >
                      <CommandInput
                        placeholder="Search or type model..."
                        value={field.value}
                        onValueChange={(currentInputValue) => {
                           form.setValue("deviceModel", currentInputValue);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>No model found. Type to add new.</CommandEmpty>
                        <CommandGroup>
                          {uniqueDeviceModels.map((model) => (
                            <CommandItem
                              value={model.label}
                              key={model.value}
                              onSelect={(currentValue) => {
                                form.setValue("deviceModel", model.label); // Ensure label is set
                                setModelPopoverOpen(false);
                              }}
                            >
                              <Icons.check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  model.label === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {model.label}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 99.99" {...field} value={String(field.value || '')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} step="0.01" />
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
                <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(['Unpaid', 'Paid', 'Partially Paid', 'Refunded'] as PaymentStatus[]).map(status => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          <Badge className={cn("mr-2 h-2 w-2 p-0 rounded-full", getPaymentStatusDotBadgeClass(status))} />
                          {status}
                        </div>
                      </SelectItem>
                    ))}
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
                          value={String(quantityField.value || '')}
                          min="1"
                          max={effectiveMaxQuantity > 0 ? effectiveMaxQuantity.toString() : "1"}
                          onChange={(e) => {
                            let value = parseInt(e.target.value, 10);
                            if (isNaN(value)) value = 1;

                            const maxQty = effectiveMaxQuantity > 0 ? effectiveMaxQuantity : 1;
                            if (value > maxQty) value = maxQty;
                            if (value < 1) value = 1;

                            quantityField.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {inventoryItem && currentInventoryStock === 0 && quantityCurrentlyInThisRepair === 0 && (
                        <p className="text-xs text-destructive">Out of stock</p>
                      )}
                       {inventoryItem && currentInventoryStock < (Number(quantityField.value) || 0) - quantityCurrentlyInThisRepair && (
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
                        <Input type="number" {...costField} value={String(costField.value || '')} step="0.01" readOnly className="bg-muted/50" />
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

