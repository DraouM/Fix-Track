"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Users,
  UserCheck,
  Star,
  Columns2,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Technician } from "@/types/technician";

// Sentinel used by Radix Select (empty string values are not allowed)
const UNASSIGNED_SENTINEL = "__unassigned";
const MY_TECHNICIAN_KEY = "fixary.myTechnician";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  globalFilter?: boolean;
  technicians?: Technician[];
  onRowClick?: (row: TData) => void;
  onBulkAssign?: (
    repairIds: string[],
    technicianId: string | null,
  ) => Promise<void>;
}

export function RepairDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  technicians = [],
  onRowClick,
  onBulkAssign,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Additional filter states
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [technicianFilter, setTechnicianFilter] = useState<string>("All");
  const [myTechnicianId, setMyTechnicianId] = useState<string | null>(null);
  const [bulkTarget, setBulkTarget] = useState<string>(UNASSIGNED_SENTINEL);
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  // Load the remembered "my technician" id once
  useEffect(() => {
    try {
      setMyTechnicianId(localStorage.getItem(MY_TECHNICIAN_KEY));
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Trigger re-filter when status filters change
  useEffect(() => {
    // Set column filters for status
    const newColumnFilters = [];

    if (statusFilter !== "All") {
      newColumnFilters.push({ id: "status", value: statusFilter });
    }

    if (paymentStatusFilter !== "All") {
      newColumnFilters.push({
        id: "paymentStatus",
        value: paymentStatusFilter,
      });
    }

    if (technicianFilter !== "All") {
      newColumnFilters.push({ id: "technicianId", value: technicianFilter });
    }

    setColumnFilters(newColumnFilters);
  }, [statusFilter, paymentStatusFilter, technicianFilter]);

  // Add this effect to handle date filtering
  useEffect(() => {
    if (dateRange?.from || dateRange?.to) {
      setColumnFilters((prev) => [
        ...prev.filter((filter) => filter.id !== "createdAt"),
        {
          id: "createdAt",
          value: dateRange,
        },
      ]);
    } else {
      // Remove date filter when no date range is selected
      setColumnFilters((prev) =>
        prev.filter((filter) => filter.id !== "createdAt"),
      );
    }
  }, [dateRange]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value) => {
      const search = value.toLowerCase();
      const repair = row.original as any;

      // If no search term, show all (let column filters handle status filtering)
      if (!search) return true;

      // Search across multiple fields
      return (
        repair.code?.toLowerCase().includes(search) ||
        repair.customerName?.toLowerCase().includes(search) ||
        repair.customerPhone?.toLowerCase().includes(search) ||
        repair.deviceBrand?.toLowerCase().includes(search) ||
        repair.deviceModel?.toLowerCase().includes(search) ||
        repair.issueDescription?.toLowerCase().includes(search) ||
        repair.status?.toLowerCase().includes(search) ||
        repair.paymentStatus?.toLowerCase().includes(search)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  // Status counts for Tier 1 tabs
  const statusCounts = useMemo(() => {
    const counts = {
      All: data.length,
      Pending: 0,
      "In Progress": 0,
      Completed: 0,
      Delivered: 0,
      myRepairs: 0,
    };
    for (const item of data as any[]) {
      const s = item.status;
      if (s === "Pending") counts.Pending++;
      else if (s === "In Progress") counts["In Progress"]++;
      else if (s === "Completed") counts.Completed++;
      else if (s === "Delivered") counts.Delivered++;

      if (myTechnicianId && item.technicianId === myTechnicianId) {
        counts.myRepairs++;
      }
    }
    return counts;
  }, [data, myTechnicianId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (globalFilter) count++;
    if (statusFilter !== "All") count++;
    if (paymentStatusFilter !== "All") count++;
    if (technicianFilter !== "All") count++;
    if (dateRange?.from) count++;
    return count;
  }, [
    globalFilter,
    statusFilter,
    paymentStatusFilter,
    technicianFilter,
    dateRange,
  ]);

  const handleResetFilters = useCallback(() => {
    setGlobalFilter("");
    setStatusFilter("All");
    setPaymentStatusFilter("All");
    setTechnicianFilter("All");
    setDateRange(undefined);
  }, []);

  const statusTabs = useMemo(
    () => [
      { value: "All", label: t("common.all"), dot: null },
      { value: "Pending", label: t("repairs.pending"), dot: "bg-yellow-500" },
      {
        value: "In Progress",
        label: t("repairs.inprogress"),
        dot: "bg-orange-500",
      },
      {
        value: "Completed",
        label: t("repairs.completed"),
        dot: "bg-green-500",
      },
      {
        value: "Delivered",
        label: t("repairs.delivered"),
        dot: "bg-blue-500",
      },
    ],
    [t],
  );

  return (
    <div className="w-full space-y-4">
      {/* Tier 1: Status Pipeline Tabs & Workload Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm">
        {/* Status Pipeline Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count =
              statusCounts[tab.value as keyof typeof statusCounts] ?? 0;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/60",
                )}
              >
                {tab.dot && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      isActive ? "bg-white" : tab.dot,
                    )}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted dark:bg-slate-800 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* My Repairs Quick Toggle */}
        {myTechnicianId && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() =>
                setTechnicianFilter(
                  technicianFilter === myTechnicianId ? "All" : myTechnicianId,
                )
              }
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 border cursor-pointer select-none",
                technicianFilter === myTechnicianId
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20"
                  : "border-border/60 dark:border-slate-800 bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  technicianFilter === myTechnicianId
                    ? "fill-white text-white"
                    : "fill-amber-400 text-amber-500",
                )}
              />
              <span>{t("repairs.myRepairs")}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                  technicianFilter === myTechnicianId
                    ? "bg-white/20 text-white"
                    : "bg-muted dark:bg-slate-800 text-muted-foreground",
                )}
              >
                {statusCounts.myRepairs}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Tier 2: Search, Deep Filters & Utilities */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between px-6 py-3 border-b dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder || t("common.filter")}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 pr-9 rounded-xl h-10 border-gray-200 dark:border-slate-800 focus:ring-primary/20 bg-white dark:bg-slate-950 text-xs font-medium"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Tools Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
          {/* Technician Filter */}
          <div className="flex items-center gap-1">
            <Select
              value={technicianFilter}
              onValueChange={setTechnicianFilter}
            >
              <SelectTrigger
                className={cn(
                  "w-auto min-w-[150px] h-10 rounded-xl border font-bold text-xs uppercase tracking-wider px-3",
                  technicianFilter !== "All"
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("repairs.technician")} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                <SelectItem
                  value="All"
                  className="font-bold text-xs uppercase tracking-wider"
                >
                  {t("common.all")} {t("repairs.technician")}
                </SelectItem>
                <SelectItem
                  value="Unassigned"
                  className="font-bold text-xs uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    {t("repairs.unassigned")}
                  </div>
                </SelectItem>
                {technicians.map((tech) => (
                  <SelectItem
                    key={tech.id}
                    value={tech.id}
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            tech.active ? "bg-green-500" : "bg-gray-400",
                          )}
                        ></div>
                        {tech.name}
                      </div>
                      {myTechnicianId === tech.id && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favorite / Star My Tech button (cleanly attached to tech select) */}
            {technicianFilter !== "All" &&
              technicianFilter !== "Unassigned" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={
                    myTechnicianId === technicianFilter
                      ? t("repairs.myRepairs")
                      : t("repairs.setAsMine")
                  }
                  className={cn(
                    "h-10 w-10 rounded-xl border-gray-200 dark:border-slate-800",
                    myTechnicianId === technicianFilter &&
                      "border-amber-300 bg-amber-50 dark:bg-amber-950/20",
                  )}
                  onClick={() => {
                    const next =
                      myTechnicianId === technicianFilter
                        ? null
                        : technicianFilter;
                    try {
                      if (next) {
                        localStorage.setItem(MY_TECHNICIAN_KEY, next);
                      } else {
                        localStorage.removeItem(MY_TECHNICIAN_KEY);
                      }
                    } catch {
                      // ignore
                    }
                    setMyTechnicianId(next);
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      myTechnicianId === technicianFilter
                        ? "fill-amber-400 text-amber-500"
                        : "text-muted-foreground",
                    )}
                  />
                </Button>
              )}
          </div>

          {/* Payment Status Filter */}
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger
              className={cn(
                "w-auto min-w-[140px] h-10 rounded-xl border font-bold text-xs uppercase tracking-wider px-3",
                paymentStatusFilter !== "All"
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950",
              )}
            >
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={t("transactions_module.payment")} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem
                value="All"
                className="font-bold text-xs uppercase tracking-wider"
              >
                {t("common.all")} {t("transactions_module.payment")}
              </SelectItem>
              <SelectItem
                value="Unpaid"
                className="font-bold text-xs uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {t("repairs.unpaid")}
                </div>
              </SelectItem>
              <SelectItem
                value="Partially"
                className="font-bold text-xs uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {t("repairs.partially")}
                </div>
              </SelectItem>
              <SelectItem
                value="Paid"
                className="font-bold text-xs uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t("repairs.paid")}
                </div>
              </SelectItem>
              <SelectItem
                value="Refunded"
                className="font-bold text-xs uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  {t("repairs.refunded")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder={t("common.pickDates")}
            className="w-[170px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            showPresets={true}
          />

          <div className="h-6 w-px bg-border/60 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Clear Active Filters Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-3 rounded-xl border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold uppercase tracking-wider gap-1.5"
              title={t("common.clearAll")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("common.clear")}</span>
              <span className="h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            </Button>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title={t("common.columns")}
                aria-label={t("common.columns")}
                className="rounded-xl h-10 w-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
              >
                <Columns2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]"
            >
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onSelect={(e) => e.preventDefault()}
                    className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer me-2"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Secondary Filters Display */}
      {(globalFilter ||
        paymentStatusFilter !== "All" ||
        technicianFilter !== "All" ||
        dateRange?.from) && (
        <div className="flex flex-wrap gap-2 items-center px-6 pt-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("common.activeFilters")}:
          </span>
          {globalFilter && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs gap-1.5 pr-1.5"
            >
              <span>
                {t("common.search")}: "
                {globalFilter.length > 20
                  ? globalFilter.substring(0, 20) + "..."
                  : globalFilter}
                "
              </span>
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {paymentStatusFilter !== "All" && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs gap-1.5 pr-1.5"
            >
              <span>
                {t("transactions_module.payment")}:{" "}
                {t(
                  "repairs." +
                    paymentStatusFilter.toLowerCase().replace(" ", ""),
                )}
              </span>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("All")}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {technicianFilter !== "All" && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs gap-1.5 pr-1.5"
            >
              <span>
                {t("repairs.technician")}:{" "}
                {technicianFilter === "Unassigned"
                  ? t("repairs.unassigned")
                  : (technicians.find((tech) => tech.id === technicianFilter)
                      ?.name ?? technicianFilter)}
              </span>
              <button
                type="button"
                onClick={() => setTechnicianFilter("All")}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateRange?.from && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs gap-1.5 pr-1.5"
            >
              <span>
                {t("common.date")}: {format(dateRange.from!, "MMM dd")}
                {dateRange.to && ` - ${format(dateRange.to, "MMM dd")}`}
              </span>
              <button
                type="button"
                onClick={() => setDateRange(undefined)}
                className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Bulk Assignment Bar */}
      {onBulkAssign && selectedRows.length > 0 && (
        <div className="mx-6 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 dark:bg-blue-900/10 border border-primary/10 dark:border-blue-900/20">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
            <Users className="h-4 w-4" />
            {t("repairs.selectedCount", { count: selectedRows.length })}
          </span>
          <Select value={bulkTarget} onValueChange={setBulkTarget}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
              <SelectItem
                value={UNASSIGNED_SENTINEL}
                className="font-bold text-xs uppercase tracking-wider"
              >
                {t("repairs.unassigned")}
              </SelectItem>
              {technicians
                .filter((tech) => tech.active)
                .map((tech) => (
                  <SelectItem
                    key={tech.id}
                    value={tech.id}
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    {tech.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-wider"
            disabled={isBulkApplying}
            onClick={async () => {
              setIsBulkApplying(true);
              try {
                const ids = selectedRows.map((row) =>
                  String((row.original as any).id),
                );
                await onBulkAssign(
                  ids,
                  bulkTarget === UNASSIGNED_SENTINEL ? null : bulkTarget,
                );
                setRowSelection({});
              } catch (error) {
                console.error("Bulk assign failed:", error);
              } finally {
                setIsBulkApplying(false);
              }
            }}
          >
            {t("repairs.assign")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl text-xs font-bold uppercase tracking-wider"
            onClick={() => setRowSelection({})}
          >
            <X className="h-3.5 w-3.5 me-1" />
            {t("common.cancel")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/10 dark:bg-slate-800/50 border-b dark:border-slate-800 hover:bg-muted/10 dark:hover:bg-slate-800/50"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { className?: string }
                    | undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-3 first:pl-5 last:pr-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground",
                        meta?.className,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className="hover:bg-muted/5 dark:hover:bg-slate-800/30 border-b dark:border-slate-800 transition-colors group cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { className?: string }
                      | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 first:pl-5 last:pr-5",
                          meta?.className,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/5 dark:bg-slate-900/50 border-t dark:border-slate-800">
        <div className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-[10px]">
          {t("common.showingCount", {
            count: table.getRowModel().rows.length,
            total: table.getPreFilteredRowModel().rows.length,
            label: t("repairs.title").toLowerCase(),
          }) ||
            `Showing ${table.getRowModel().rows.length} of ${table.getPreFilteredRowModel().rows.length} repair(s)`}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("common.rowsPerPage")}
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg border-gray-200 dark:border-slate-800 text-xs font-bold dark:bg-slate-950">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent
                side="top"
                className="rounded-xl border-none shadow-xl dark:bg-slate-900"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs font-bold"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t("common.pageInfo", {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-gray-200 dark:border-slate-800 dark:bg-slate-950"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-gray-200 dark:border-slate-800 dark:bg-slate-950"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
