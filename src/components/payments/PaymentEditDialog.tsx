"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { UnifiedPayment } from "@/types/payment";

interface PaymentEditDialogProps {
  payment: UnifiedPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PaymentEditDialog({
  payment,
  open,
  onOpenChange,
  onUpdate,
}: PaymentEditDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(payment.amount.toString());
  const [method, setMethod] = useState(payment.method);
  const [processing, setProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async () => {
    let command = "";
    if (payment.source_type === "Repair") command = "update_repair_payment";
    else if (payment.source_type === "Sale" || payment.source_type === "Purchase") command = "update_transaction_payment";
    else if (payment.source_type === "Client") command = "update_client_payment";
    else if (payment.source_type === "Supplier") command = "update_supplier_payment";

    if (!command) {
        toast.error("Editing for this payment type is not yet implemented.");
        return;
    }

    setProcessing(true);
    try {
      await invoke(command, {
        id: payment.id,
        amount: parseFloat(amount),
        method,
      });
      toast.success(t("payments.updated"));
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update payment:", error);
      toast.error(t("common.error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    let command = "";
    if (payment.source_type === "Repair") command = "delete_repair_payment";
    else if (payment.source_type === "Sale" || payment.source_type === "Purchase") command = "delete_transaction_payment";
    else if (payment.source_type === "Client") command = "delete_client_payment";
    else if (payment.source_type === "Supplier") command = "delete_supplier_payment";

    if (!command) {
        toast.error("Deletion for this payment type is not yet implemented.");
        return;
    }

    setProcessing(true);
    try {
      await invoke(command, { id: payment.id });
      toast.success(t("payments.deleted"));
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast.error(t("common.error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("payments.editPayment")}</DialogTitle>
          <DialogDescription>
            {t("payments.editCaution")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("common.warning")}</AlertTitle>
            <AlertDescription className="text-xs">
              {t("payments.editCaution")}
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="amount">{t("common.amount")}</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="method">{t("repairs.method")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">{t("repairs.cash")}</SelectItem>
                <SelectItem value="Card">{t("repairs.card")}</SelectItem>
                <SelectItem value="Transfer">{t("repairs.transfer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              className="sm:mr-auto h-9"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={processing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.delete")}
            </Button>
          ) : (
            <div className="flex items-center gap-2 sm:mr-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={processing}
                className="h-8"
              >
                {t("common.confirm")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={processing}
                className="h-8"
              >
                {t("common.cancel")}
              </Button>
            </div>
          )}
          <Button onClick={handleUpdate} disabled={processing} className="h-9">
            <Save className="h-4 w-4 mr-2" />
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
