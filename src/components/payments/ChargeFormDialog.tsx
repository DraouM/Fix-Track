"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { toast } from "sonner";
import { addExpense, Expense } from "@/lib/api/expense";
import { Receipt } from "lucide-react";

interface ChargeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

// Default datetime-local value (local time, rounded to the minute)
function nowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function ChargeFormDialog({
  open,
  onOpenChange,
  onCreated,
}: ChargeFormDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("Cash");
  const [partyName, setPartyName] = useState("");
  const [date, setDate] = useState(nowLocalInput());
  const [processing, setProcessing] = useState(false);

  const resetForm = () => {
    setAmount("");
    setReason("");
    setCategory("");
    setMethod("Cash");
    setPartyName("");
    setDate(nowLocalInput());
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!reason.trim()) {
      toast.error(t("payments.chargeReasonRequired"));
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(t("payments.chargeAmountRequired"));
      return;
    }

    const charge: Expense = {
      id: "",
      amount: parsedAmount,
      reason: reason.trim(),
      category: category.trim() || undefined,
      party_name: partyName.trim() || undefined,
      method,
      date: date ? new Date(date).toISOString() : "",
    };

    setProcessing(true);
    try {
      await addExpense(charge);
      toast.success(t("payments.chargeCreated"));
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to record charge:", error);
      toast.error(t("common.error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!processing) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-red-500" />
            {t("payments.newCharge")}
          </DialogTitle>
          <DialogDescription>{t("payments.chargesDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="charge-amount">{t("common.amount")}</Label>
            <Input
              id="charge-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="charge-reason">{t("payments.reason")}</Label>
            <Input
              id="charge-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("payments.reasonPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="charge-category">{t("payments.category")}</Label>
              <Input
                id="charge-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t("payments.categoryPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="charge-method">{t("repairs.method")}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="charge-method">
                  <SelectValue placeholder={t("repairs.method")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">{t("repairs.cash")}</SelectItem>
                  <SelectItem value="Card">{t("repairs.card")}</SelectItem>
                  <SelectItem value="Transfer">{t("repairs.transfer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="charge-date">{t("common.date")}</Label>
              <Input
                id="charge-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="charge-payee">{t("payments.payee")}</Label>
              <Input
                id="charge-payee"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={t("payments.payeePlaceholder")}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="h-9"
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={processing} className="h-9">
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
