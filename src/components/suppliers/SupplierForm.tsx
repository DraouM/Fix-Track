"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Supplier, supplierSchema } from "@/types/supplier";
import { useSupplierActions } from "@/context/SupplierContext";
import { cn } from "@/lib/utils";

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function SupplierForm({
  supplier = null,
  onSuccess,
  trigger,
}: SupplierFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!supplier;
  const { createSupplier, updateSupplier } = useSupplierActions();

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      contactName: supplier?.contactName || "",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
      notes: supplier?.notes || "",
      preferredPaymentMethod: supplier?.preferredPaymentMethod || undefined,
      status: supplier?.status || "active",
    },
  });

  async function onSubmit(data: any) {
    try {
      if (isEditing && supplier) {
        await updateSupplier(supplier.id, data);
        toast.success("Operational records updated");
      } else {
        await createSupplier(data);
        toast.success("New supplier entity registered");
      }
      if (trigger) {
        setOpen(false);
      }
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to commit changes");
      console.error("Error saving supplier:", error);
    }
  }

  const labelStyles =
    "text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5 flex items-center gap-1";
  const inputStyles =
    "h-9 rounded-lg border border-gray-100 bg-white/50 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all font-bold text-xs placeholder:font-medium placeholder:text-muted-foreground/30";
  const sectionHeaderStyles =
    "text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 flex items-center gap-1";

  const FormContent = () => (
    <div className="space-y-3">
      {/* Supplier Identity Section */}
      <div className="space-y-2">
        <h4 className={sectionHeaderStyles}>
          <Building2 className="h-2.5 w-2.5" /> Entity Identity
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Official Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Company or Corporate Entity"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[9px] font-bold mt-0.5" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Liaison Officer</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Primary contact person"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[9px] font-bold mt-0.5" />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Communications Section */}
      <div className="space-y-2">
        <h4 className={sectionHeaderStyles}>
          <Phone className="h-2.5 w-2.5" /> Communication Channels
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="operations@entity.com"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[9px] font-bold mt-0.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Direct Line</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Call identity"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[9px] font-bold mt-0.5" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                Physical Distribution Point
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Street, City, Logistics Hub"
                  className={cn(
                    inputStyles,
                    "min-h-[60px] h-18 py-2 resize-none"
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Financial Section */}
      <div className="space-y-3">
        <h4 className={sectionHeaderStyles}>
          <CreditCard className="h-3 w-3" /> Settlement Parameters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preferredPaymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Settlement Mode</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className={inputStyles}>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem
                      value="Bank Transfer"
                      className="font-bold text-xs py-2.5"
                    >
                      Bank Transfer
                    </SelectItem>
                    <SelectItem
                      value="Cash"
                      className="font-bold text-xs py-2.5"
                    >
                      Cash
                    </SelectItem>
                    <SelectItem
                      value="Check"
                      className="font-bold text-xs py-2.5"
                    >
                      Check
                    </SelectItem>
                    <SelectItem
                      value="Credit Card"
                      className="font-bold text-xs py-2.5"
                    >
                      Credit Card
                    </SelectItem>
                    <SelectItem
                      value="Other"
                      className="font-bold text-xs py-2.5"
                    >
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  Partnership Status
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "active"}
                >
                  <FormControl>
                    <SelectTrigger className={cn(inputStyles, "capitalize")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem
                      value="active"
                      className="font-bold text-xs py-2.5"
                    >
                      Operational
                    </SelectItem>
                    <SelectItem
                      value="inactive"
                      className="font-bold text-xs py-2.5"
                    >
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                Administrative Observations
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Terms, agreements, or constraints..."
                  className={cn(
                    inputStyles,
                    "min-h-[60px] h-18 py-2 resize-none"
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const FormActions = ({ cancelAction }: { cancelAction?: () => void }) => (
    <div className="flex justify-end gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={cancelAction}
        className="h-10 px-6 rounded-xl border-2 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest min-w-[160px]"
      >
        {form.formState.isSubmitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Committing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />{" "}
            {isEditing ? "Update Entity" : "Register Entity"}
          </div>
        )}
      </Button>
    </div>
  );

  if (!trigger) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-white">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full min-h-0 p-4 pt-2"
          >
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
              <FormContent />
            </div>
            <FormActions cancelAction={onSuccess} />
          </form>
        </Form>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b bg-gray-50/50">
          <DialogTitle className="flex items-center gap-3 font-black text-xl tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            {isEditing ? "Edit Operational Records" : "Register New Supplier"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-hide">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormContent />
              <FormActions cancelAction={() => setOpen(false)} />
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
