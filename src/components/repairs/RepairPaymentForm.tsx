"use client";

// Payment form for processing repair payments

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRepairContext } from "@/context/RepairContext";
import type { Repair } from "@/types/repair";

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  method: z.enum(["Cash", "Card", "Transfer"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface RepairPaymentFormProps {
  repair: Repair;
  onSuccess?: () => void;
}

export function RepairPaymentForm({
  repair,
  onSuccess,
}: RepairPaymentFormProps) {
  const { updatePaymentStatus, addPayment } = useRepairContext();
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: "Cash",
    },
  });

  const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const remainingBalance = repair.estimatedCost - totalPaid;

  const handleSubmit = async (values: PaymentFormValues) => {
    setLoading(true);

    const newTotalPaid = totalPaid + values.amount;

    // Figure out new status
    let newStatus: Repair["paymentStatus"] = "Unpaid";
    if (newTotalPaid >= repair.estimatedCost) {
      newStatus = "Paid";
    } else if (newTotalPaid > 0) {
      newStatus = "Partially Paid";
    }

    try {
      // Add the payment to the repair's payments history
      await addPayment(repair.id, {
        repair_id: repair.id,
        amount: values.amount,
        method: values.method,
      });

      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 p-4 border rounded-lg shadow-sm bg-card"
      >
        <div className="text-sm text-muted-foreground">
          Remaining Balance:{" "}
          <span className="font-semibold">${remainingBalance.toFixed(2)}</span>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter payment amount"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? 0 : parseFloat(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Payment"}
        </Button>
      </form>
    </Form>
  );
}
