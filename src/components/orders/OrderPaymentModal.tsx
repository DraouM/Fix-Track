"use client";

import React, { useState } from "react";
import { X, DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addOrderPayment } from "@/lib/api/orders";
import { toast } from "sonner";

interface OrderPaymentModalProps {
  orderId: string;
  orderNumber: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  orderId,
  orderNumber,
  supplierName,
  totalAmount,
  paidAmount,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingBalance = totalAmount - paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
    }

    setIsSubmitting(true);
    try {
      await addOrderPayment({
        id: crypto.randomUUID(),
        order_id: orderId,
        amount: paymentAmount,
        method,
        date: new Date().toISOString(),
        notes: notes || undefined,
        received_by: undefined
      });
      
      toast.success(`Payment of $${paymentAmount.toFixed(2)} recorded for Order ${orderNumber}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add order payment:", error);
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Record Order Payment</h3>
            <p className="text-sm text-gray-500">Order {orderNumber} • {supplierName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">Remaining Balance:</span>
            <span className="font-bold text-blue-800 text-lg">
              ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {parseFloat(amount || "0") > remainingBalance && (
              <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                Note: Amount exceeds remaining order balance.
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Date
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium">
                Today ({new Date().toLocaleDateString()})
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Reference / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none"
              placeholder="e.g. Transaction Ref, Receipt #"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transform transition-transform active:scale-95"
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
