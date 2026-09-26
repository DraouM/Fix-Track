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
import { addMoneyTransfer, MoneyTransfer } from "@/lib/api/transfers";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface MoneyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function nowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const COMMON_ACCOUNTS = [
  "Cash Register",
  "Bank Account",
  "Safe / Vault",
  "Mobile Wallet",
];

export function MoneyTransferDialog({
  open,
  onOpenChange,
  onCreated,
}: MoneyTransferDialogProps) {
  const { t } = useTranslation();
  const { getCurrencySymbol } = useSettings();
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Transfer");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(nowLocalInput());
  const [processing, setProcessing] = useState(false);

  const resetForm = () => {
    setFromAccount("");
    setToAccount("");
    setAmount("");
    setMethod("Transfer");
    setNotes("");
    setDate(nowLocalInput());
  };

  const handleSubmit = async () => {
    const fromTrimmed = fromAccount.trim();
    const toTrimmed = toAccount.trim();
    const parsedAmount = parseFloat(amount);

    if (!fromTrimmed) {
      toast.error(t("payments.transferFromRequired", "Please specify the source account."));
      return;
    }
    if (!toTrimmed) {
      toast.error(t("payments.transferToRequired", "Please specify the destination account."));
      return;
    }
    if (fromTrimmed.toLowerCase() === toTrimmed.toLowerCase()) {
      toast.error(t("payments.transferSameAccount", "Source and destination accounts cannot be the same."));
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(t("payments.transferAmountRequired", "Please enter a valid amount greater than zero."));
      return;
    }

    const transfer: MoneyTransfer = {
      id: "",
      from_account: fromTrimmed,
      to_account: toTrimmed,
      amount: parsedAmount,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      method: method || "Transfer",
      notes: notes.trim() || undefined,
    };

    setProcessing(true);
    try {
      await addMoneyTransfer(transfer);
      toast.success(t("payments.transferCreated", "Transfer recorded successfully"));
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to record transfer:", error);
      toast.error(t("common.error", "An error occurred"));
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            {t("payments.transferTitle", "Money Transfer")}
          </DialogTitle>
          <DialogDescription>
            {t("payments.transferDesc", "Move funds between accounts with a full audit trail.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Visual transfer flow indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-semibold">
            <span className="truncate max-w-[42%] text-zinc-700 dark:text-zinc-300">
              {fromAccount.trim() || t("payments.fromAccount", "From Account")}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <ArrowRight className="h-4 w-4" />
            </div>
            <span className="truncate max-w-[42%] text-zinc-700 dark:text-zinc-300 text-right">
              {toAccount.trim() || t("payments.toAccount", "To Account")}
            </span>
          </div>

          {/* From Account */}
          <div className="grid gap-2">
            <Label htmlFor="transfer-from">{t("payments.fromAccount", "From Account")}</Label>
            <Input
              id="transfer-from"
              list="from-account-suggestions"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              placeholder={t("payments.fromAccountPlaceholder", "e.g. Cash Register")}
              autoFocus
            />
            <datalist id="from-account-suggestions">
              {COMMON_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_ACCOUNTS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setFromAccount(acc)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                    fromAccount === acc
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-background text-muted-foreground border-border hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* To Account */}
          <div className="grid gap-2">
            <Label htmlFor="transfer-to">{t("payments.toAccount", "To Account")}</Label>
            <Input
              id="transfer-to"
              list="to-account-suggestions"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder={t("payments.toAccountPlaceholder", "e.g. Bank Account")}
            />
            <datalist id="to-account-suggestions">
              {COMMON_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_ACCOUNTS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setToAccount(acc)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                    toAccount === acc
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-background text-muted-foreground border-border hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="transfer-amount">{t("common.amount", "Amount")}</Label>
              <div className="relative">
                <Input
                  id="transfer-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono pr-12"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground uppercase">
                  {getCurrencySymbol()}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transfer-method">{t("repairs.method", "Method")}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="transfer-method">
                  <SelectValue placeholder={t("repairs.method", "Method")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">{t("repairs.transfer", "Transfer")}</SelectItem>
                  <SelectItem value="Cash">{t("repairs.cash", "Cash")}</SelectItem>
                  <SelectItem value="Card">{t("repairs.card", "Card")}</SelectItem>
                  <SelectItem value="Check">{t("payments.check", "Check")}</SelectItem>
                  <SelectItem value="Internal">{t("payments.internal", "Internal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="transfer-date">{t("common.date", "Date")}</Label>
              <Input
                id="transfer-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transfer-notes">{t("common.notes", "Notes")}</Label>
              <Input
                id="transfer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("common.notesPlaceholder", "Optional notes...")}
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
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={processing} className="h-9">
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
