"use client";

import React, { useState } from "react";
import { X, DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { PaymentMethod } from "@/types/supplier";
import { useSupplierActions } from "@/context/SupplierContext";
import { Button } from "@/components/ui/button";

interface SupplierPaymentModalProps {
  supplierId: string;
  supplierName: string;
  currentBalance: number;
  onClose: () => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  supplierId,
  supplierName,
  currentBalance,
  onClose,
}) => {
  const { addPayment } = useSupplierActions();
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill amount with full balance if logical, but let's start empty or 0
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    setIsSubmitting(true);
    try {
      await addPayment(supplierId, parseFloat(amount), method, notes);
      onClose();
    } catch (error) {
      console.error("Failed to add payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Record Payment</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">For {supplierName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-400 font-medium">Current Balance Due:</span>
            <span className="font-bold text-blue-800 dark:text-blue-300 text-lg">
              ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-950 text-foreground transition-all outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {currentBalance > 0 && parseFloat(amount || "0") > currentBalance && (
              <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                Note: Amount exceeds current balance due.
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-950 text-foreground"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date - displayed as "Today" for now since backend uses NOW() */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              Date
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-slate-400 text-sm">
                Today ({new Date().toLocaleDateString()})
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              Reference / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-950 text-foreground min-h-[80px] resize-none"
              placeholder="e.g. Invoice #1234 ref"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
