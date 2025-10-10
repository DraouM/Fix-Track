"use client";

import { z } from "zod";
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
import { toast } from "sonner";
import type { Supplier } from "@/types/supplier";

const supplierFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferredPaymentMethod: z
    .enum(["Bank Transfer", "Cash", "Check", "Credit Card"])
    .optional(),
  active: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess?: () => void;
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!supplier;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      contactName: supplier?.contactName ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      notes: supplier?.notes ?? "",
      preferredPaymentMethod: supplier?.preferredPaymentMethod,
      active: supplier?.active ?? true,
    },
  });

  async function onSubmit(data: SupplierFormValues) {
    try {
      // TODO: Implement supplier creation/update
      const response = await fetch("/api/suppliers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...data, id: supplier.id } : data),
      });

      if (!response.ok) throw new Error("Failed to save supplier");

      toast.success(
        isEditing
          ? "Supplier updated successfully"
          : "Supplier created successfully"
      );
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save supplier");
      console.error("Error saving supplier:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{isEditing ? "Edit Supplier" : "Add Supplier"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredPaymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Supplier" : "Create Supplier"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
