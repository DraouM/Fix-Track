"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Wallet, CreditCard, ArrowRightLeft, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const paymentSchema = z.object({
  amount: z.number().min(0.01, { message: "Amount must be greater than 0" }),
  method: z.enum(["Cash", "Card", "Transfer"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface RepairPaymentFormProps {
  repair: Repair;
  onSuccess?: () => void;
}

const methods = [
  { id: "Cash", label: "repairs.cash", icon: Wallet },
  { id: "Card", label: "repairs.card", icon: CreditCard },
  { id: "Transfer", label: "repairs.transfer", icon: ArrowRightLeft },
];

export function RepairPaymentForm({
  repair,
  onSuccess,
}: RepairPaymentFormProps) {
  const { t } = useTranslation();
  const { addPayment, fetchRepairById } = useRepairContext();
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: "Cash",
    },
  });

  const handleSubmit = async (values: PaymentFormValues) => {
    setLoading(true);
    try {
      await addPayment(repair.id, {
        repair_id: repair.id,
        amount: values.amount,
        method: values.method,
      });

      form.reset({ amount: 0, method: values.method });
      // Refresh context data to reflect new payment/balance
      await fetchRepairById(repair.id);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to add payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                {t("repairs.amount")}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-10 pl-9 rounded-xl bg-white border-gray-100 font-black text-sm shadow-sm focus:ring-primary/20 transition-all"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] uppercase font-bold" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70 border-t border-gray-50 pt-3 block mt-2">
                {t("repairs.method") || "Method"}
              </FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => field.onChange(m.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all gap-1.5",
                      field.value === m.id
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "bg-white border-gray-100 text-muted-foreground hover:border-primary/20 hover:bg-gray-50 opacity-80"
                    )}
                  >
                    <m.icon
                      className={cn(
                        "h-3.5 w-3.5",
                        field.value === m.id ? "text-white" : "text-primary"
                      )}
                    />
                    <span className="text-[7px] font-black uppercase tracking-widest">
                      {t(m.label)}
                    </span>
                  </button>
                ))}
              </div>
              <FormMessage className="text-[10px] uppercase font-bold" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading || form.watch("amount") <= 0}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/10 transition-all active:scale-95"
        >
          {loading ? t("repairs.processing") : t("repairs.addPayment")}
        </Button>
      </form>
    </Form>
  );
}
