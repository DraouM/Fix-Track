"use client";

import React from "react";
import { 
  CreditCard, 
  Banknote, 
  ArrowUpRight, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Save 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/clientUtils";
import { TransactionType } from "@/types/transaction";
import { cn } from "@/lib/utils";

interface TransactionSummaryProps {
  type: TransactionType;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  isSaving: boolean;
  onUpdatePaidAmount: (amount: number) => void;
  onUpdatePaymentMethod: (method: string) => void;
  onComplete: () => void;
  onSaveDraft: () => void;
  disabled: boolean;
}

export function TransactionSummary({
  type,
  totalAmount,
  paidAmount,
  paymentMethod,
  isSaving,
  onUpdatePaidAmount,
  onUpdatePaymentMethod,
  onComplete,
  onSaveDraft,
  disabled,
}: TransactionSummaryProps) {
  const isSale = type === "Sale";
  const remainingBalance = totalAmount - paidAmount;
  
  const accentColor = isSale ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700";
  const lightAccent = isSale ? "bg-green-50/50" : "bg-blue-50/50";
  const borderAccent = isSale ? "border-green-100" : "border-blue-100";

  return (
    <Card className={cn("border shadow-md overflow-hidden", lightAccent)}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <CreditCard className={cn("h-4 w-4", isSale ? "text-green-600" : "text-blue-600")} />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium text-muted-foreground uppercase tracking-tight">
            <span>Subtotal</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-foreground border-t pt-3">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Cash", icon: Banknote, label: "Cash" },
              { id: "Card", icon: CreditCard, label: "Card" },
              { id: "Transfer", icon: ArrowUpRight, label: "Transfer" },
            ].map((method) => (
              <Button
                key={method.id}
                variant={paymentMethod === method.id ? "default" : "outline"}
                className={cn(
                  "h-16 flex flex-col gap-1 transition-all rounded-lg",
                  paymentMethod === method.id ? accentColor : "bg-background border-muted-foreground/10 hover:border-primary/50"
                )}
                onClick={() => onUpdatePaymentMethod(method.id)}
              >
                <method.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase">{method.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Amount {isSale ? "Received" : "Paid"}
          </label>
          <div className="relative group">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="number"
              value={paidAmount || ""}
              onChange={(e) => onUpdatePaidAmount(parseFloat(e.target.value) || 0)}
              className="pl-10 h-12 text-lg font-black bg-background border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl border transition-all",
            remainingBalance <= 0
              ? "bg-green-100/50 border-green-200 text-green-900"
              : "bg-orange-100/50 border-orange-200 text-orange-900"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
              {remainingBalance <= 0 ? (isSale ? "Change" : "Overpaid") : "Balance Due"}
            </span>
            <span className="font-black text-2xl tracking-tighter">
              {formatCurrency(Math.abs(remainingBalance))}
            </span>
          </div>
          {remainingBalance > 0 && (
            <p className="text-[10px] mt-2 font-bold uppercase flex items-center gap-1 opacity-70">
              <AlertCircle className="h-3 w-3" />
              Will be added to {isSale ? "customer credit" : "supplier debt"}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pb-6 pt-2 px-6">
        <Button
          className={cn("w-full h-14 text-lg font-black flex items-center justify-center gap-3 rounded-xl shadow-lg transition-all active:scale-[0.98]", accentColor)}
          disabled={disabled || isSaving}
          onClick={onComplete}
        >
          {isSaving ? (
             <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6" />
              Complete {isSale ? "Sale" : "Order"}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 text-xs font-bold uppercase tracking-widest bg-background border-muted-foreground/10 hover:bg-muted/50 rounded-xl transition-all"
          disabled={disabled || isSaving}
          onClick={onSaveDraft}
        >
          <Save className="h-4 w-4 mr-2 opacity-50" />
          Save as Draft
        </Button>
      </CardFooter>
    </Card>
  );
}
