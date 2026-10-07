"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCcw,
  Download,
  UserPlus,
  CreditCard,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClientContext } from "@/context/ClientContext";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm";
import { ClientPaymentModal } from "./ClientPaymentModal";
import { LedgerDrawer } from "./LedgerDrawer";
import { getTransactions } from "@/lib/api/transactions";
import { Transaction } from "@/types/transaction";
import { openLedgerWindow } from "@/lib/openWindow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { formatCurrency } from "@/lib/clientUtils";

export default function ClientPageClient() {
  const { t } = useTranslation();
  const { clients, loading, fetchClients, getClientHistory } =
    useClientContext();
  const {
    filteredAndSortedClients,
    searchTerm,
    setSearchTerm,
    setActiveFilter,
    activeFilter,
    balanceFilter,
    setBalanceFilter,
    sortConfig,
    handleSort,
    clearFilters,
  } = useClientFilters(clients);

  // Pagination (client-side, like the repairs table)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalFiltered = filteredAndSortedClients.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedClients = filteredAndSortedClients.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  // Back to page 1 whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeFilter, balanceFilter]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ── Ledger peek drawer (fast in-context glance without leaving the list) ──
  const [ledgerPeekId, setLedgerPeekId] = useState<string | null>(null);
  const [peekTransactions, setPeekTransactions] = useState<Transaction[]>([]);
  const [peekLoading, setPeekLoading] = useState(false);
  const peekClient = clients.find((c) => c.id === ledgerPeekId) || null;

  const loadPeek = useCallback(
    async (clientId: string) => {
      setPeekLoading(true);
      try {
        const [tx] = await Promise.all([
          getTransactions("Sale", null, clientId),
          getClientHistory(clientId),
        ]);
        setPeekTransactions(tx);
      } catch (err) {
        console.error("Failed to load ledger peek data:", err);
      } finally {
        setPeekLoading(false);
      }
    },
    [getClientHistory],
  );

  const openPeek = (id: string) => {
    setLedgerPeekId(id);
    loadPeek(id);
  };

  const closePeek = () => {
    setLedgerPeekId(null);
    setPeekTransactions([]);
  };

  const totalOutstanding = clients.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0,
  );
  const activeClients = clients.filter((c) => c.status === "active").length;

  const StatCard = ({
    icon: Icon,
    value,
    valueClass,
    color = "blue",
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    value: string | number;
    valueClass?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
    title?: string;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green:
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      orange:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      purple:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      gray: "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500",
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span
            className={`text-2xl font-black tracking-tight text-foreground ${valueClass ?? ""}`}
          >
            {value}
          </span>
        </div>
        {title && (
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {title}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Clients
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                Customer Base & Credit Management
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fetchClients()}
              disabled={loading}
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <RefreshCcw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden p-0 dark:bg-slate-900">
                <DialogHeader className="p-6 pb-4 border-b dark:border-slate-800">
                  <DialogTitle className="text-xl font-black">
                    Add New Client
                  </DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    Enter the details for the new client record.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <ClientForm
                    onSuccess={() => setIsAddModalOpen(false)}
                    onCancel={() => setIsAddModalOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden p-0 dark:bg-slate-900">
                <DialogHeader className="p-6 pb-4 border-b dark:border-slate-800">
                  <DialogTitle className="text-xl font-black">
                    Edit Client
                  </DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    Update the client's information.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {selectedClientId && (
                    <ClientForm
                      clientId={selectedClientId}
                      onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedClientId(null);
                      }}
                      onCancel={() => {
                        setIsEditModalOpen(false);
                        setSelectedClientId(null);
                      }}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards (icon + value + title) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Clients"
            value={clients.length}
            color="blue"
          />
          <StatCard
            icon={CreditCard}
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            color="orange"
            valueClass={
              totalOutstanding > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
          />
          <StatCard
            icon={TrendingUp}
            title="Avg. Balance"
            value={
              clients.length > 0
                ? formatCurrency(totalOutstanding / clients.length)
                : formatCurrency(0)
            }
            color="red"
          />
          <StatCard
            icon={CheckCircle2}
            title="Active"
            value={activeClients}
            color="green"
            valueClass="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Table with integrated search & filters (repairs-style layout) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center px-6 py-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl h-11 border-gray-200 dark:border-slate-800 focus:ring-primary/20 bg-white dark:bg-slate-950"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                <span className="text-sm text-gray-600 dark:text-slate-400 hidden sm:block">
                  {t("common.filters")}
                </span>
              </div>

              {/* Status Filter */}
              <Select
                value={
                  activeFilter === "All"
                    ? "all"
                    : activeFilter
                      ? "active"
                      : "inactive"
                }
                onValueChange={(v) =>
                  setActiveFilter(v === "all" ? "All" : v === "active")
                }
              >
                <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    {t("common.all")} {t("common.status")}
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Balance Filter */}
              <Select
                value={balanceFilter}
                onValueChange={(v) =>
                  setBalanceFilter(v as "All" | "debt" | "settled")
                }
              >
                <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder="Balance" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                  <SelectItem
                    value="All"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    All Balances
                  </SelectItem>
                  <SelectItem
                    value="debt"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      With Debt
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="settled"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Settled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-11 w-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm ||
            activeFilter !== "All" ||
            balanceFilter !== "All") && (
            <div className="flex flex-wrap gap-2 items-center px-6 py-3 border-b dark:border-slate-800">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {t("common.activeFilters")}:
              </span>
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 text-xs"
                >
                  {t("common.search")}: "
                  {searchTerm.length > 20
                    ? searchTerm.substring(0, 20) + "..."
                    : searchTerm}
                  "
                </Badge>
              )}
              {activeFilter !== "All" && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-xs"
                >
                  {t("common.status")}: {activeFilter ? "Active" : "Inactive"}
                </Badge>
              )}
              {balanceFilter !== "All" && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 text-xs"
                >
                  Balance: {balanceFilter === "debt" ? "With Debt" : "Settled"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50 h-7"
              >
                <X className="mr-1 h-3 w-3" />
                {t("common.clearAll")}
              </Button>
            </div>
          )}

          {/* Clients Table */}
          <ClientTable
            clients={pagedClients}
            loading={loading}
            onRecordPayment={(id) => {
              setSelectedClientId(id);
              setIsPaymentModalOpen(true);
            }}
            onEditClient={(id) => {
              setSelectedClientId(id);
              setIsEditModalOpen(true);
            }}
            onPeekLedger={openPeek}
            onSort={handleSort}
            sortConfig={sortConfig}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted/5 dark:bg-slate-900/50 border-t dark:border-slate-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("common.showingCount", {
                count: pagedClients.length,
                total: totalFiltered,
              }) ||
                `Showing ${pagedClients.length} of ${totalFiltered} client(s)`}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("common.rowsPerPage")}
                </p>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-lg border-gray-200 dark:border-slate-800 text-xs font-bold dark:bg-slate-950">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent
                    side="top"
                    className="rounded-xl border-none shadow-xl dark:bg-slate-900"
                  >
                    {[10, 20, 30, 40, 50].map((size) => (
                      <SelectItem
                        key={size}
                        value={`${size}`}
                        className="text-xs font-bold"
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {t("common.pageInfo", { current: safePage, total: pageCount })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-gray-200 dark:border-slate-800 dark:bg-slate-950"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-gray-200 dark:border-slate-800 dark:bg-slate-950"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage >= pageCount}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ClientPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            // Refresh the peek drawer so the settlement reflects immediately.
            if (ledgerPeekId) loadPeek(ledgerPeekId);
          }}
          clientId={selectedClientId}
        />

        <LedgerDrawer
          isOpen={!!ledgerPeekId}
          onClose={closePeek}
          clientId={ledgerPeekId || ""}
          clientName={peekClient?.name || ""}
          clientStatus={peekClient?.status}
          transactions={peekTransactions}
          history={peekClient?.history || []}
          isLoading={peekLoading}
          onRefresh={() => ledgerPeekId && loadPeek(ledgerPeekId)}
          onOpenPayment={() => {
            if (ledgerPeekId) {
              setSelectedClientId(ledgerPeekId);
              setIsPaymentModalOpen(true);
            }
          }}
          onOpenWindow={() => {
            if (ledgerPeekId) openLedgerWindow(ledgerPeekId);
          }}
        />
      </div>
    </div>
  );
}
