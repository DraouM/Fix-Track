"use client";

import { useState, useEffect } from "react";
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
import { X, Filter } from "lucide-react";
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
  searchPlaceholder = "Search customers, devices, descriptions...",
}: DataTableProps<TData, TValue>) {
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
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Bar */}
        <div className="flex-1 min-w-0">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 hidden sm:block">
              Filters:
            </span>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Pending">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Pending
                </div>
              </SelectItem>
              <SelectItem value="In Progress">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  In Progress
                </div>
              </SelectItem>
              <SelectItem value="Completed">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Completed
                </div>
              </SelectItem>
              <SelectItem value="Delivered">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Delivered
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Payments</SelectItem>
              <SelectItem value="Unpaid">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Unpaid
                </div>
              </SelectItem>
              <SelectItem value="Partially">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Partially
                </div>
              </SelectItem>
              <SelectItem value="Paid">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Paid
                </div>
              </SelectItem>
              <SelectItem value="Refunded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  Refunded
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Pick dates"
            className="w-[160px] h-10"
            showPresets={true}
          />

          {/* Page Size Selector */}
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-10 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(globalFilter ||
        statusFilter !== "All" ||
        paymentStatusFilter !== "All" ||
        dateRange?.from) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {globalFilter && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-xs"
            >
              Search: "
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
              Status: {statusFilter}
            </Badge>
          )}
          {paymentStatusFilter !== "All" && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 text-xs"
            >
              Payment: {paymentStatusFilter}
            </Badge>
          )}
          {dateRange?.from && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 text-xs"
            >
              Date: {format(dateRange.from!, "MMM dd")}
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
            Clear All
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getPreFilteredRowModel().rows.length} repair(s)
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
