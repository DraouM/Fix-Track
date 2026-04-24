"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
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
  Check,
  Tag,
} from "lucide-react";
import {
  Repair,
  RepairStatus,
  PaymentStatus,
  UsedPartForm,
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
  {
    id: "Cash",
    label: "repairs.cash",
    icon: Wallet,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "Card",
    label: "repairs.card",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "Transfer",
    label: "repairs.transfer",
    icon: ArrowRightLeft,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const COMMON_ISSUE_KEYS = [
  "brokenScreen",
  "batteryReplacement",
  "chargingPort",
  "chargingCircuit",
  "backlightCircuit",
  "processor",
  "memory",
  "simTray",
  "waterDamage",
  "softwareIssue",
  "camera",
  "speakerMic",
  "backGlass",
  "noPower"
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
  estimatedCost?: number;
  repairStatus: RepairStatus;
  usedParts: UsedPartForm[];
}

export default function RepairForm({
  repairToEdit,
  onSuccess,
}: RepairFormProps) {
  const { t } = useTranslation();
  const {
    createRepair,
    updateRepair,
    addUsedPart,
    deleteUsedPart,
    addPayment,
    fetchRepairById,
    repairs,
  } = useRepairContext();

  const currentRepair = useMemo(() => {
    if (!repairToEdit) return null;
    return repairs.find((r) => r.id === repairToEdit.id) || repairToEdit;
  }, [repairs, repairToEdit]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const repairFormSchema = z.object({
    customerName: z.string().min(1, t("repairs.nameRequired")),
    phoneNumber: z.string().min(1, t("repairs.phoneRequired")),
    deviceBrand: z.string().min(1, t("repairs.brandRequired")),
    deviceModel: z.string().min(1, t("repairs.modelRequired")),
    issueDescription: z.string(),
    estimatedCost: z.number().optional(),
    repairStatus: z.enum(["Pending", "In Progress", "Completed", "Delivered"]),
    usedParts: z.array(z.object({
      recordId: z.string().optional(),
      partId: z.string(),
      name: z.string(),
      quantity: z.number(),
      unitCost: z.number(),
    })),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: repairToEdit
      ? {
          customerName: repairToEdit.customerName,
          phoneNumber: repairToEdit.customerPhone || "",
          deviceBrand: repairToEdit.deviceBrand,
          deviceModel: repairToEdit.deviceModel,
          issueDescription: repairToEdit.issueDescription,
          estimatedCost: repairToEdit.estimatedCost || undefined,
          repairStatus: repairToEdit.status,
          usedParts:
            repairToEdit.usedParts?.map((p) => ({
              recordId: p.id,
              partId: p.part_id || p.id,
              name: p.partName || "",
              quantity: p.quantity,
              unitCost: p.cost || 0,
            })) || [],
        }
      : {
          customerName: "",
          phoneNumber: "",
          deviceBrand: "",
          deviceModel: "",
          issueDescription: "",
          estimatedCost: undefined,
          repairStatus: "Pending",
          usedParts: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts",
  });

  const watchedParts = form.watch("usedParts") || [];

  const partsTotal = useMemo(() => {
    return watchedParts.reduce(
      (sum, part) => sum + (part.quantity || 0) * (part.unitCost || 0),
      0
    );
  }, [watchedParts]);

  // Sync form when repairToEdit changes (highly important for modals)
  useEffect(() => {
    if (repairToEdit) {
      form.reset({
        customerName: repairToEdit.customerName,
        phoneNumber: repairToEdit.customerPhone || "",
        deviceBrand: repairToEdit.deviceBrand,
        deviceModel: repairToEdit.deviceModel,
        issueDescription: repairToEdit.issueDescription,
        estimatedCost: repairToEdit.estimatedCost || undefined,
        repairStatus: repairToEdit.status,
        usedParts:
          repairToEdit.usedParts?.map((p) => ({
            recordId: p.id,
            partId: p.part_id || p.id,
            name: p.partName || "",
            quantity: p.quantity,
            unitCost: p.cost || 0,
          })) || [],
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
          status: values.repairStatus,
        });

        // Parts diff
        const existingParts = repairToEdit.usedParts || [];
        const currentParts = values.usedParts;

        for (const p of existingParts) {
          if (!currentParts.find((cp) => cp.recordId === p.id)) {
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
              part_id: p.partId,
            });
          }
        }

        // Add Payment if exists (Edit Mode)
        if (paymentAmount && parseFloat(paymentAmount) > 0) {
          await addPayment(repairToEdit.id, {
            repair_id: repairToEdit.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod as any,
          });
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
          history: [],
        });

          if (newRepair) {
            // Add Parts
            for (const p of values.usedParts) {
              await addUsedPart(newRepair.id, {
                repair_id: newRepair.id,
                part_name: p.name,
                cost: p.unitCost,
                quantity: p.quantity,
                part_id: p.partId,
              });
            }

            // Add Initial Payment if exists
            if (paymentAmount && parseFloat(paymentAmount) > 0) {
              await addPayment(newRepair.id, {
                repair_id: newRepair.id,
                amount: parseFloat(paymentAmount),
                method: paymentMethod as any,
              });
            }
          }
      }
      toast.success(
        repairToEdit ? t("repairs.repairUpdated") : t("repairs.repairCreated")
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(t("repairs.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    
    // In "Add" mode, we don't call the API yet, we just keep the state
    if (!repairToEdit) {
      toast.info(t("repairs.depositRecorded") || "Payment recorded as deposit");
      return;
    }
    setIsAddingPayment(true);
    try {
      await addPayment(repairToEdit.id, {
        repair_id: repairToEdit.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod as any,
      });
      setPaymentAmount("");
      toast.success(t("repairs.paymentRecorded"));
      await fetchRepairById(repairToEdit.id);
    } catch (error) {
      console.error(error);
      toast.error(t("repairs.paymentFailed"));
    } finally {
      setIsAddingPayment(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6"
      >
        {/* Unified "Service Intake" Header */}
        <div className="lg:col-span-12">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all hover:border-primary/20">
            <div className="px-8 py-5 border-b border-gray-50 dark:border-slate-800/60 bg-muted/5 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                    {repairToEdit ? t("repairs.editRepair") : t("repairs.serviceIntake")}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {repairToEdit ? t("repairs.editDesc") : t("repairs.addDesc")}
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="repairStatus"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[140px] h-9 rounded-full bg-primary/5 border-primary/20 hover:border-primary/40 text-primary font-black uppercase text-[8px] tracking-widest px-4 transition-all focus:ring-0">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full animate-pulse",
                            field.value === "Pending" && "bg-orange-500",
                            field.value === "In Progress" && "bg-blue-500",
                            field.value === "Completed" && "bg-emerald-500",
                            field.value === "Delivered" && "bg-slate-500"
                          )} />
                          <SelectValue placeholder={t("repairs.status")} />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900 min-w-[160px]">
                      <SelectItem value="Pending" className="rounded-xl font-black uppercase text-[9px] tracking-widest py-3">{t("repairs.pending")}</SelectItem>
                      <SelectItem value="In Progress" className="rounded-xl font-black uppercase text-[9px] tracking-widest py-3">{t("repairs.inprogress")}</SelectItem>
                      <SelectItem value="Completed" className="rounded-xl font-black uppercase text-[9px] tracking-widest py-3">{t("repairs.completed")}</SelectItem>
                      <SelectItem value="Delivered" className="rounded-xl font-black uppercase text-[9px] tracking-widest py-3">{t("repairs.delivered")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <User className="h-3 w-3 text-primary/60" />
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {t("repairs.customerName")}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder={t("common.searchPlaceholder")}
                        {...field}
                        className="h-11 rounded-2xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold focus:ring-primary/20 transition-all text-sm px-4"
                      />
                    </FormControl>
                    <FormMessage className="text-[8px] font-bold uppercase" />
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Phone className="h-3 w-3 text-primary/60" />
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {t("repairs.customerPhone")}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="+..."
                        {...field}
                        className="h-11 rounded-2xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold focus:ring-primary/20 transition-all text-sm px-4"
                      />
                    </FormControl>
                    <FormMessage className="text-[8px] font-bold uppercase" />
                  </FormItem>
                )}
              />

              {/* Device Brand */}
              <FormField
                control={form.control}
                name="deviceBrand"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Smartphone className="h-3 w-3 text-primary/60" />
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {t("inventory.form.brand")}
                      </FormLabel>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-2xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold focus:ring-primary/20 transition-all text-sm px-4">
                          <SelectValue
                            placeholder={t("inventory.form.brand")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                        {PHONE_BRANDS.map((brand) => (
                          <SelectItem
                            key={brand}
                            value={brand}
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3"
                          >
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[8px] font-bold uppercase" />
                  </FormItem>
                )}
              />

              {/* Device Model */}
              <FormField
                control={form.control}
                name="deviceModel"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Tag className="h-3 w-3 text-primary/60" />
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {t("repairs.model")}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder={t("repairs.modelPlaceholder")}
                        {...field}
                        className="h-11 rounded-2xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold focus:ring-primary/20 transition-all text-sm px-4"
                      />
                    </FormControl>
                    <FormMessage className="text-[8px] font-bold uppercase" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Left Column - Diagnostic & Parts */}
        <div className="lg:col-span-8 space-y-6">


          {/* Diagnosis Section */}
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all hover:border-primary/20">
            <div className="px-8 py-5 border-b border-gray-50 dark:border-slate-800/60 bg-muted/5 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                    {t("repairs.diagnosis")}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {t("repairs.problemDetails") || "Issue Identification"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <FormField
                control={form.control}
                name="issueDescription"
                render={({ field }) => {
                  const currentValue = field.value || "";
                  const selectedIssues = currentValue.split(',').map(i => i.trim()).filter(Boolean);

                  const toggleIssue = (issue: string) => {
                    if (selectedIssues.includes(issue)) {
                      field.onChange(selectedIssues.filter(i => i !== issue).join(', '));
                    } else {
                      field.onChange([...selectedIssues, issue].join(', '));
                    }
                  };

                  return (
                    <FormItem className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {COMMON_ISSUE_KEYS.map(key => {
                          const translatedIssue = t(`repairs.issues.${key}`);
                          const isSelected = selectedIssues.includes(translatedIssue);
                          return (
                            <Badge
                              key={key}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all hover:scale-105 active:scale-95 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest select-none",
                                isSelected 
                                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600" 
                                  : "bg-gray-50 dark:bg-slate-900 text-slate-500 border-gray-200 dark:border-slate-800 hover:border-orange-500/50 hover:text-orange-500"
                              )}
                              onClick={() => toggleIssue(translatedIssue)}
                            >
                              {translatedIssue}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Textarea
                            placeholder={t("repairs.issuePlaceholder")}
                            className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-medium text-sm p-5 focus:ring-orange-500/20 transition-all resize-none shadow-inner"
                            {...field}
                          />
                          <div className="absolute top-4 right-4 opacity-20 group-focus-within:opacity-40 transition-opacity">
                            <Wrench className="h-4 w-4" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>

          {/* Used Parts Section */}
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all hover:border-primary/20">
            <div className="px-8 py-5 border-b border-gray-50 dark:border-slate-800/60 bg-muted/5 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                    {t("repairs.partsUsed")}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {t("repairs.inventoryAllocation")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/5 px-4 py-1.5 rounded-full border border-blue-500/10">
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 opacity-60">{t("repairs.subtotal") || "Subtotal"}:</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {t("repairs.price", {
                    symbol: t("settings.languageCurrency.samplePrice").charAt(0),
                    amount: partsTotal.toFixed(2),
                  }).replace(/[^\d.]/g, "")}
                </span>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {fields.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="group relative flex items-center gap-4 p-4 rounded-[1.25rem] bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-none hover:-translate-y-0.5"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                        <Smartphone className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          {...form.register(`usedParts.${index}.name` as const)}
                          placeholder={t("repairs.customPart")}
                          className="h-7 p-0 border-none bg-transparent text-[11px] font-black text-foreground uppercase tracking-tight focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="h-4 px-1.5 rounded text-[7px] font-bold uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                            {field.quantity}x
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">@</span>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register(`usedParts.${index}.unitCost` as const, { valueAsNumber: true })}
                              className="h-5 w-20 p-0 border-none bg-transparent text-[9px] font-bold text-primary uppercase tracking-widest focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <p className="text-xs font-black text-foreground">
                          {t("repairs.price", {
                            symbol: "",
                            amount: (form.watch(`usedParts.${index}.quantity`) * (form.watch(`usedParts.${index}.unitCost`) || 0)).toFixed(2),
                          }).trim()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="p-1 px-1.5 bg-muted/5 dark:bg-slate-900/40 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-slate-800">
                  <InventoryPartSelector
                    excludeIds={fields.map(f => f.partId).filter(Boolean) as string[]}
                    onSelect={(item: InventoryItem | null) => {
                      if (item) {
                        append({
                          partId: item.id,
                          name: item.itemName,
                          quantity: 1,
                          unitCost: item.buyingPrice || 0,
                        });
                      }
                    }}
                  />
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    append({
                      partId: Date.now().toString(),
                      name: "",
                      quantity: 1,
                      unitCost: 0,
                    })
                  }
                  className="w-full h-11 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Plus className="h-3.5 w-3.5 mr-2 group-hover:rotate-90 transition-transform" />
                  {t("repairs.manualEntry")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Financials & Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Costs & Estimated Section */}
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all hover:border-primary/20">
            <div className="p-8 space-y-6">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <DollarSign className="h-3.5 w-3.5 text-primary/60" />
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {t("repairs.totalEstimated")}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/10 text-primary opacity-60 group-focus-within:opacity-100 transition-opacity">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="0.00"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
                          className="h-14 pl-14 rounded-[1.25rem] bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-black text-2xl focus:ring-primary/20 transition-all shadow-inner"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="pt-6 border-t border-gray-50 dark:border-slate-800/60 space-y-3">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t("repairs.parts")}</span>
                   <span className="text-sm font-black text-foreground tracking-tight">
                    {t("repairs.price", {
                      symbol: "",
                      amount: partsTotal.toFixed(2),
                    }).trim()}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t("repairs.labor")}</span>
                    <Badge variant="outline" className="h-4 px-1 rounded text-[7px] font-bold uppercase border-primary/20 text-primary bg-primary/5">
                      {Math.max(0, (((form.watch("estimatedCost") || 0) - partsTotal) / (form.watch("estimatedCost") || 1)) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-sm font-black text-primary tracking-tight">
                    {t("repairs.price", {
                      symbol: "",
                      amount: (
                        (form.watch("estimatedCost") || 0) - partsTotal
                      ).toFixed(2),
                    }).trim()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Sidebar integration */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                    {t("repairs.paid")}
                  </span>
                  <span className="text-lg font-black text-green-700 dark:text-green-300">
                    {t("repairs.price", {
                      symbol: "",
                      amount: ((currentRepair?.totalPaid || 0) + (parseFloat(paymentAmount) || 0)).toFixed(2),
                    }).trim()}
                  </span>
                </div>
              </div>
              {((currentRepair?.remainingBalance || form.watch("estimatedCost") || 0) - (parseFloat(paymentAmount) || 0)) > 0 && (
                <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                      {currentRepair ? t("repairs.balance") : t("repairs.remaining")}
                    </span>
                    <span className="text-lg font-black text-red-700 dark:text-red-300">
                      {t("repairs.price", {
                        symbol: "",
                        amount: Math.max(0, (currentRepair ? (currentRepair.remainingBalance || 0) : (form.watch("estimatedCost") || 0)) - (parseFloat(paymentAmount) || 0)).toFixed(2),
                      }).trim()}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-50 dark:border-slate-800/60 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">
                  {currentRepair ? t("repairs.quickPayment") : t("repairs.recordDeposit")}
                </p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-muted-foreground opacity-60 group-focus-within:opacity-100 transition-opacity">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <Input
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-12 pl-12 rounded-[1.25rem] bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold text-sm focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5 active:scale-95",
                        paymentMethod === m.id
                          ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                          : "border-transparent bg-gray-50 dark:bg-slate-900 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                      <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                        {t(m.label)}
                      </span>
                    </button>
                  ))}
                </div>
                {currentRepair && (
                  <Button
                    type="button"
                    onClick={handleAddPayment}
                    disabled={isAddingPayment || !paymentAmount}
                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    {t("repairs.addPayment")}
                  </Button>
                )}
              </div>

              {currentRepair?.payments && currentRepair.payments.length > 0 && (
                <div className="pt-6 border-t border-gray-50 dark:border-slate-800/60 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-3 w-3 text-muted-foreground opacity-60" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t("repairs.recentPayments")}</span>
                  </div>
                  {currentRepair.payments.slice(0, 3).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-50 dark:border-slate-800 font-bold uppercase text-[9px] tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-4 px-1.5 rounded bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-[7px]">
                          {p.method}
                        </Badge>
                        <span className="opacity-60">{new Date(p.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-emerald-600 font-black">
                        {t("repairs.price", {
                          symbol: "",
                          amount: p.amount.toFixed(2),
                        }).trim()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            disabled={isSubmitting}
            className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all group"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                {t("repairs.processing")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {repairToEdit ? t("repairs.updateOrder") : t("repairs.createRepair")}
                <ArrowRightLeft className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
