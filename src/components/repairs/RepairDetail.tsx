"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Smartphone,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle2,
  Printer,
  History,
  MoreVertical,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  Calendar,
  SmartphoneNfc,
  Wrench,
  Loader2,
  Check,
} from "lucide-react";
import { useRepairActions, useRepairContext } from "@/context/RepairContext";
import { useSettings } from "@/context/SettingsContext";
import {
  Repair,
  RepairStatus,
  PaymentStatus,
  RepairHistory,
} from "@/types/repair";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { cn } from "@/lib/utils";
import { RepairPaymentForm } from "./RepairPaymentForm";
import { ReceiptTemplate } from "@/components/helpers/ReceiptTemplate";
import { StickerTemplate } from "@/components/helpers/StickerTemplate";
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
  Pending: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", icon: Clock },
  "In Progress": {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    icon: SmartphoneNfc,
  },
  Completed: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40", icon: CheckCircle2 },
  Delivered: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    icon: ShieldCheck,
  },
};

export function RepairDetail({
  repair,
  open,
  onOpenChange,
}: RepairDetailProps) {
  const { t } = useTranslation();
  const { updateRepairStatus, fetchRepairById } = useRepairActions();
  const { getItemById, repairs } = useRepairContext();
  const { getCurrencySymbol } = useSettings();
  const { printReceipt, printSticker } = usePrintUtils();
  
  const currencySymbol = getCurrencySymbol();

  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [isPrintingSticker, setIsPrintingSticker] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);

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
        0
      );
    }
    return currentRepair?.totalPaid || 0;
  }, [currentRepair]);

  const remainingBalance = useMemo(() => {
    const estimatedCost = currentRepair?.estimatedCost || 0;
    return estimatedCost - totalPaid;
  }, [currentRepair?.estimatedCost, totalPaid]);

  // Refetch repair data when dialog opens to ensure latest parts/payments
  useEffect(() => {
    if (open && repair?.id) {
      fetchRepairById(repair.id);

      // Fetch history separately to ensure it's properly merged with the repair
      const fetchRepairHistory = async () => {
        try {
          const historyData: RepairHistory[] = await invoke(
            "get_history_for_repair",
            { repairId: repair.id }
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

  const formatDate = (date: string) => {
    // Handle different date formats that might come from the backend
    let dateObj: Date;

    try {
      // First try parsing as ISO string
      dateObj = new Date(date);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        // If not valid, try other formats
        dateObj = new Date(parseInt(date)); // Try as timestamp

        if (isNaN(dateObj.getTime())) {
          // If still not valid, try to parse with common formats
          const parsedDate = Date.parse(date.replace(/-/g, "/"));
          dateObj = isNaN(parsedDate) ? new Date() : new Date(parsedDate);
        }
      }
    } catch (e) {
      console.error("Error parsing date:", date, e);
      dateObj = new Date();
    }

    // Determine locale based on the current language
    const localeValue = t("common.locale", "en-US");
    const currentLocale =
      localeValue === "ar-SA"
        ? "ar-SA"
        : localeValue === "fr-FR"
        ? "fr-FR"
        : "en-US";

    return dateObj.toLocaleDateString(currentLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const status =
    statusConfig[currentRepair.status as RepairStatus] ||
    statusConfig["Pending"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col border-none dark:border dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden dark:bg-slate-900">
          {/* Top Branding Section */}
          <div className="bg-primary dark:bg-slate-900 px-8 py-6 text-white flex items-center justify-between border-b border-white/5 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  {t("repairs.orderDetail")}
                </h2>
              </div>
              <DialogTitle className="text-2xl font-black">
                #
                {currentRepair.code ||
                  currentRepair.id.split("-")[0].toUpperCase()}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-end hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {t("repairs.created")}
                </p>
                <p className="text-sm font-bold">
                  {formatDate(currentRepair.createdAt)}
                </p>
              </div>
              <Badge
                className={cn(
                  "px-4 py-2 rounded-xl border-none shadow-lg text-xs font-black uppercase tracking-widest",
                  status.bg,
                  status.color
                )}
              >
                <status.icon className="h-3 w-3 mr-2" />
                {t(
                  `repairs.${currentRepair.status
                    .toLowerCase()
                    .replace(/\s+/g, "")}`
                ) || currentRepair.status}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fdfdfd] dark:bg-slate-950">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Main Content Area */}
              <div className="lg:col-span-8 p-8 space-y-8">
                {/* Information Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <User className="h-3 w-3 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                        {t("repairs.customerDevice")}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                        {currentRepair.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                          {currentRepair.customerName}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 opacity-60">
                          <SmartphoneNfc className="h-3 w-3" />{" "}
                          {currentRepair.customerPhone || t("repairs.noPhone")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Smartphone className="h-3 w-3 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                        {t("repairs.deviceDetails")}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                          {currentRepair.deviceBrand}{" "}
                          {currentRepair.deviceModel}
                        </p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                          {t("repairs.warrantyActive")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint / Diagnosis */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.diagnosisAndReport")}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute start-0 top-0 bottom-0 w-1 bg-orange-500/40" />
                    <p className="text-xs font-medium text-gray-700 leading-relaxed italic">
                      "{currentRepair.issueDescription}"
                    </p>
                  </div>
                </div>

                {/* Parts Breakdown Table */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <CreditCard className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {t("repairs.partsAndServices")}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="bg-muted/5 dark:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800">
                          <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {t("repairs.itemDescription")}
                          </th>
                          <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">
                            {t("repairs.qty")}
                          </th>
                          <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-end">
                            {t("repairs.unitPrice")}
                          </th>
                          <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-end">
                            {t("repairs.subtotal")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                        {currentRepair.usedParts &&
                        currentRepair.usedParts.length > 0 ? (
                          currentRepair.usedParts.map((part, idx) => {
                            // Handle different possible structures for the part data
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
                                  <td className="px-5 py-3 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-tight">
                                    {partName}
                                  </td>
                                  <td className="px-5 py-3 text-xs font-bold text-center text-gray-500">
                                    {quantity}
                                  </td>
                                  <td className="px-5 py-3 text-xs font-bold text-end text-gray-500">
                                    {currencySymbol}{cost.toFixed(2)}
                                  </td>
                                  <td className="px-5 py-3 text-xs font-black text-end text-foreground dark:text-slate-200">
                                    {currencySymbol}{(quantity * cost).toFixed(2)}
                                  </td>
                                </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-10 text-center text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em]"
                            >
                              {t("repairs.noParts")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/5 dark:bg-slate-800/50">
                          <td
                            colSpan={3}
                            className="px-5 py-3 text-[10px] font-black text-end uppercase tracking-widest text-muted-foreground dark:text-slate-400"
                          >
                            {t("repairs.subtotal")} ({t("repairs.parts")})
                          </td>
                          <td className="px-5 py-3 text-sm font-black text-end text-primary dark:text-blue-400">
                            {currencySymbol}
                            {(
                              currentRepair.usedParts?.reduce((sum, p) => {
                                const partAsAny = p as any;
                                const quantity =
                                  partAsAny.quantity || partAsAny.qty || 0;
                                const cost =
                                  partAsAny.cost ||
                                  partAsAny.unitCost ||
                                  partAsAny.price ||
                                  0;
                                return sum + quantity * cost;
                              }, 0) || 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Timeline / History */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
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
                  <div className="space-y-3 ps-4 border-s-2 border-gray-100 dark:border-slate-800 ms-1">
                    {currentRepairHistory && currentRepairHistory.length > 0 ? (
                      (() => {
                        const allHistory = [...currentRepairHistory].reverse();
                        const displayHistory = expandedHistory
                          ? allHistory
                          : allHistory.slice(0, 5); // Show only first 5 initially unless expanded
                        const hasMore = allHistory.length > 5;
                        const isExpanded = expandedHistory && hasMore;

                        return (
                          <>
                            {displayHistory.map((log, idx) => {
                              // The backend might return history in a different format than expected
                              // Check if log has the expected structure
                              const event = log.event;
                              let content = "";
                              let icon = <Clock className="h-3 w-3" />;

                              // Handle different possible structures for the event data
                              if (event && typeof event === "object") {
                                // Check if it's a properly structured event
                                if (event.type === "StatusChanged") {
                                  content = t("repairs.history.statusChanged", {
                                    to:
                                      t(
                                        `repairs.${event.to
                                          .toLowerCase()
                                          .replace(/\s+/g, "")}`
                                      ) || event.to,
                                  });
                                  icon = (
                                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                                  );
                                } else if (event.type === "PaymentAdded") {
                                  const eventAsAny = event as any;
                                  // Extract amount from details if amount field is not available in the event object
                                  const eventDetailsAmount =
                                    eventAsAny.details?.match(
                                      /\$([\d.]+)/
                                    )?.[1] || "0";
                                  const amount =
                                    eventAsAny.amount ||
                                    eventAsAny.total_amount ||
                                    eventAsAny.payment_amount ||
                                    parseFloat(eventDetailsAmount) ||
                                    0;
                                  content = t("repairs.history.paymentAdded", {
                                    symbol: currencySymbol,
                                    amount: amount.toFixed(2),
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
                                      event.text?.length > 30
                                        ? `${event.text.substring(0, 30)}...`
                                        : event.text,
                                  });
                                  icon = (
                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                  );
                                } else {
                                  // Handle case where event has a different structure
                                  content = `Event: ${JSON.stringify(event)}`;
                                  icon = (
                                    <Clock className="h-3 w-3 text-gray-500" />
                                  );
                                }
                              } else {
                                // Handle case where event is undefined or has unknown type
                                // Try to access fields that might exist in different formats
                                const logAsAny = log as any;
                                if (logAsAny.event_type && logAsAny.details) {
                                  // Handle legacy format where event_type and details are separate fields
                                  content = logAsAny.details;

                                  // Determine icon based on event type
                                  switch (logAsAny.event_type) {
                                    case "status_changed":
                                      icon = (
                                        <ShieldCheck className="h-3 w-3 text-blue-500" />
                                      );
                                      break;
                                    case "payment_added":
                                      // Extract amount from details if amount field is not available
                                      const detailsAmount =
                                        logAsAny.details?.match(
                                          /\$([\d.]+)/
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
                                          symbol: currencySymbol,
                                          amount: pAmount.toFixed(2),
                                        }
                                      );
                                      icon = (
                                        <CreditCard className="h-3 w-3 text-green-500" />
                                      );
                                      break;
                                    case "part_added":
                                      const lpname =
                                        logAsAny.partName || "Item";
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
                                          logAsAny.details?.length > 30
                                            ? `${logAsAny.details.substring(
                                                0,
                                                30
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

                              return (
                                <div key={idx} className="relative">
                                  <div className="absolute -start-[1.25rem] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary flex items-center justify-center">
                                    <div className="h-1 w-1 rounded-full bg-white" />
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <p className="text-[8px] font-black text-primary dark:text-blue-400 uppercase tracking-wider">
                                        {formatDate(
                                          log.timestamp ||
                                            (log as any).date ||
                                            (log as any).created_at
                                        )}
                                      </p>
                                      <div className="opacity-60">{icon}</div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate">
                                      {content}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            {hasMore && (
                              <div className="relative pt-2">
                                <div className="absolute -left-[1.25rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                                  <div className="h-1 w-1 rounded-full bg-gray-500" />
                                </div>
                                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                                  <button
                                    className="text-[10px] font-bold text-gray-500 text-center w-full hover:text-gray-700"
                                    onClick={() =>
                                      setExpandedHistory(!expandedHistory)
                                    }
                                  >
                                    {isExpanded
                                      ? t("common.showLessWithCount", {
                                          count: allHistory.length - 5,
                                        }) ||
                                        `Show less (${
                                          allHistory.length - 5
                                        } hidden)`
                                      : `+${allHistory.length - 5} ${
                                          t("common.moreEvents") ||
                                          "more events"
                                        }`}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <p className="text-xs font-bold text-muted-foreground py-4 uppercase tracking-[0.15em] opacity-40 text-center">
                        {t("repairs.noHistory")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Sidebar Area */}
              <div className="lg:col-span-4 border-s border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-8 flex flex-col">
                {/* Status Quick Control */}
                <div className="space-y-3">
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
                          "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5",
                          currentRepair.status === s
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                            : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-muted-foreground hover:border-primary/20 hover:text-primary dark:hover:text-blue-400"
                        )}
                      >
                        {currentRepair.status === s && (
                          <Check className="h-3 w-3" />
                        )}
                        {t(`repairs.${s.toLowerCase().replace(/\s+/g, "")}`) ||
                          s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Summary Premium UI */}
                <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("repairs.financialOverview")}
                  </p>
                  <div className="space-y-3">
                    <div className="p-5 rounded-3xl bg-primary/5 dark:bg-blue-900/10 border border-primary/10 dark:border-blue-900/20 flex flex-col items-center justify-center relative shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary dark:text-blue-400 mb-1">
                        {t("repairs.totalEstimated")}
                      </p>
                      <p className="text-4xl font-black text-primary dark:text-blue-500 tracking-tighter">
                        {currencySymbol}{currentRepair.estimatedCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/10 dark:border-green-900/20 flex flex-col">
                        <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
                          {t("repairs.paidAmount")}
                        </span>
                        <span className="text-lg font-black text-green-700 dark:text-green-300">
                          {currencySymbol}{totalPaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-900/10 border border-red-500/10 dark:border-red-900/20 flex flex-col">
                        <span className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                          {t("repairs.totalBalance")}
                        </span>
                        <span className="text-lg font-black text-red-700 dark:text-red-300">
                          {currencySymbol}{remainingBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Form Injection */}
                <div className="pt-4 border-t border-gray-50 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">
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

                {/* Unified Footer Actions */}
                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                  <Button
                    onClick={async () => {
                      setIsPrintingReceipt(true);
                      await printReceipt(currentRepair, {
                        includePayments: true,
                        includeParts: true,
                      });
                      setIsPrintingReceipt(false);
                    }}
                    disabled={isPrintingReceipt}
                    className="h-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 shadow-lg shadow-primary/20 font-black text-xs uppercase tracking-wider"
                  >
                    {isPrintingReceipt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    {t("repairs.printReceipt")}
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsPrintingSticker(true);
                      await printSticker(currentRepair);
                      setIsPrintingSticker(false);
                    }}
                    disabled={isPrintingSticker}
                    className="h-12 rounded-xl bg-slate-900 dark:bg-slate-950 border-none text-white hover:bg-slate-800 dark:hover:bg-slate-900 shadow-lg shadow-slate-200/20 font-black text-xs uppercase tracking-wider"
                  >
                    {isPrintingSticker ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {t("repairs.printSticker")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Layout for Printing */}
      <div className="hidden">
        <div id="receipt-print-template">
          <ReceiptTemplate
            repair={currentRepair}
            includePayments={true}
            includeParts={true}
          />
        </div>
        <div id="sticker-print-template">
          <StickerTemplate data={currentRepair} type="repair" />
        </div>
      </div>
    </>
  );
}
