
'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {useForm, Controller} from 'react-hook-form'; // Removed FormProvider, will use Form from @/components/ui/form
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {
  Form, // Import Form from shadcn/ui
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import {useToast} from '@/hooks/use-toast';
import {useRepairContext} from '@/context/RepairContext';
import {useInventoryContext} from '@/context/InventoryContext';
import {analyzeRepairIssue, AnalyzeRepairIssueOutput} from '@/ai/flows/analyze-repair-issue';
import type { RepairStatus, UsedPart, Repair } from '@/types/repair';
import type { InventoryItem } from '@/types/inventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Trash2 } from 'lucide-react';


const repairStatuses: [RepairStatus, ...RepairStatus[]] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

// Schema does not include usedParts directly, as it's managed separately in the form's state
// and then added to the repair object before submission.
const repairFormSchema = z.object({
  customerName: z.string().min(2, { message: 'Customer Name must be at least 2 characters.' }),
  phoneNumber: z.string().regex(/^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid Phone Number format.' }),
  deviceBrand: z.string().min(2, { message: 'Device Brand must be at least 2 characters.' }),
  deviceModel: z.string().min(1, { message: 'Device Model must be at least 1 character.' }),
  issueDescription: z.string().min(10, { message: 'Issue Description must be at least 10 characters.' }),
  estimatedCost: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid Cost format (e.g., 150.00).' }),
  repairStatus: z.enum(repairStatuses),
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairFormProps {
  onSuccess?: () => void;
  repairToEdit?: Repair | null; // For editing existing repairs
}

export function RepairForm({ onSuccess, repairToEdit }: RepairFormProps) {
  const {toast} = useToast();
  const {addRepair, updateRepair: updateRepairContext} = useRepairContext(); // Renamed to avoid conflict
  const {inventoryItems, loading: inventoryLoading, getItemById } = useInventoryContext();

  const [aiSuggestions, setAiSuggestions] = useState<AnalyzeRepairIssueOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedPartsForRepair, setSelectedPartsForRepair] = useState<UsedPart[]>(repairToEdit?.usedParts || []);
  const [isPartsDialogValid, setIsPartsDialogValid] = useState(true); // For stock validation in dialog

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: repairToEdit ? {
        customerName: repairToEdit.customerName,
        phoneNumber: repairToEdit.phoneNumber,
        deviceBrand: repairToEdit.deviceBrand,
        deviceModel: repairToEdit.deviceModel,
        issueDescription: repairToEdit.issueDescription,
        estimatedCost: repairToEdit.estimatedCost,
        repairStatus: repairToEdit.repairStatus,
    } : {
      customerName: '',
      phoneNumber: '',
      deviceBrand: '',
      deviceModel: '',
      issueDescription: '',
      estimatedCost: '',
      repairStatus: 'Pending',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    if (repairToEdit) {
        form.reset({
            customerName: repairToEdit.customerName,
            phoneNumber: repairToEdit.phoneNumber,
            deviceBrand: repairToEdit.deviceBrand,
            deviceModel: repairToEdit.deviceModel,
            issueDescription: repairToEdit.issueDescription,
            estimatedCost: repairToEdit.estimatedCost,
            repairStatus: repairToEdit.repairStatus,
        });
        setSelectedPartsForRepair(repairToEdit.usedParts || []);
    } else {
        form.reset({
            customerName: '',
            phoneNumber: '',
            deviceBrand: '',
            deviceModel: '',
            issueDescription: '',
            estimatedCost: '',
            repairStatus: 'Pending',
        });
        setSelectedPartsForRepair([]);
    }
  }, [repairToEdit, form]);


  const issueDescription = form.watch('issueDescription');
  const deviceBrand = form.watch('deviceBrand');
  const deviceModel = form.watch('deviceModel');

  useEffect(() => {
    if (issueDescription && issueDescription.length >= 10 && deviceBrand && deviceModel) {
      const handler = setTimeout(async () => {
        setIsAiLoading(true);
        try {
          const analysis = await analyzeRepairIssue({ deviceBrand, deviceModel, issueDescription });
          setAiSuggestions(analysis);
        } catch (error) {
          console.error('AI Analysis Error:', error);
          toast({ title: 'AI Analysis Failed', description: 'Could not fetch AI suggestions.', variant: 'destructive' });
          setAiSuggestions(null);
        } finally {
          setIsAiLoading(false);
        }
      }, 1000);
      return () => clearTimeout(handler);
    } else {
      setAiSuggestions(null);
    }
  }, [issueDescription, deviceBrand, deviceModel, toast]);

  const handleAddPartToRepair = (inventoryItem: InventoryItem, quantity: number) => {
    if (quantity <= 0) {
        toast({ title: "Invalid Quantity", description: "Quantity must be greater than 0.", variant: "destructive"});
        setIsPartsDialogValid(false);
        return;
    }
    const currentStock = inventoryItem.quantityInStock ?? 0;
    const alreadySelectedQuantity = selectedPartsForRepair.find(p => p.partId === inventoryItem.id)?.quantity || 0;

    if (quantity > (currentStock - alreadySelectedQuantity)) {
        toast({ title: "Not Enough Stock", description: `Only ${currentStock - alreadySelectedQuantity} of ${inventoryItem.itemName} available.`, variant: "destructive"});
        setIsPartsDialogValid(false);
        return;
    }
    setIsPartsDialogValid(true);

    setSelectedPartsForRepair(prevParts => {
      const existingPartIndex = prevParts.findIndex(p => p.partId === inventoryItem.id);
      if (existingPartIndex > -1) {
        const updatedParts = [...prevParts];
        updatedParts[existingPartIndex].quantity += quantity;
        return updatedParts;
      } else {
        return [...prevParts, {
          partId: inventoryItem.id,
          name: inventoryItem.itemName,
          itemType: inventoryItem.itemType,
          phoneBrand: inventoryItem.phoneBrand,
          quantity: quantity,
          unitCost: inventoryItem.buyingPrice, // Use buyingPrice as unitCost
        }];
      }
    });
     // toast({ title: "Part Added", description: `${inventoryItem.itemName} (x${quantity}) added to repair.`});
  };

  const handleRemovePartFromRepair = (partId: string) => {
    setSelectedPartsForRepair(prevParts => prevParts.filter(p => p.partId !== partId));
  };

  const totalPartsCost = useMemo(() => {
    return selectedPartsForRepair.reduce((total, part) => total + (part.unitCost * part.quantity), 0);
  }, [selectedPartsForRepair]);

  function onSubmit(values: RepairFormValues) {
    const repairData = {
      ...values,
      usedParts: selectedPartsForRepair,
    };

    if (repairToEdit) {
        updateRepairContext({ ...repairToEdit, ...repairData });
        toast({ title: 'Success', description: 'Repair updated successfully.' });
    } else {
        addRepair(repairData);
        toast({ title: 'Success', description: 'Repair added successfully.' });
    }
    
    form.reset();
    setSelectedPartsForRepair([]);
    setAiSuggestions(null);
    onSuccess?.();
  }


  // Parts Selection Dialog State
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [quantityForSelectedPart, setQuantityForSelectedPart] = useState(1);

  const filteredInventoryItems = useMemo(() => {
    if (!partSearchTerm) return inventoryItems;
    return inventoryItems.filter(item => item.itemName.toLowerCase().includes(partSearchTerm.toLowerCase()));
  }, [inventoryItems, partSearchTerm]);


  return (
    <Form {...form}> {/* Use Form from @/components/ui/form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerName" render={({field}) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phoneNumber" render={({field}) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 123-456-7890" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="deviceBrand" render={({field}) => (<FormItem><FormLabel>Device Brand</FormLabel><FormControl><Input placeholder="e.g., Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="deviceModel" render={({field}) => (<FormItem><FormLabel>Device Model</FormLabel><FormControl><Input placeholder="e.g., iPhone 13" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          
          <FormField control={form.control} name="issueDescription" render={({field}) => (
            <FormItem>
              <FormLabel>Issue Description</FormLabel>
              <FormControl><Textarea placeholder="Describe the issue (min 10 chars)..." {...field} /></FormControl>
              <FormMessage />
              {isAiLoading && <div className="flex items-center text-sm text-muted-foreground mt-2"><Icons.spinner className="mr-2 h-4 w-4 animate-spin" />Analyzing issue...</div>}
              {aiSuggestions && !isAiLoading && (
                <Card className="mt-4 bg-secondary/50">
                  <CardHeader className="pb-2 pt-4"><CardTitle className="text-base">AI Analysis</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {aiSuggestions.possibleCauses?.length > 0 && (<div><h4 className="font-semibold">Possible Causes:</h4><ul className="list-disc pl-5 text-muted-foreground">{aiSuggestions.possibleCauses.map((cause, index) => (<li key={`cause-${index}`}>{cause}</li>))}</ul></div>)}
                    {aiSuggestions.suggestedSolutions?.length > 0 && (<div><h4 className="font-semibold">Suggested Solutions:</h4><ul className="list-disc pl-5 text-muted-foreground">{aiSuggestions.suggestedSolutions.map((solution, index) => (<li key={`solution-${index}`}>{solution}</li>))}</ul></div>)}
                    {aiSuggestions.partsNeeded?.length > 0 && (<div><h4 className="font-semibold">Potential Parts Needed:</h4><ul className="list-disc pl-5 text-muted-foreground">{aiSuggestions.partsNeeded.map((part, index) => (<li key={`part-${index}`}>{part}</li>))}</ul></div>)}
                    {(aiSuggestions.possibleCauses?.length === 0 && aiSuggestions.suggestedSolutions?.length === 0 && aiSuggestions.partsNeeded?.length === 0) && (<p className="text-muted-foreground">No specific suggestions found.</p>)}
                  </CardContent>
                </Card>
              )}
            </FormItem>
          )}

          {/* Used Parts Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Parts Used</CardTitle>
                  <CardDescription>Total Parts Cost: ${totalPartsCost.toFixed(2)}</CardDescription>
                </div>
                <Dialog open={partsDialogOpen} onOpenChange={setPartsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedInventoryItem(null); setQuantityForSelectedPart(1); setIsPartsDialogValid(true);}}>
                      <Icons.plusCircle className="mr-2 h-4 w-4" /> Add Part
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[725px]">
                    <DialogHeader>
                      <DialogTitle>Select Part from Inventory</DialogTitle>
                       <DialogDescription>Search and select a part to add to this repair job.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Input 
                            placeholder="Search parts by name..."
                            value={partSearchTerm}
                            onChange={(e) => setPartSearchTerm(e.target.value)}
                        />
                        <ScrollArea className="h-[300px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center">Loading inventory...</TableCell></TableRow>
                                    ) : filteredInventoryItems.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center">No parts found.</TableCell></TableRow>
                                    ) : (
                                        filteredInventoryItems.map(item => (
                                        <TableRow key={item.id} onClick={() => {setSelectedInventoryItem(item); setQuantityForSelectedPart(1); setIsPartsDialogValid(true);}} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>{item.itemName}</TableCell>
                                            <TableCell>{item.phoneBrand}</TableCell>
                                            <TableCell>{item.itemType}</TableCell>
                                            <TableCell className="text-right">{item.quantityInStock ?? 0}</TableCell>
                                            <TableCell className="text-right">${item.buyingPrice.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedInventoryItem(item); setQuantityForSelectedPart(1); setIsPartsDialogValid(true);}}>Select</Button>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        {selectedInventoryItem && (
                            <div className="grid grid-cols-2 gap-4 items-end border-t pt-4">
                                <p className="text-sm font-medium">Selected: <span className="font-normal">{selectedInventoryItem.itemName}</span></p>
                                <FormItem>
                                    <FormLabel htmlFor="partQuantity">Quantity</FormLabel>
                                    <Input 
                                        id="partQuantity"
                                        type="number" 
                                        value={quantityForSelectedPart} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setQuantityForSelectedPart(val > 0 ? val : 1);
                                            const currentStock = selectedInventoryItem.quantityInStock ?? 0;
                                            const alreadySelectedQty = selectedPartsForRepair.find(p => p.partId === selectedInventoryItem.id)?.quantity || 0;
                                            if(val <=0 || val > (currentStock - alreadySelectedQty)){
                                                setIsPartsDialogValid(false);
                                            } else {
                                                setIsPartsDialogValid(true);
                                            }
                                        }}
                                        min="1"
                                        className={!isPartsDialogValid ? "border-destructive" : ""}
                                    />
                                     {!isPartsDialogValid && <p className="text-xs text-destructive mt-1">Invalid quantity or exceeds available stock ({ (selectedInventoryItem.quantityInStock ?? 0) - (selectedPartsForRepair.find(p => p.partId === selectedInventoryItem.id)?.quantity || 0) } left).</p>}
                                </FormItem>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPartsDialogOpen(false)}>Cancel</Button>
                        <Button 
                            type="button" 
                            disabled={!selectedInventoryItem || quantityForSelectedPart <= 0 || !isPartsDialogValid} 
                            onClick={() => {
                                if (selectedInventoryItem && quantityForSelectedPart > 0) {
                                    handleAddPartToRepair(selectedInventoryItem, quantityForSelectedPart);
                                    setPartsDialogOpen(false); // Close dialog after adding
                                    setPartSearchTerm(""); // Reset search
                                    setSelectedInventoryItem(null); // Reset selection
                                }
                            }}
                        >
                            Add to Repair
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPartsForRepair.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts added to this repair yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPartsForRepair.map(part => (
                      <TableRow key={part.partId}>
                        <TableCell>{part.name}</TableCell>
                        <TableCell className="text-right">{part.quantity}</TableCell>
                        <TableCell className="text-right">${part.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(part.unitCost * part.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePartFromRepair(part.partId)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="estimatedCost" render={({field}) => (<FormItem><FormLabel>Estimated Cost ($)</FormLabel><FormControl><Input type="text" placeholder="e.g., 150.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="repairStatus" render={({field}) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>{repairStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </ScrollArea>

        <Button type="submit" disabled={form.formState.isSubmitting || isAiLoading}>
          {form.formState.isSubmitting || isAiLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : (repairToEdit ? <Icons.edit className="mr-2 h-4 w-4" /> : <Icons.plusCircle className="mr-2 h-4 w-4" />)}
          {repairToEdit ? 'Update Repair' : 'Add Repair'}
        </Button>
      </form>
    </Form>
  );
}
