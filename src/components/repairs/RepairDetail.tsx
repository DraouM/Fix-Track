"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Smartphone,
  AlertCircle,
  Clock,
  CheckCircle2,
  Printer,
  History,
  Plus,
  ShieldCheck,
  CreditCard,
  FileText,
  SmartphoneNfc,
  Wrench,
  Loader2,
  Check,
  Receipt,
  Tag,
  Banknote,
  Eye,
} from "lucide-react";
import { useRepairActions, useRepairContext } from "@/context/RepairContext";
import { useSettings } from "@/context/SettingsContext";
import { Repair, RepairStatus, RepairHistory } from "@/types/repair";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { cn } from "@/lib/utils";
import { formatCurrencySmart } from "@/lib/formatters";
import { RepairPaymentForm } from "./RepairPaymentForm";
import { invoke } from "@tauri-apps/api/core";

interface RepairDetailProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<
  RepairStatus,
  { color: string; bg: string; icon: any }
> = {
  Pending: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    icon: Clock,
  },
  "In Progress": {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    icon: SmartphoneNfc,
  },
  Completed: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
    icon: CheckCircle2,
  },
  Delivered: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    icon: ShieldCheck,
  },
};

// Colored chip per payment method
const methodStyles: Record<string, string> = {
  cash: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  card: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  transfer:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  mobile_money:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  check: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export function RepairDetail({
  repair,
  open,
  onOpenChange,
}: RepairDetailProps) {
  const { t, i18n } = useTranslation();
  const { updateRepairStatus, fetchRepairById } = useRepairActions();
  const { getItemById, repairs } = useRepairContext();
  const { settings } = useSettings();
  const { printReceipt, printSticker, printRepairSequence, previewReceipt } =
    usePrintUtils();

  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [isPrintingSticker, setIsPrintingSticker] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  // State to hold the repair history separately
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);

  // Sync with context for real-time updates
  const currentRepair = useMemo(() => {
    if (!repair) return null;
    return getItemById(repair.id) || repair;
  }, [repair, getItemById, repairs]);

  // Use the separately fetched history if available, otherwise use the repair's history
  const currentRepairHistory =
    repairHistory.length > 0 ? repairHistory : currentRepair?.history || [];

  // Calculate financial values based on payments to ensure accuracy
  const totalPaid = useMemo(() => {
    if (currentRepair?.payments && currentRepair.payments.length > 0) {
      return currentRepair.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
    }
    return currentRepair?.totalPaid || 0;
  }, [currentRepair]);

  const remainingBalance = useMemo(() => {
    const estimatedCost = currentRepair?.estimatedCost || 0;
    return estimatedCost - totalPaid;
  }, [currentRepair?.estimatedCost, totalPaid]);

  // Share of the estimated cost already collected (for the progress bar)
  const paidPercent = useMemo(() => {
    const estimatedCost = currentRepair?.estimatedCost || 0;
    if (estimatedCost <= 0) return 0;
    return Math.min(100, Math.round((totalPaid / estimatedCost) * 100));
  }, [currentRepair?.estimatedCost, totalPaid]);

  // Payments sorted newest first, capped at 3 unless expanded
  const sortedPayments = useMemo(() => {
    const list = [...(currentRepair?.payments || [])];
    list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return list;
  }, [currentRepair?.payments]);

  const visiblePayments = showAllPayments
    ? sortedPayments
    : sortedPayments.slice(0, 3);

  // Refetch repair data when dialog opens to ensure latest parts/payments
  useEffect(() => {
    if (open && repair?.id) {
      fetchRepairById(repair.id);

      // Fetch history separately to ensure it's properly merged with the repair
      const fetchRepairHistory = async () => {
        try {
          const historyData: RepairHistory[] = await invoke(
            "get_history_for_repair",
            { repairId: repair.id },
          );
          setRepairHistory(historyData);
        } catch (error) {
          console.error("Error fetching repair history:", error);
        }
      };

      fetchRepairHistory();
    }
  }, [open, repair?.id, fetchRepairById]);

  if (!currentRepair) return null;

  // Locale used for all date/number formatting in this dialog
  const localeValue = t("common.locale", "en-US");
  const currentLocale =
    localeValue === "ar-SA"
      ? "ar-DZ"
      : localeValue === "fr-FR"
        ? "fr-FR"
        : "en-US";

  // Money values: word symbols (DA, MAD...) as suffix, no redundant prefix
  const fmt = (value: number) =>
    formatCurrencySmart(value, settings.currency, currentLocale);

  // Parse backend dates defensively (ISO, timestamp, or dd/MM/yyyy)
  const parseDate = (date: string): Date => {
    try {
      let dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(parseInt(date));
        if (isNaN(dateObj.getTime())) {
          const parsed = Date.parse(date.replace(/-/g, "/"));
          dateObj = isNaN(parsed) ? new Date() : new Date(parsed);
        }
      }
      return dateObj;
    } catch (e) {
      console.error("Error parsing date:", date, e);
      return new Date();
    }
  };

  const formatDate = (date: string) =>
    parseDate(date).toLocaleDateString(currentLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date: string) =>
    parseDate(date).toLocaleTimeString(currentLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const status =
    statusConfig[currentRepair.status as RepairStatus] ||
    statusConfig["Pending"];

  const partsSubtotal =
    currentRepair.usedParts?.reduce((sum, p) => {
      const partAsAny = p as any;
      const quantity = partAsAny.quantity || partAsAny.qty || 0;
      const cost = partAsAny.cost || partAsAny.unitCost || partAsAny.price || 0;
      return sum + quantity * cost;
    }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col gap-0 border-none dark:border dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden dark:bg-slate-900 [&>button]:opacity-100 [&>button]:text-white [&>button]:rounded-lg [&>button]:hover:bg-white/15 [&>button]:transition-colors">
        {/* Top Branding Section */}
        <div className="shrink-0 bg-primary dark:bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-white/5 dark:border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Wrench className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                {t("repairs.orderDetail")}
              </h2>
            </div>
            <DialogTitle className="text-xl font-black">
              #
              {currentRepair.code ||
                currentRepair.id.split("-")[0].toUpperCase()}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-end hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {t("repairs.created")}
              </p>
              <p className="text-xs font-bold">
                {formatDate(currentRepair.createdAt)} •{" "}
                {formatTime(currentRepair.createdAt)}
              </p>
            </div>
            <Badge
              className={cn(
                "px-3 py-1.5 rounded-xl border-none shadow-lg text-[10px] font-black uppercase tracking-widest",
                status.bg,
                status.color,
              )}
            >
              <status.icon className="h-3 w-3 mr-1.5" />
              {t(
                `repairs.${currentRepair.status
                  .toLowerCase()
                  .replace(/\s+/g, "")}`,
              ) || currentRepair.status}
            </Badge>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bg-[#fdfdfd] dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8 p-5 space-y-5">
              {/* Customer + Device */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <User className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.customerDevice")}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary font-black">
                      {currentRepair.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                        {currentRepair.customerName}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 opacity-60">
                        <SmartphoneNfc className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {currentRepair.customerPhone || t("repairs.noPhone")}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Smartphone className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.deviceDetails")}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                        {currentRepair.deviceBrand} {currentRepair.deviceModel}
                      </p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                        {t("repairs.warrantyActive")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complaint / Diagnosis */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    {t("repairs.diagnosisAndReport")}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute start-0 top-0 bottom-0 w-1 bg-orange-500/40" />
                  <p className="text-xs font-medium text-gray-700 dark:text-slate-300 leading-relaxed italic">
                    "{currentRepair.issueDescription}"
                  </p>
                </div>
              </div>

              {/* Parts Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.partsAndServices")}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                    {currentRepair.usedParts?.length || 0}{" "}
                    {t("repairs.parts").toLowerCase()}
                  </span>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                  <table className="w-full text-start border-collapse min-w-[380px]">
                    <thead>
                      <tr className="bg-muted/5 dark:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800">
                        <th className="px-4 py-2 text-start text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("repairs.itemDescription")}
                        </th>
                        <th className="px-2 py-2 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground w-12">
                          {t("repairs.qty")}
                        </th>
                        <th className="px-2 py-2 text-end text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("repairs.unitPrice")}
                        </th>
                        <th className="px-4 py-2 text-end text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("repairs.subtotal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                      {currentRepair.usedParts &&
                      currentRepair.usedParts.length > 0 ? (
                        currentRepair.usedParts.map((part, idx) => {
                          const partAsAny = part as any;
                          const partName =
                            partAsAny.partName ||
                            partAsAny.name ||
                            partAsAny.part_name ||
                            t("repairs.customPart");
                          const quantity =
                            partAsAny.quantity || partAsAny.qty || 0;
                          const cost =
                            partAsAny.cost ||
                            partAsAny.unitCost ||
                            partAsAny.price ||
                            0;

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-tight">
                                {partName}
                              </td>
                              <td className="px-2 py-2 text-xs font-bold text-center text-gray-500">
                                {quantity}
                              </td>
                              <td className="px-2 py-2 text-xs font-bold text-end text-gray-500 tabular-nums">
                                {fmt(cost)}
                              </td>
                              <td className="px-4 py-2 text-xs font-black text-end text-foreground dark:text-slate-200 tabular-nums">
                                {fmt(quantity * cost)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em]"
                          >
                            {t("repairs.noParts")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/5 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
                        <td
                          colSpan={3}
                          className="px-4 py-2.5 text-[10px] font-black text-end uppercase tracking-widest text-muted-foreground dark:text-slate-400"
                        >
                          {t("repairs.subtotal")} ({t("repairs.parts")})
                        </td>
                        <td className="px-4 py-2.5 text-sm font-black text-end text-primary dark:text-blue-400 tabular-nums">
                          {fmt(partsSubtotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-3 w-3 text-green-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.recentPayments")}
                    </span>
                  </div>
                  {sortedPayments.length > 3 && (
                    <button
                      onClick={() => setShowAllPayments((v) => !v)}
                      className="text-[9px] font-black uppercase tracking-wider text-primary hover:underline"
                    >
                      {showAllPayments
                        ? t("repairs.hidePayments")
                        : t("repairs.viewAllPayments", {
                            count: sortedPayments.length - 3,
                          })}
                    </button>
                  )}
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm divide-y divide-gray-50 dark:divide-slate-800 overflow-hidden">
                  {visiblePayments.length > 0 ? (
                    visiblePayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              methodStyles[p.method] ||
                                "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
                            )}
                          >
                            {t(`repairs.${p.method.toLowerCase()}`) || p.method}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap tabular-nums">
                            {formatDate(p.date)} • {formatTime(p.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-green-600 dark:text-green-400 tabular-nums">
                            {fmt(p.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-6 text-center text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em]">
                      {t("repairs.noPaymentsYet")}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline / History */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.historyLogs")}
                    </span>
                  </div>
                  <div className="text-[8px] font-bold text-muted-foreground">
                    {t("repairs.eventsCount", {
                      count: currentRepairHistory?.length || 0,
                    })}
                  </div>
                </div>
                <div className="space-y-2 ps-4 border-s-2 border-gray-100 dark:border-slate-800 ms-1">
                  {currentRepairHistory && currentRepairHistory.length > 0 ? (
                    (() => {
                      const allHistory = [...currentRepairHistory].reverse();
                      const displayHistory = expandedHistory
                        ? allHistory
                        : allHistory.slice(0, 5);
                      const hasMore = allHistory.length > 5;

                      return (
                        <>
                          {displayHistory.map((log, idx) => {
                            const event = log.event;
                            let content = "";
                            let icon = <Clock className="h-3 w-3" />;

                            if (event && typeof event === "object") {
                              if (event.type === "StatusChanged") {
                                content = t("repairs.history.statusChanged", {
                                  to:
                                    t(
                                      `repairs.${event.to
                                        .toLowerCase()
                                        .replace(/\s+/g, "")}`,
                                    ) || event.to,
                                });
                                icon = (
                                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                                );
                              } else if (event.type === "PaymentAdded") {
                                const eventAsAny = event as any;
                                const eventDetailsAmount =
                                  eventAsAny.details?.match(
                                    /\$([\d.]+)/,
                                  )?.[1] || "0";
                                const amount =
                                  eventAsAny.amount ||
                                  eventAsAny.total_amount ||
                                  eventAsAny.payment_amount ||
                                  parseFloat(eventDetailsAmount) ||
                                  0;
                                content = t("repairs.history.paymentAdded", {
                                  symbol: "",
                                  amount: fmt(amount),
                                });
                                icon = (
                                  <CreditCard className="h-3 w-3 text-green-500" />
                                );
                              } else if (event.type === "PartAdded") {
                                const eventAsAny = event as any;
                                const pname =
                                  eventAsAny.partName ||
                                  eventAsAny.name ||
                                  eventAsAny.part_name;
                                const pqty =
                                  eventAsAny.qty || eventAsAny.quantity || 1;
                                content = t("repairs.history.partAdded", {
                                  name: pname,
                                  qty: pqty,
                                });
                                icon = (
                                  <Plus className="h-3 w-3 text-orange-500" />
                                );
                              } else if (event.type === "Note") {
                                content = t("repairs.history.note", {
                                  text:
                                    event.text?.length > 40
                                      ? `${event.text.substring(0, 40)}...`
                                      : event.text,
                                });
                                icon = (
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                );
                              } else {
                                content = `Event: ${JSON.stringify(event)}`;
                                icon = (
                                  <Clock className="h-3 w-3 text-gray-500" />
                                );
                              }
                            } else {
                              const logAsAny = log as any;
                              if (logAsAny.event_type && logAsAny.details) {
                                content = logAsAny.details;
                                switch (logAsAny.event_type) {
                                  case "status_changed":
                                    icon = (
                                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                                    );
                                    break;
                                  case "payment_added":
                                    const detailsAmount =
                                      logAsAny.details?.match(
                                        /\$([\d.]+)/,
                                      )?.[1] || "0";
                                    const pAmount =
                                      logAsAny.amount ||
                                      logAsAny.total_amount ||
                                      logAsAny.payment_amount ||
                                      parseFloat(detailsAmount) ||
                                      0;
                                    content = t(
                                      "repairs.history.paymentAdded",
                                      {
                                        symbol: "",
                                        amount: fmt(pAmount),
                                      },
                                    );
                                    icon = (
                                      <CreditCard className="h-3 w-3 text-green-500" />
                                    );
                                    break;
                                  case "part_added":
                                    const lpname = logAsAny.partName || "Item";
                                    const lpqty = logAsAny.qty || 1;
                                    content = t("repairs.history.partAdded", {
                                      name: lpname,
                                      qty: lpqty,
                                    });
                                    icon = (
                                      <Plus className="h-3 w-3 text-orange-500" />
                                    );
                                    break;
                                  case "note":
                                    content = t("repairs.history.note", {
                                      text:
                                        logAsAny.details?.length > 40
                                          ? `${logAsAny.details.substring(
                                              0,
                                              40,
                                            )}...`
                                          : logAsAny.details,
                                    });
                                    icon = (
                                      <FileText className="h-3 w-3 text-muted-foreground" />
                                    );
                                    break;
                                  default:
                                    icon = (
                                      <Clock className="h-3 w-3 text-gray-500" />
                                    );
                                }
                              } else {
                                content = t("repairs.history.unknown");
                                icon = (
                                  <Clock className="h-3 w-3 text-gray-500" />
                                );
                              }
                            }

                            const logDate =
                              log.timestamp ||
                              (log as any).date ||
                              (log as any).created_at;

                            return (
                              <div key={idx} className="relative">
                                <div className="absolute -start-[1.15rem] top-3.5 h-2 w-2 rounded-full border-2 border-white dark:border-slate-950 bg-primary" />
                                <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="opacity-70 shrink-0">
                                      {icon}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate">
                                      {content}
                                    </p>
                                  </div>
                                  <p className="text-[8px] font-black text-primary dark:text-blue-400 uppercase tracking-wider whitespace-nowrap shrink-0 tabular-nums">
                                    {formatDate(logDate)} •{" "}
                                    {formatTime(logDate)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {hasMore && (
                            <button
                              onClick={() => setExpandedHistory((v) => !v)}
                              className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                            >
                              {expandedHistory
                                ? t("repairs.hidePayments")
                                : t("repairs.showMoreEvents", {
                                    count: allHistory.length - 5,
                                  })}
                            </button>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground py-3 uppercase tracking-[0.15em] opacity-40 text-center">
                      {t("repairs.noHistory")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel Area */}
            <div className="lg:col-span-4 border-s border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 flex flex-col">
              {/* Status Quick Control */}
              <div className="space-y-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("repairs.statusControl")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "Pending",
                      "In Progress",
                      "Completed",
                      "Delivered",
                    ] as RepairStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={async () => {
                        await updateRepairStatus(currentRepair.id, s);
                        // Refetch repair data to ensure latest history is shown
                        fetchRepairById(currentRepair.id);
                      }}
                      className={cn(
                        "px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5",
                        currentRepair.status === s
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-muted-foreground hover:border-primary/20 hover:text-primary dark:hover:text-blue-400",
                      )}
                    >
                      {currentRepair.status === s && (
                        <Check className="h-3 w-3" />
                      )}
                      {t(`repairs.${s.toLowerCase().replace(/\s+/g, "")}`) || s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-2.5 pt-4 border-t border-gray-50 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("repairs.financialOverview")}
                </p>

                {/* Total estimated */}
                <div className="p-4 rounded-2xl bg-primary/5 dark:bg-blue-900/10 border border-primary/10 dark:border-blue-900/20 flex flex-col items-center justify-center shadow-inner">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-primary dark:text-blue-400 mb-0.5">
                    {t("repairs.totalEstimated")}
                  </p>
                  <p className="text-2xl md:text-3xl font-black text-primary dark:text-blue-500 tracking-tighter tabular-nums">
                    {fmt(currentRepair.estimatedCost)}
                  </p>
                </div>

                {/* Paid / Remaining — the two headline numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-green-500/10 dark:bg-green-900/15 border border-green-500/25 flex flex-col">
                    <span className="text-[8px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-0.5">
                      {t("repairs.paidAmount")}
                    </span>
                    <span className="text-lg font-black text-green-700 dark:text-green-300 tabular-nums">
                      {fmt(totalPaid)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl border flex flex-col",
                      remainingBalance > 0
                        ? "bg-red-500/10 dark:bg-red-900/15 border-red-500/25"
                        : "bg-green-500/10 dark:bg-green-900/15 border-green-500/25",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest mb-0.5",
                        remainingBalance > 0
                          ? "text-red-700 dark:text-red-400"
                          : "text-green-700 dark:text-green-400",
                      )}
                    >
                      {t("repairs.totalBalance")}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-black tabular-nums",
                        remainingBalance > 0
                          ? "text-red-700 dark:text-red-300"
                          : "text-green-700 dark:text-green-300",
                      )}
                    >
                      {fmt(remainingBalance)}
                    </span>
                  </div>
                </div>

                {/* Running balance / collection progress */}
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground text-center tabular-nums">
                    {t("repairs.collectionProgress", { percent: paidPercent })}
                  </p>
                </div>
              </div>

              {/* Payment Form Injection */}
              <div className="pt-4 border-t border-gray-50 flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2.5">
                  {t("repairs.recordNewTransaction")}
                </p>
                <div className="p-2 rounded-2xl border border-gray-100/50 dark:border-slate-800/50 bg-gray-50/30 dark:bg-slate-950/30">
                  <RepairPaymentForm
                    repair={currentRepair}
                    onSuccess={() => {
                      // Refetch repair data to update parts/payments immediately
                      if (repair?.id) {
                        fetchRepairById(repair.id);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Action Bar */}
        <div className="shrink-0 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              previewReceipt(currentRepair, {
                includePayments: true,
                includeParts: true,
              })
            }
            className="h-10 rounded-xl text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5 me-2" />
            {t("repairs.previewReceipt")}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setIsPrintingReceipt(true);
              await printReceipt(currentRepair, {
                includePayments: true,
                includeParts: true,
              });
              setIsPrintingReceipt(false);
            }}
            disabled={isPrintingReceipt || isPrintingSticker}
            className="h-10 rounded-xl border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary"
          >
            {isPrintingReceipt ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin me-2" />
            ) : (
              <Receipt className="h-3.5 w-3.5 me-2" />
            )}
            {t("repairs.printReceipt")}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setIsPrintingSticker(true);
              await printSticker(currentRepair);
              setIsPrintingSticker(false);
            }}
            disabled={isPrintingReceipt || isPrintingSticker}
            className="h-10 rounded-xl border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary"
          >
            {isPrintingSticker ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin me-2" />
            ) : (
              <Tag className="h-3.5 w-3.5 me-2" />
            )}
            {t("repairs.printSticker")}
          </Button>
          <Button
            onClick={async () => {
              setIsPrintingReceipt(true);
              await printRepairSequence(currentRepair);
              setIsPrintingReceipt(false);
            }}
            disabled={isPrintingReceipt || isPrintingSticker}
            className="h-10 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 font-black text-[10px] uppercase tracking-widest group"
          >
            {isPrintingReceipt ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Printer className="h-4 w-4 me-2 transition-transform group-hover:scale-110" />
            )}
            {t("repairs.printAll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
