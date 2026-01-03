"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Wrench,
  User,
  Phone,
  Smartphone,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  Save,
  CheckCircle2,
  History,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  X,
  Check
} from "lucide-react";
import { 
  Repair, 
  RepairStatus, 
  PaymentStatus, 
  UsedPartForm 
} from "@/types/repair";
import { useRepairContext } from "@/context/RepairContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InventoryPartSelector } from "./InventoryPartSelector";
import { InventoryItem, PHONE_BRANDS } from "@/types/inventory";

const paymentMethods = [
  { id: "Cash", label: "Cash", icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
  { id: "Card", label: "Card", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "Transfer", label: "Transfer", icon: ArrowRightLeft, color: "text-purple-600", bg: "bg-purple-50" },
];

interface RepairFormProps {
  repairToEdit?: Repair | null;
  onSuccess: (repair?: Repair) => void;
}

interface FormData {
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: number;
  repairStatus: RepairStatus;
  usedParts: UsedPartForm[];
}

export default function RepairForm({ repairToEdit, onSuccess }: RepairFormProps) {
  const { 
    createRepair, 
    updateRepair, 
    addUsedPart, 
    deleteUsedPart, 
    addPayment, 
    fetchRepairById 
  } = useRepairContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const form = useForm<FormData>({
    defaultValues: repairToEdit ? {
      customerName: repairToEdit.customerName,
      phoneNumber: repairToEdit.customerPhone || "",
      deviceBrand: repairToEdit.deviceBrand,
      deviceModel: repairToEdit.deviceModel,
      issueDescription: repairToEdit.issueDescription,
      estimatedCost: repairToEdit.estimatedCost,
      repairStatus: repairToEdit.status,
      usedParts: repairToEdit.usedParts?.map(p => ({
        recordId: p.id,
        partId: p.part_id || p.id,
        name: p.partName || "",
        quantity: p.quantity,
        unitCost: p.cost || 0
      })) || []
    } : {
      customerName: "",
      phoneNumber: "",
      deviceBrand: "",
      deviceModel: "",
      issueDescription: "",
      estimatedCost: 0,
      repairStatus: "Pending",
      usedParts: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts"
  });

  const partsTotal = useMemo(() => {
    return fields.reduce((sum, part) => sum + (part.quantity * (part.unitCost || 0)), 0);
  }, [fields]);

  // Sync form when repairToEdit changes (highly important for modals)
  useEffect(() => {
    if (repairToEdit) {
      form.reset({
        customerName: repairToEdit.customerName,
        phoneNumber: repairToEdit.customerPhone || "",
        deviceBrand: repairToEdit.deviceBrand,
        deviceModel: repairToEdit.deviceModel,
        issueDescription: repairToEdit.issueDescription,
        estimatedCost: repairToEdit.estimatedCost,
        repairStatus: repairToEdit.status,
        usedParts: repairToEdit.usedParts?.map(p => ({
            recordId: p.id,
            partId: p.part_id || p.id,
            name: p.partName || "",
            quantity: p.quantity,
            unitCost: p.cost || 0
          })) || []
      });
    }
  }, [repairToEdit, form]);

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      if (repairToEdit) {
        await updateRepair(repairToEdit.id, {
          customerName: values.customerName,
          customerPhone: values.phoneNumber,
          deviceBrand: values.deviceBrand,
          deviceModel: values.deviceModel,
          issueDescription: values.issueDescription,
          estimatedCost: Number(values.estimatedCost),
          status: values.repairStatus
        });

        // Parts diff
        const existingParts = repairToEdit.usedParts || [];
        const currentParts = values.usedParts;

        for (const p of existingParts) {
            if (!currentParts.find(cp => cp.recordId === p.id)) {
                await deleteUsedPart(repairToEdit.id, p.id);
            }
        }

        for (const p of currentParts) {
            if (!p.recordId) {
                await addUsedPart(repairToEdit.id, {
                    repair_id: repairToEdit.id,
                    part_name: p.name,
                    cost: p.unitCost,
                    quantity: p.quantity,
                    part_id: p.partId
                });
            }
        }
      } else {
        const newRepair = await createRepair({
          customer_name: values.customerName,
          customer_phone: values.phoneNumber,
          device_brand: values.deviceBrand,
          device_model: values.deviceModel,
          issue_description: values.issueDescription,
          estimated_cost: Number(values.estimatedCost),
          status: values.repairStatus,
          payment_status: "Unpaid",
          used_parts: [],
          payments: [],
          history: []
        });

        if (newRepair) {
            for (const p of values.usedParts) {
                await addUsedPart(newRepair.id, {
                    repair_id: newRepair.id,
                    part_name: p.name,
                    cost: p.unitCost,
                    quantity: p.quantity,
                    part_id: p.partId
                });
            }
        }
      }
      toast.success(repairToEdit ? "Repair updated" : "Repair created");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!repairToEdit || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setIsAddingPayment(true);
    try {
        await addPayment(repairToEdit.id, {
            repair_id: repairToEdit.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod as any
        });
        setPaymentAmount("");
        toast.success("Payment recorded");
        await fetchRepairById(repairToEdit.id);
    } catch (error) {
        console.error(error);
        toast.error("Failed to add payment");
    } finally {
        setIsAddingPayment(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        {/* Left Column - Form Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer & Device */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-muted/5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Customer & Device</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} className="h-10 rounded-xl bg-gray-50/50 border-gray-100 font-bold" />
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
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1..." {...field} className="h-10 rounded-xl bg-gray-50/50 border-gray-100 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deviceBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Brand</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl bg-gray-50/50 border-gray-100 font-bold">
                          <SelectValue placeholder="Brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {PHONE_BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deviceModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. iPhone 15" {...field} className="h-10 rounded-xl bg-gray-50/50 border-gray-100 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Issue Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-muted/5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Diagnosis</h2>
            </div>
            <div className="p-6">
              <FormField
                control={form.control}
                name="issueDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the issue..." 
                        className="min-h-[80px] rounded-xl bg-gray-50/50 border-gray-100 font-medium text-xs p-3" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Used Parts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Parts Used</h2>
              </div>
              <span className="text-[10px] font-black text-primary">${partsTotal.toFixed(2)}</span>
            </div>
            <div className="p-6 space-y-4">
              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{field.name || "Custom Part"}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{field.quantity}x @ ${field.unitCost?.toFixed(2)}</p>
                      </div>
                      <span className="text-xs font-black text-foreground">${(field.quantity * (field.unitCost || 0)).toFixed(2)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-2 bg-muted/5 rounded-xl border border-dashed border-gray-200">
                <InventoryPartSelector
                  onSelect={(item: InventoryItem | null) => {
                    if (item) {
                      append({
                        partId: item.id,
                        name: item.itemName,
                        quantity: 1,
                        unitCost: (item as any).sellingPrice || 0
                      });
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => append({ partId: Date.now().toString(), name: "", quantity: 1, unitCost: 0 })}
                className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
              >
                <Plus className="h-3 w-3 mr-1" />
                Manual Entry
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Financials & Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="repairStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="Pending" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Pending</SelectItem>
                        <SelectItem value="In Progress" className="rounded-xl font-black uppercase text-[10px] tracking-widest">In Progress</SelectItem>
                        <SelectItem value="Completed" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Completed</SelectItem>
                        <SelectItem value="Delivered" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Cost</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-10 pl-8 rounded-xl bg-gray-50/50 border-gray-100 font-black text-lg" 
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Parts</span>
                  <span>${partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Labor</span>
                  <span>${(form.watch("estimatedCost") - partsTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Sidebar integration */}
          {repairToEdit && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Paid</span>
                        <span className="text-lg font-black text-green-700">${(repairToEdit.totalPaid || 0).toFixed(2)}</span>
                    </div>
                </div>
                {(repairToEdit.remainingBalance || 0) > 0 && (
                    <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Balance</span>
                            <span className="text-lg font-black text-red-700">${(repairToEdit.remainingBalance || 0).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-50 space-y-3">
                   <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Quick Payment</p>
                   <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="Amount" 
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="h-9 pl-8 rounded-xl bg-gray-50 border-gray-100 font-bold text-xs" 
                      />
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                            paymentMethod === m.id ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-gray-50 text-muted-foreground opacity-60"
                          )}
                        >
                          <m.icon className="h-3 w-3" />
                          <span className="text-[7px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                      ))}
                   </div>
                   <Button 
                    type="button" 
                    onClick={handleAddPayment}
                    disabled={isAddingPayment || !paymentAmount}
                    className="w-full h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest"
                   >
                    Add Payment
                   </Button>
                </div>

                {repairToEdit.payments && repairToEdit.payments.length > 0 && (
                    <div className="pt-4 border-t border-gray-50 space-y-2">
                        {repairToEdit.payments.slice(0, 2).map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                <span>{p.method} • {new Date(p.date).toLocaleDateString()}</span>
                                <span className="text-green-600">${p.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          )}

          <Button 
            disabled={isSubmitting} 
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Processing..." : (repairToEdit ? "Update Order" : "Crate Repair")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
