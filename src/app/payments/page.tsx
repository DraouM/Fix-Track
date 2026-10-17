"use client";

import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  Search,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Calendar as CalendarIcon,
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  Banknote,
  Smartphone,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UnifiedPayment } from "@/types/payment";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { ChargeFormDialog } from "@/components/payments/ChargeFormDialog";
import { MoneyTransferDialog } from "@/components/payments/MoneyTransferDialog";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/SettingsContext";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, format } from "date-fns";

const DEFAULT_ACCOUNTS = [
  "Cash Register",
  "Bank Account",
  "Safe / Vault",
  "Mobile Wallet",
];

function isPaymentInAccount(p: UnifiedPayment, accountName: string): boolean {
  if (accountName === "all") return true;

  if (p.source_type === "Transfer") {
    return p.source_number === accountName || p.party_name === accountName;
  }

  const methodLower = (p.method || "").toLowerCase();
  const accountLower = accountName.toLowerCase();

  if (methodLower === accountLower) return true;

  if (
    accountLower === "cash register" ||
    accountLower === "caisse" ||
    accountLower === "الصندوق"
  ) {
    return (
      methodLower === "cash" ||
      methodLower === "espèces" ||
      methodLower === "especes" ||
      methodLower === "نقد"
    );
  }

  if (
    accountLower === "bank account" ||
    accountLower === "compte bancaire" ||
    accountLower === "الحساب البنكي"
  ) {
    return (
      methodLower === "card" ||
      methodLower === "carte" ||
      methodLower === "transfer" ||
      methodLower === "virement" ||
      methodLower === "check" ||
      methodLower === "chèque" ||
      methodLower === "cheque" ||
      methodLower === "bank" ||
      methodLower === "banque"
    );
  }

  return false;
}

export default function PaymentsPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "payments" | "charges" | "transfers"
  >("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [chargeOpen, setChargeOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

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

  // Dynamically extract all unique accounts across default list and logged transfers
  const availableAccounts = useMemo(() => {
    const set = new Set<string>(DEFAULT_ACCOUNTS);
    for (const p of payments) {
      if (p.source_type === "Transfer") {
        if (p.source_number?.trim()) set.add(p.source_number.trim());
        if (p.party_name?.trim()) set.add(p.party_name.trim());
      }
    }
    return Array.from(set);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 0. Account filter
      if (
        selectedAccount !== "all" &&
        !isPaymentInAccount(p, selectedAccount)
      ) {
        return false;
      }

      // 1. Type filter
      const isCharge = p.source_type === "Charge";
      const isTransfer = p.source_type === "Transfer";
      if (typeFilter === "payments" && (isCharge || isTransfer)) return false;
      if (typeFilter === "charges" && !isCharge) return false;
      if (typeFilter === "transfers" && !isTransfer) return false;

      // 2. Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.source_number?.toLowerCase().includes(searchLower) ||
        p.party_name?.toLowerCase().includes(searchLower) ||
        p.method.toLowerCase().includes(searchLower) ||
        p.source_type.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 3. Date range filter
      if (dateRange?.from) {
        const paymentDate = new Date(p.date);
        const start = startOfDay(dateRange.from);
        const end = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from);

        return isWithinInterval(paymentDate, { start, end });
      }

      return true;
    });
  }, [payments, search, dateRange, typeFilter, selectedAccount]);

  const { moneyIn, chargesOut, net } = useMemo(() => {
    let income = 0;
    let charges = 0;
    for (const p of filteredPayments) {
      if (p.source_type === "Charge") {
        charges += p.amount;
      } else if (p.source_type === "Transfer") {
        if (selectedAccount !== "all") {
          if (p.source_number === selectedAccount) {
            charges += p.amount; // transfer out from this account
          } else if (p.party_name === selectedAccount) {
            income += p.amount; // transfer in to this account
          }
        }
      } else {
        income += p.amount;
      }
    }
    return { moneyIn: income, chargesOut: charges, net: income - charges };
  }, [filteredPayments, selectedAccount]);

  // Compute total of all previous logs prior to the selected date interval
  const previousSubtotal = useMemo(() => {
    if (!dateRange?.from) return 0;

    const startDate = startOfDay(dateRange.from);
    let total = 0;

    for (const p of payments) {
      const paymentDate = new Date(p.date);
      // Strictly before the selected start date
      if (paymentDate >= startDate) continue;

      if (
        selectedAccount !== "all" &&
        !isPaymentInAccount(p, selectedAccount)
      ) {
        continue;
      }

      if (p.source_type === "Charge") {
        total -= p.amount;
      } else if (p.source_type === "Transfer") {
        if (selectedAccount !== "all") {
          if (p.source_number === selectedAccount) {
            total -= p.amount;
          } else if (p.party_name === selectedAccount) {
            total += p.amount;
          }
        }
      } else {
        total += p.amount;
      }
    }

    return total;
  }, [payments, dateRange, selectedAccount]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Unified Command Header & Integrated Metrics */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-200/70 dark:border-slate-800 shadow-sm space-y-5">
          {/* Top Row: Title & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title & Live Count Pill */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {t("payments.title")}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-muted-foreground">
                  {filteredPayments.length}
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {dateRange?.from &&
                    format(dateRange.from, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd")
                      ? t("common.today")
                      : t("common.total")}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder={t("common.pickDates")}
                className="w-[200px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider"
                showPresets={true}
              />

              <Button
                onClick={() => setChargeOpen(true)}
                className="h-10 px-4 sm:px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/25 text-xs font-black uppercase tracking-wider gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>{t("payments.newCharge")}</span>
              </Button>

              <Button
                onClick={() => setTransferOpen(true)}
                className="h-10 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 text-xs font-black uppercase tracking-wider gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeftRight className="h-4 w-4 stroke-[2.5]" />
                <span>{t("payments.newTransfer", "New Transfer")}</span>
              </Button>
            </div>
          </div>

          {/* Bottom Row: Connected High-Density Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/80">
            {/* Metric 1: Money In */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80 truncate">
                  {selectedAccount !== "all"
                    ? `${t("payments.moneyIn")} · ${selectedAccount}`
                    : t("payments.moneyIn")}
                </span>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-lg font-black text-foreground truncate">
                    {formatNumber(moneyIn, getLocaleForIntl(i18n.language))}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700/60 dark:text-emerald-400/60 shrink-0">
                    {settings.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 2: Charges Out */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/70 dark:border-rose-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700/80 dark:text-rose-400/80 truncate">
                  {selectedAccount !== "all"
                    ? `${t("payments.chargesOut")} · ${selectedAccount}`
                    : t("payments.chargesOut")}
                </span>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-lg font-black text-foreground truncate">
                    {formatNumber(chargesOut, getLocaleForIntl(i18n.language))}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700/60 dark:text-rose-400/60 shrink-0">
                    {settings.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 3: Net / Account Balance */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700/80 dark:text-blue-400/80 truncate">
                  {selectedAccount !== "all"
                    ? t("payments.accountBalance", "Account Balance")
                    : t("payments.netTotal")}
                </span>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-lg font-black text-foreground truncate">
                    {formatNumber(net, getLocaleForIntl(i18n.language))}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700/60 dark:text-blue-400/60 shrink-0">
                    {settings.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 4: Transactions Count */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/70 dark:border-violet-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-700/80 dark:text-violet-400/80 truncate">
                  {t("common.count")}
                </span>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-lg font-black text-foreground truncate">
                    {filteredPayments.length}
                  </span>
                  <span className="text-[10px] font-bold text-violet-700/60 dark:text-violet-400/60 shrink-0 uppercase tracking-wider">
                    {selectedAccount !== "all"
                      ? selectedAccount
                      : t("common.items")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1.5 shrink-0">
              <Landmark className="h-3.5 w-3.5 text-primary" />
              {t("payments.account", "Account")}:
            </span>

            <button
              onClick={() => setSelectedAccount("all")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
                selectedAccount === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{t("payments.allAccounts", "All Accounts")}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  selectedAccount === "all"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                }`}
              >
                {payments.length}
              </span>
            </button>

            {availableAccounts.map((acc) => {
              const count = payments.filter((p) =>
                isPaymentInAccount(p, acc),
              ).length;
              const isSelected = selectedAccount === acc;
              return (
                <button
                  key={acc}
                  onClick={() => setSelectedAccount(acc)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{acc}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAccount !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0 self-start sm:self-auto border border-blue-100 dark:border-blue-900/50">
              <span>{selectedAccount}</span>
              <button
                onClick={() => setSelectedAccount("all")}
                className="hover:bg-blue-200/50 dark:hover:bg-blue-900/50 rounded p-0.5 transition"
                title={t("payments.allAccounts", "All Accounts")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                {t("payments.historyLogs") || "Payment Logs"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
                {(["all", "payments", "charges", "transfers"] as const).map(
                  (tf) => (
                    <button
                      key={tf}
                      onClick={() => setTypeFilter(tf)}
                      className={`px-3 h-7 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                        typeFilter === tf
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tf === "all"
                        ? t("payments.filterAll")
                        : tf === "payments"
                          ? t("payments.filterPayments")
                          : tf === "charges"
                            ? t("payments.filterCharges")
                            : t("payments.filterTransfers", "Transfers")}
                    </button>
                  ),
                )}
              </div>

              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.searchPlaceholder")}
                  className="pl-9 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <PaymentTable
              payments={filteredPayments}
              loading={loading}
              onUpdate={fetchPayments}
              selectedAccount={selectedAccount}
              previousSubtotal={previousSubtotal}
            />
          </div>
        </div>
      </div>

      <ChargeFormDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        onCreated={fetchPayments}
      />

      <MoneyTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onCreated={fetchPayments}
      />
    </div>
  );
}
