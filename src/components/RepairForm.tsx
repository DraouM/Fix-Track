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
  Form, // Import Form from ui/form
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useRepairContext } from '@/context/RepairContext';
import { useInventoryContext } from '@/context/InventoryContext';
import type { Repair, RepairStatus, UsedPart } from '@/types/repair';
import type { InventoryItem } from '@/types/inventory';
import { analyzeRepairIssue, type AnalyzeRepairIssueInput, type AnalyzeRepairIssueOutput } from '@/ai/flows/analyze-repair-issue';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const defaultValues = repairToEdit
    ? {
        ...repairToEdit,
        estimatedCost: repairToEdit.estimatedCost.toString(),
        // Ensure usedParts quantities and costs are strings for form inputs initially
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
      quantity: "1", // Default to 1, user can change
      unitCost: part.buyingPrice.toString(), // Use buying price as cost
    });
    setSearchTerm(''); 
  };
  
  const handleAnalyzeIssue = async () => {
    const issueDescription = form.getValues("issueDescription");
    const deviceModel = form.getValues("deviceModel");
    const deviceBrand = form.getValues("deviceBrand");

    if (!issueDescription || !deviceModel || !deviceBrand) {
      toast({
        title: "Missing Information",
        description: "Please fill in device brand, model, and issue description to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const input: AnalyzeRepairIssueInput = { issueDescription, deviceModel, deviceBrand };
      const result: AnalyzeRepairIssueOutput = await analyzeRepairIssue(input);
      
      toast({
        title: "AI Analysis Complete",
        description: (
          <div>
            <p>Possible Causes: {result.possibleCauses.join(', ')}</p>
            <p>Suggested Solutions: {result.suggestedSolutions.join(', ')}</p>
            {result.partsNeeded && result.partsNeeded.length > 0 && (
              <>
                <p className="font-semibold mt-2">Suggested Parts:</p>
                <ul className="list-disc list-inside">
                  {result.partsNeeded.map((part, index) => <li key={index}>{part}</li>)}
                </ul>
              </>
            )}
          </div>
        ),
        duration: 9000,
      });

    } catch (error) {
      console.error("Error analyzing repair issue:", error);
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze the repair issue at this time.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = (data: RepairFormValues) => {
    const processedData = {
      ...data,
      estimatedCost: parseFloat(data.estimatedCost as unknown as string).toString(),
      usedParts: data.usedParts?.map(p => ({
        ...p,
        quantity: parseInt(p.quantity as unknown as string, 10), // Convert string quantity to number
        unitCost: parseFloat(p.unitCost as unknown as string), // Convert string unitCost to number
      })) || [],
    };

    if (repairToEdit) {
      updateRepair({ 
        ...processedData, 
        id: repairToEdit.id, 
        dateReceived: repairToEdit.dateReceived, // Preserve original dateReceived
        statusHistory: repairToEdit.statusHistory // Preserve original statusHistory
      });
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
    <Form {...form}> {/* Use Form from @/components/ui/form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <ScrollArea className="max-h-[70vh] pr-6">
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
          <Button type="button" onClick={handleAnalyzeIssue} variant="outline" className="mt-2 w-full md:w-auto" disabled={isAnalyzing}>
              {isAnalyzing ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.search className="mr-2 h-4 w-4" />}
              Analyze Issue with AI
          </Button>

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

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end p-3 border rounded-md mb-3">
                <FormField
                  control={form.control}
                  name={`usedParts.${index}.name`}
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`usedParts.${index}.quantity`}
                  render={({ field }) => {
                    const partId = form.getValues(`usedParts.${index}.partId`);
                    const inventoryItem = getItemById(partId);
                    const maxQuantity = inventoryItem?.quantityInStock ?? 0;
                     return (
                        <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            {...field} 
                            min="1" 
                            max={maxQuantity.toString()} // Current stock as max
                            onChange={(e) => {
                                let value = parseInt(e.target.value, 10);
                                if (isNaN(value)) value = 1; // Default to 1 if input is not a number
                                if (value > maxQuantity) value = maxQuantity; // Cap at max stock
                                if (value < 1) value = 1; // Ensure minimum is 1
                                field.onChange(value.toString());
                            }}
                            />
                        </FormControl>
                        <FormMessage />
                        {maxQuantity === 0 && <p className="text-xs text-destructive">Out of stock</p>}
                        </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name={`usedParts.${index}.unitCost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} step="0.01" readOnly className="bg-muted/50" />
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
            ))}
            {fields.length === 0 && <p className="text-sm text-muted-foreground">No parts added yet.</p>}
            
             {fields.length > 0 && (
                <div className="mt-4 text-right font-semibold">
                    Total Parts Cost: ${totalPartsCost.toFixed(2)}
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting || isAnalyzing}>
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
