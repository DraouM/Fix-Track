"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientContext } from "@/context/ClientContext";
import { Loader2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/clientUtils";

const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientPaymentModal({ isOpen, onClose, clientId }: ClientPaymentModalProps) {
  const { clients, addPayment, loading } = useClientContext();
  
  const client = clientId ? clients.find(c => c.id === clientId) : null;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: "Cash",
      notes: "",
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    if (!clientId) return;
    await addPayment(clientId, data.amount, data.method, data.notes);
    form.reset();
    onClose();
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Record Client Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment from <span className="font-bold text-foreground">{client.name}</span>. 
            This will reduce their outstanding balance.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 flex justify-between items-center border dark:border-slate-800">
          <span className="text-sm font-medium">Current Balance:</span>
          <span className="text-lg font-bold text-destructive dark:text-red-400">
            {formatCurrency(client.outstandingBalance)}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 font-bold"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      <SelectTrigger className="rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="dark:bg-slate-900 border-none shadow-2xl">
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Receipt number, check number, etc." 
                      className="rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl border-2 dark:border-slate-800 font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...</>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
