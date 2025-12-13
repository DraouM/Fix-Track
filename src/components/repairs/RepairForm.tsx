"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Repair,
  RepairStatus,
  PaymentStatus,
  UsedPartForm,
} from "@/types/repair";
import { useRepairContext } from "@/context/RepairContext";
import {
  calculatePaymentStatusFromRepair,
  getPaymentStatusBadgeVariant,
} from "@/lib/repairUtils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Trash,
  User,
  Phone,
  Wrench,
  DollarSign,
  AlertCircle,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface RepairFormProps {
  repairToEdit?: Repair | null;
  onSuccess: (repair?: Repair) => void;
}

// Simplified form data structure to avoid type conflicts
// Note: paymentStatus is now calculated, not manually set
interface FormData {
  customerName: string;
  phoneNumber?: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: number;
  dateReceived: Date;
  repairStatus: RepairStatus;
  usedParts: UsedPartForm[];
}

export default function RepairForm({
  repairToEdit,
  onSuccess,
}: RepairFormProps) {
  const { createRepair, updateRepair } = useRepairContext();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: repairToEdit
      ? {
          customerName: repairToEdit.customerName,
          phoneNumber: repairToEdit.customerPhone,
          deviceBrand: repairToEdit.deviceBrand,
          deviceModel: repairToEdit.deviceModel,
          issueDescription: repairToEdit.issueDescription,
          estimatedCost: repairToEdit.estimatedCost,
          dateReceived: new Date(repairToEdit.createdAt),
          repairStatus: repairToEdit.status,
          usedParts:
            repairToEdit.usedParts?.map((part) => ({
              partId: part.id.toString(),
              name: part.partName,
              quantity: part.quantity,
              unitCost: part.cost,
            })) || [],
        }
      : {
          customerName: "",
          phoneNumber: "",
          deviceBrand: "",
          deviceModel: "",
          issueDescription: "",
          estimatedCost: 0,
          dateReceived: new Date(),
          repairStatus: "Pending" as const,
          usedParts: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts",
  });

  // Auto-save functionality (only for new repairs)
  useEffect(() => {
    // Don't auto-save if we're editing an existing repair
    if (repairToEdit) return;

    const subscription = form.watch((value, { name, type }) => {
      if (type === "change" && name) {
        setIsAutoSaving(true);
        // Debounce auto-save
        const timeoutId = setTimeout(() => {
          // Save to localStorage as draft
          localStorage.setItem("repair-draft", JSON.stringify(value));
          setIsAutoSaving(false);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, repairToEdit]);

  // Load draft on mount
  useEffect(() => {
    if (!repairToEdit) {
      const draft = localStorage.getItem("repair-draft");
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          form.reset(draftData);
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    }
  }, [form, repairToEdit]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      // Clear draft on successful submit
      localStorage.removeItem("repair-draft");

      if (repairToEdit) {
        // Convert form values to partial repair for update
        // Note: paymentStatus is calculated by the backend based on payments
        const updateData: Partial<Repair> = {
          customerName: values.customerName,
          customerPhone: values.phoneNumber,
          deviceBrand: values.deviceBrand,
          deviceModel: values.deviceModel,
          issueDescription: values.issueDescription,
          estimatedCost: Number(values.estimatedCost), // Ensure it's a number
          status: values.repairStatus,
          // paymentStatus is omitted - it will be calculated by the backend
        };
        await updateRepair(repairToEdit.id, updateData);
        onSuccess();
      } else {
        // Convert form values to RepairDb format for creation
        // For new repairs, payment status starts as "Unpaid" since no payments exist yet
        const createData = {
          customer_name: values.customerName,
          customer_phone: values.phoneNumber || "",
          device_brand: values.deviceBrand,
          device_model: values.deviceModel,
          issue_description: values.issueDescription,
          estimated_cost: Number(values.estimatedCost), // Ensure it's a number
          status: values.repairStatus,
          payment_status: "Unpaid" as PaymentStatus, // New repairs always start as unpaid
          used_parts: [],
          payments: [],
          history: [],
        };
        const newRepair = await createRepair(createData);
        onSuccess(newRepair);
      }
    } catch (err) {
      console.error("Failed to save repair:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        {/* Customer Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Customer Name *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter customer name"
                        className="pl-10 h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                        {...field}
                      />
                    </div>
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
                  <FormLabel className="text-sm font-medium">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="e.g., +1 (555) 123-4567"
                        className="pl-10 h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Device Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-green-600" />
            Device Information
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deviceBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Device Brand *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Apple, Samsung, Google"
                        className="h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                        {...field}
                      />
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
                    <FormLabel className="text-sm font-medium">
                      Device Model *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., iPhone 13, Galaxy S21"
                        className="h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                        {...field}
                      />
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
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Issue Description *
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full min-h-[100px] border border-gray-300 rounded-md p-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 resize-none"
                      placeholder="Describe the issue in detail (e.g., Screen cracked on bottom left corner, phone turns on but display is black...)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Cost & Timeline Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            Cost & Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Estimated Cost *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10 h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateReceived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Date Received
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date received</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date: any) => field.onChange(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status & Parts Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Status & Parts
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="repairStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Repair Status
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={
                        field.onChange as (val: RepairStatus) => void
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500">
                          <SelectValue placeholder="Select repair status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="In Progress">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="Completed">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="Delivered">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Delivered
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="text-sm font-medium">
                  Payment Status
                </FormLabel>
                <div className="mt-2">
                  <Badge
                    variant={
                      getPaymentStatusBadgeVariant(
                        repairToEdit
                          ? calculatePaymentStatusFromRepair(repairToEdit)
                          : "Unpaid"
                      ) as any
                    }
                    className="text-sm px-3 py-1"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          repairToEdit
                            ? calculatePaymentStatusFromRepair(repairToEdit) ===
                              "Paid"
                              ? "bg-green-500"
                              : calculatePaymentStatusFromRepair(
                                  repairToEdit
                                ) === "Partially Paid"
                              ? "bg-orange-500"
                              : calculatePaymentStatusFromRepair(
                                  repairToEdit
                                ) === "Refunded"
                              ? "bg-gray-500"
                              : "bg-red-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      {repairToEdit
                        ? calculatePaymentStatusFromRepair(repairToEdit)
                        : "Unpaid"}
                    </div>
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Payment status is automatically calculated based on payments
                    received
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900 text-sm">
                    Parts Used
                  </h4>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  onClick={() =>
                    append({
                      partId: Date.now().toString(),
                      name: "",
                      quantity: 1,
                      unitCost: 0,
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Part
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-300">
                  <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No parts added yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Add Part" to include replacement parts
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((fieldItem, index) => (
                    <div
                      key={fieldItem.id}
                      className="bg-gray-50 rounded-md p-2 border border-gray-200"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <Input
                              placeholder="Part name"
                              className="h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              {...form.register(
                                `usedParts.${index}.name` as const
                              )}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Input
                              type="number"
                              placeholder="Quantity"
                              className="h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              {...form.register(
                                `usedParts.${index}.quantity` as const,
                                {
                                  valueAsNumber: true,
                                }
                              )}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                form.setValue(
                                  `usedParts.${index}.quantity` as any,
                                  value
                                );
                              }}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Unit cost"
                                className="pl-8 h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                {...form.register(
                                  `usedParts.${index}.unitCost` as const,
                                  {
                                    valueAsNumber: true,
                                  }
                                )}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  form.setValue(
                                    `usedParts.${index}.unitCost` as any,
                                    value
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-50 hover:text-red-600 h-10 w-10"
                          onClick={() => remove(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {repairToEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {repairToEdit ? "Update Repair" : "Create Repair"}
              </>
            )}
          </Button>
        </div>

        {/* Auto-save indicator */}
        {isAutoSaving && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
            Saving draft...
          </div>
        )}
      </form>
    </Form>
  );
}
