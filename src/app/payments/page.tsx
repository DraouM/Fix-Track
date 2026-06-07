"use client";

import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { Wallet, Search, Filter, ArrowLeft, DollarSign, TrendingUp, AlertCircle, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";
import { UnifiedPayment } from "@/types/payment";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/SettingsContext";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, format } from "date-fns";

export default function PaymentsPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Default toToday
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // We fetch all and filter on frontend for speed/simplicity in this app context
      const data = await invoke<UnifiedPayment[]>("get_all_payments");
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error(t("common.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        p.source_number?.toLowerCase().includes(searchLower) ||
        p.party_name?.toLowerCase().includes(searchLower) ||
        p.method.toLowerCase().includes(searchLower) ||
        p.source_type.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Date range filter
      if (dateRange?.from) {
        const paymentDate = new Date(p.date);
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        
        return isWithinInterval(paymentDate, { start, end });
      }

      return true;
    });
  }, [payments, search, dateRange]);

  const totalAmount = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

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
      green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {title} {suffix && <span className="opacity-50 ml-1">({suffix})</span>}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-2xl font-black text-foreground truncate" title={String(value)}>{value}</div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70 mt-1">
              <div className={`h-1 w-1 rounded-full ${colorClasses[color].replace('text-', 'bg-')}`}></div>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t("payments.title")}
              </h1>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                    <span className="text-xs font-black">{filteredPayments.length}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                      {dateRange?.from && format(dateRange.from, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                        ? t("common.today") : t("common.total")}
                    </span>
                 </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Date Picker */}
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder={t('common.pickDates')}
              className="w-[240px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider"
              showPresets={true}
            />

            <Button onClick={fetchPayments} variant="outline" className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800">
              <Filter className="h-4 w-4 mr-2" />
              {t("common.filter")}
            </Button>
            
            {(dateRange || search) && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl h-11 w-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
                onClick={() => {
                    setSearch("");
                    setDateRange(undefined);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={DollarSign}
            title={t("common.total")}
            value={formatNumber(totalAmount, getLocaleForIntl(i18n.language))}
            suffix={settings.currency}
            subtitle={dateRange?.from ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to || dateRange.from, 'MMM dd')}` : t("payments.subtitle")}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title={t("common.average")}
            value={formatNumber(filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0, getLocaleForIntl(i18n.language))}
            suffix={settings.currency}
            subtitle={t("payments.source")}
            color="purple"
          />
          <StatCard
            icon={AlertCircle}
            title={t("common.count")}
            value={filteredPayments.length}
            subtitle={t("common.items")}
            color="blue"
          />
        </div>

        {/* Payments Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("payments.historyLogs") || "Payment Logs"}</h2>
            </div>
            
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.searchPlaceholder")}
                className="pl-9 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <PaymentTable 
              payments={filteredPayments} 
              loading={loading} 
              onUpdate={fetchPayments} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
