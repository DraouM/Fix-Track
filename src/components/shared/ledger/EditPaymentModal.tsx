"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export interface EditPaymentModalProps {
  mode: "client" | "supplier";
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  currentAmount: number;
  currentMethod: string;
  onSuccess: () => void;
}

export function EditPaymentModal({
  mode,
  isOpen,
  onClose,
  paymentId,
  currentAmount,
  currentMethod,
  onSuccess,
}: EditPaymentModalProps) {
  const [amount, setAmount] = useState(currentAmount);
  const [method, setMethod] = useState(currentMethod || "Cash");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount);
      setMethod(currentMethod || "Cash");
    }
  }, [isOpen, currentAmount, currentMethod]);

  const handleSave = async () => {
    if (amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      const command =
        mode === "client" ? "update_client_payment" : "update_supplier_payment";
      await invoke(command, { id: paymentId, amount, method });
      toast.success(
        mode === "client" ? "Payment updated successfully" : "Settlement updated successfully"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2rem] dark:bg-slate-900 dark:border-slate-800 border-none shadow-2xl">
        <DialogHeader className="pb-4 border-b dark:border-slate-800">
          <DialogTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Edit2 className="h-4 w-4" />
            </div>
            {mode === "client" ? "Edit Payment" : "Edit Settlement"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Amount
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="h-11 rounded-xl dark:bg-slate-950 dark:border-slate-700 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Payment Method
            </label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-11 rounded-xl dark:bg-slate-950 dark:border-slate-700 font-medium">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border-dashed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
