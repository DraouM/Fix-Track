"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  repairSchema,
  RepairFormValues,
  Repair,
  RepairStatus,
  PaymentStatus,
  UsedPartForm,
} from "@/types/repair";
import { useRepairContext } from "@/context/RepairContext";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  onSuccess: () => void;
}

// Simplified form data structure to avoid type conflicts
interface FormData {
  customerName: string;
  phoneNumber?: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: number;
  dateReceived: Date;
  repairStatus: RepairStatus;
  paymentStatus: PaymentStatus;
  usedParts: UsedPartForm[];
}

export default function RepairForm({
  repairToEdit,
  onSuccess,
}: RepairFormProps) {
  const { createRepair, updateRepair } = useRepairContext();

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
          paymentStatus: repairToEdit.paymentStatus,
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
          paymentStatus: "Unpaid" as const,
          usedParts: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usedParts",
  });

  async function onSubmit(values: FormData) {
    try {
      if (repairToEdit) {
        // Convert form values to partial repair for update
        const updateData: Partial<Repair> = {
          customerName: values.customerName,
          customerPhone: values.phoneNumber,
          deviceBrand: values.deviceBrand,
          deviceModel: values.deviceModel,
          issueDescription: values.issueDescription,
          estimatedCost: values.estimatedCost,
          status: values.repairStatus,
          paymentStatus: values.paymentStatus,
        };
        await updateRepair(repairToEdit.id, updateData);
      } else {
        // Convert form values to RepairDb format for creation
        const createData = {
          customer_name: values.customerName,
          customer_phone: values.phoneNumber || "",
          device_brand: values.deviceBrand,
          device_model: values.deviceModel,
          issue_description: values.issueDescription,
          estimated_cost: values.estimatedCost,
          status: values.repairStatus,
          payment_status: values.paymentStatus,
          used_parts: [],
          payments: [],
          history: [],
        };
        await createRepair(createData);
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save repair:", err);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[75vh] overflow-y-auto pr-2"
      >
        {/* Header Section */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            {repairToEdit ? "Update Repair" : "New Repair"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {repairToEdit
              ? "Modify repair details"
              : "Fill in the repair information below"}
          </p>
        </div>

        {/* Customer Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Customer Information</h4>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Customer Name */}
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
                        className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
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
                        className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Device Information</h4>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
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
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Issue Description */}
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
                      className="w-full min-h-[100px] border rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Describe the issue in detail (e.g., Screen cracked on bottom left corner, phone turns on but display is black...)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Cost and Timeline Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Cost & Timeline</h4>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Estimated Cost */}
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
                        className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Received */}
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
                          "w-full justify-start text-left font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
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

        {/* Status Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Status Information</h4>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Repair Status */}
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
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Payment Status
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={
                        field.onChange as (val: PaymentStatus) => void
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unpaid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Unpaid
                          </div>
                        </SelectItem>
                        <SelectItem value="Partially Paid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            Partially Paid
                          </div>
                        </SelectItem>
                        <SelectItem value="Paid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Paid
                          </div>
                        </SelectItem>
                        <SelectItem value="Refunded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            Refunded
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Parts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">Parts Used</h4>
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
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No parts added yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Add Part" to include replacement parts
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {fields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.id}
                    className="bg-white rounded-md p-3 border border-gray-200"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Part name (e.g., Screen, Battery, Charging Port)"
                          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          {...form.register(`usedParts.${index}.name` as const)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          {...form.register(
                            `usedParts.${index}.quantity` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cost"
                            className="pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            {...form.register(
                              `usedParts.${index}.unitCost` as const,
                              {
                                valueAsNumber: true,
                              }
                            )}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="border-t pt-6 space-y-3">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-12 text-base font-medium"
          >
            {repairToEdit ? (
              <>
                <Wrench className="mr-2 h-5 w-5" />
                Update Repair
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Create Repair
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            * Required fields must be filled out
          </p>
        </div>
      </form>
    </Form>
  );
}
