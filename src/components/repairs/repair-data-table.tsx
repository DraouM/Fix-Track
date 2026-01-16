"use client";

import { useState, useEffect } from "react";
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
import { X, Filter, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  globalFilter?: boolean;
}

export function RepairDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
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

    setColumnFilters(newColumnFilters);
  }, [statusFilter, paymentStatusFilter]);

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
        prev.filter((filter) => filter.id !== "createdAt")
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

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center px-6 py-4 border-b bg-white/50">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || t('common.filter')}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 rounded-xl h-11 border-gray-200 focus:ring-primary/20 bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 hidden sm:block">
              {t('common.filters')}
            </span>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 bg-white font-bold text-xs uppercase tracking-wider">
              <SelectValue placeholder={t('repairs.status')} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="All" className="font-bold text-xs uppercase tracking-wider">{t('common.all')} {t('repairs.status')}</SelectItem>
              <SelectItem value="Pending" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {t('repairs.pending')}
                </div>
              </SelectItem>
              <SelectItem value="In Progress" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {t('repairs.inprogress')}
                </div>
              </SelectItem>
              <SelectItem value="Completed" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('repairs.completed')}
                </div>
              </SelectItem>
              <SelectItem value="Delivered" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {t('repairs.delivered')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 bg-white font-bold text-xs uppercase tracking-wider">
              <SelectValue placeholder={t('transactions_module.payment')} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="All" className="font-bold text-xs uppercase tracking-wider">{t('common.all')} {t('transactions_module.payment')}</SelectItem>
              <SelectItem value="Unpaid" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {t('repairs.unpaid')}
                </div>
              </SelectItem>
              <SelectItem value="Partially" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {t('repairs.partially')}
                </div>
              </SelectItem>
              <SelectItem value="Paid" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('repairs.paid')}
                </div>
              </SelectItem>
              <SelectItem value="Refunded" className="font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  {t('repairs.refunded')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder={t('common.pickDates')}
            className="w-[180px] h-11 rounded-xl border-gray-200 bg-white"
            showPresets={true}
          />

          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-11 w-11 bg-white border-gray-200"
            onClick={() => {
                setGlobalFilter("");
                setStatusFilter("All");
                setPaymentStatusFilter("All");
                setDateRange(undefined);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(globalFilter ||
        statusFilter !== "All" ||
        paymentStatusFilter !== "All" ||
        dateRange?.from) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">{t('common.activeFilters')}:</span>
          {globalFilter && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-xs"
            >
              {t('common.search')}: "
              {globalFilter.length > 20
                ? globalFilter.substring(0, 20) + "..."
                : globalFilter}
              "
            </Badge>
          )}
          {statusFilter !== "All" && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 text-xs"
            >
              {t('repairs.status')}: {t('repairs.' + statusFilter.toLowerCase().replace(' ', ''))}
            </Badge>
          )}
          {paymentStatusFilter !== "All" && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 text-xs"
            >
              {t('transactions_module.payment')}: {t('repairs.' + paymentStatusFilter.toLowerCase().replace(' ', ''))}
            </Badge>
          )}
          {dateRange?.from && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 text-xs"
            >
              {t('common.date')}: {format(dateRange.from!, "MMM dd")}
              {dateRange.to && ` - ${format(dateRange.to, "MMM dd")}`}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGlobalFilter("");
              setStatusFilter("All");
              setPaymentStatusFilter("All");
              setDateRange(undefined);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-7"
          >
            <X className="mr-1 h-3 w-3" />
            {t('common.clearAll')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/10 border-b hover:bg-muted/10">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  className="hover:bg-muted/5 border-b transition-colors group cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/5 border-t">
        <div className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-[10px]">
          {t('common.showingCount', { 
            count: table.getRowModel().rows.length, 
            total: table.getPreFilteredRowModel().rows.length,
            label: t('repairs.title').toLowerCase()
          }) || `Showing ${table.getRowModel().rows.length} of ${table.getPreFilteredRowModel().rows.length} repair(s)`}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t('common.rowsPerPage')}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg border-gray-200 text-xs font-bold">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top" className="rounded-xl border-none shadow-xl">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs font-bold">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t('common.pageInfo', { 
              current: table.getState().pagination.pageIndex + 1, 
              total: table.getPageCount() 
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-gray-200"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-gray-200"
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
