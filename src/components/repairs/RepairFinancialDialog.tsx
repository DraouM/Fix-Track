"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DateRangePicker,
  useDateRange,
} from "@/components/ui/date-range-picker";
import { DollarSign, TrendingUp, AlertCircle, CalendarX } from "lucide-react";
import { isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";
import { formatDate } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";
import { useRepairContext } from "@/context/RepairContext";

interface RepairFinancialDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "blue",
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
  suffix?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {title}{" "}
            {suffix && <span className="opacity-50 ml-1">({suffix})</span>}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <div
          className="text-2xl font-black text-foreground truncate"
          title={String(value)}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70 mt-1">
            <div
              className={`h-1 w-1 rounded-full ${colorClasses[color].replace("text-", "bg-")}`}
            ></div>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export function RepairFinancialDialog({
  open,
  onOpenChange,
}: RepairFinancialDialogProps) {
  const { t, i18n } = useTranslation();
  const { repairs } = useRepairContext();
  const { dateRange, setDateRange, clearDateRange, hasDateRange } =
    useDateRange();

  // Plain numbers for now — no currency symbol rendered in this dialog
  const formatAmount = (value: number) =>
    formatNumber(value, getLocaleForIntl(i18n.language));

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(
        getLocaleForIntl(i18n.language),
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    } catch {
      return "";
    }
  };

  const isInRange = useMemo(() => {
    return (dateStr?: string | null) => {
      if (!dateRange?.from || !dateStr) return true;
      try {
        const date = parseISO(dateStr);
        const start = startOfDay(dateRange.from);
        const end = dateRange?.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    };
  }, [dateRange]);

  const stats = useMemo(() => {
    // Revenue & payments are scoped by payment date; repair-scoped
    // figures (profit, outstanding) are scoped by intake (creation) date.
    const scopedRepairs = repairs.filter((r) => isInRange(r.createdAt));

    const scopedPayments = repairs
      .flatMap((r) =>
        (r.payments || []).map((p) => ({
          ...p,
          customerName: r.customerName,
          code: r.code,
        })),
      )
      .filter((p) => isInRange(p.date))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const completed = scopedRepairs.filter(
      (r) => r.status === "Completed" || r.status === "Delivered",
    );

    const totalRevenue = scopedPayments.reduce((sum, p) => sum + p.amount, 0);
    const repairProfit = completed.reduce(
      (sum, r) => sum + (r.estimatedCost || 0),
      0,
    );
    const outstanding = scopedRepairs.reduce(
      (sum, r) => sum + (r.remainingBalance || 0),
      0,
    );
    const unpaidCount = scopedRepairs.filter(
      (r) => r.paymentStatus === "Unpaid",
    ).length;

    return {
      totalRevenue,
      repairProfit,
      outstanding,
      unpaidCount,
      completedCount: completed.length,
      payments: scopedPayments,
    };
  }, [repairs, isInRange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
        <DialogHeader className="pb-4 border-b dark:border-slate-800">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            {t("repairs.financialOverview")}
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            {t("repairs.financialOverviewDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2 space-y-6">
          {/* Two-column layout: payment history + date filter (left) / key metrics (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Payment Breakdown */}
            <div className="space-y-3 lg:col-span-2">
              {/* Date Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder={t("common.filterByDate") || "Filter by date"}
                  className="w-full md:w-[260px] rounded-xl h-10 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                />
                {hasDateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="h-10 text-xs font-black uppercase tracking-wider text-muted-foreground"
                  >
                    <CalendarX className="w-4 h-4 mr-1.5" />
                    {t("repairs.showAllTime")}
                  </Button>
                )}
              </div>
              <div className="border rounded-2xl dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                {stats.payments.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p
                      className={cn(
                        "text-xs font-bold uppercase tracking-widest text-muted-foreground/60",
                      )}
                    >
                      {t("repairs.noPaymentsInRange")}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto divide-y dark:divide-slate-800">
                    {stats.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-foreground dark:text-slate-200 truncate">
                            {p.customerName}
                            {p.code && (
                              <span className="ml-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                                {p.code}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground dark:text-slate-500">
                            {formatDate(p.date)} • {formatTime(p.date)} •{" "}
                            {p.method}
                          </span>
                        </div>
                        <span className="text-sm font-black text-green-600 dark:text-green-400">
                          {formatAmount(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:col-span-1">
              <StatCard
                icon={DollarSign}
                title={t("repairs.totalRevenue")}
                value={formatAmount(stats.totalRevenue)}
                subtitle={
                  t("common.completedCount", {
                    count: stats.completedCount,
                    plural: stats.completedCount !== 1 ? "s" : "",
                  }) || `${stats.completedCount} completed`
                }
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                title={t("dashboard.metrics.repairProfit")}
                value={formatAmount(stats.repairProfit)}
                subtitle={t("dashboard.metrics.afterParts")}
                color="purple"
              />
              <StatCard
                icon={AlertCircle}
                title={t("repairs.outstanding")}
                value={formatAmount(stats.outstanding)}
                subtitle={
                  t("repairs.unpaidCount", {
                    count: stats.unpaidCount,
                    plural: stats.unpaidCount !== 1 ? "s" : "",
                  }) || `${stats.unpaidCount} unpaid`
                }
                color="red"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
