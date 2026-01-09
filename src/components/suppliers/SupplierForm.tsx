"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupplierContext } from "@/context/SupplierContext";
import { Supplier, supplierSchema, SupplierFormValues } from "@/types/supplier";
import {
  Loader2,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  DollarSign,
  Building2,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierFormProps {
  supplierId?: string;
  supplier?: Supplier;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupplierForm({
  supplierId,
  supplier,
  onSuccess,
  onCancel,
}: SupplierFormProps) {
  const { suppliers, createSupplier, updateSupplier, loading } =
    useSupplierContext();

  const existingSupplier =
    supplier ||
    (supplierId ? suppliers.find((s) => s.id === supplierId) : null);

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      preferredPaymentMethod: undefined,
      status: "active",
      outstandingBalance: 0,
    },
  });

  useEffect(() => {
    if (existingSupplier) {
      form.reset({
        name: existingSupplier.name,
        contactName: existingSupplier.contactName || "",
        email: existingSupplier.email || "",
        phone: existingSupplier.phone || "",
        address: existingSupplier.address || "",
        notes: existingSupplier.notes || "",
        preferredPaymentMethod: existingSupplier.preferredPaymentMethod,
        status: existingSupplier.status,
        outstandingBalance: existingSupplier.outstandingBalance,
      });
    }
  }, [existingSupplier, form]);

  async function onSubmit(data: SupplierFormValues) {
    const targetId = supplierId || supplier?.id;
    if (targetId) {
      await updateSupplier(targetId, data);
    } else {
      await createSupplier(data);
    }
    if (onSuccess) onSuccess();
  }

  const labelStyles =
    "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-2";
  const inputStyles =
    "h-10 rounded-xl border-2 border-gray-100 bg-white/50 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all font-bold text-sm placeholder:font-medium placeholder:text-muted-foreground/30";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <User className="w-3 h-3" /> Supplier Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Company or Corporate Entity"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <User className="w-3 h-3 opacity-50" /> Liaison Officer
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Full Name"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <Mail className="w-3 h-3" /> Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="supplier@verify.com"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <Phone className="w-3 h-3" /> Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Call Identity"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
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
                <MapPin className="w-3 h-3" /> Physical Address
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Street, City, Postcode"
                  className={inputStyles + " min-h-[80px] py-3 resize-none"}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!supplierId && (
            <FormField
              control={form.control}
              name="outstandingBalance"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={labelStyles}>
                    <DollarSign className="w-3 h-3" /> Opening Balance
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={inputStyles + " pl-10"}
                        value={
                          field.value === null || field.value === undefined
                            ? ""
                            : String(field.value)
                        }
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold mt-1" />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Account Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={inputStyles + " capitalize z-[60]"}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl z-[1001]">
                    <SelectItem
                      value="active"
                      className="capitalize font-bold text-xs py-2.5"
                    >
                      Active
                    </SelectItem>
                    <SelectItem
                      value="inactive"
                      className="capitalize font-bold text-xs py-2.5"
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
          name="preferredPaymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                <CreditCard className="w-3 h-3" /> Preferred Payment Method
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className={inputStyles + " z-[60]"}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-none shadow-2xl z-[1001]">
                  <SelectItem
                    value="Bank Transfer"
                    className="font-bold text-xs py-2.5"
                  >
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value="Cash" className="font-bold text-xs py-2.5">
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
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                <FileText className="w-3 h-3" /> Internal Records
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Administrative observations..."
                  className={inputStyles + " min-h-[80px] py-3 resize-none"}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 mt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="h-10 px-6 rounded-xl border-2 font-black text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black text-xs uppercase tracking-widest min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />{" "}
                {supplierId ? "Commit Updates" : "Register Supplier"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
