"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Download,
  Upload,
  Building2,
  Package,
  DollarSign,
  TrendingUp,
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import type { Supplier } from "@/types/supplier";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { SupplierForm } from "./SupplierForm";
import SupplierDetail from "./SupplierDetail";
import { SupplierPaymentModal } from "./SupplierPaymentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "blue",
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-2xl border transition-colors", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[10px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

const SupplierPageClient = () => {
  const router = useRouter();
  const { suppliers, loading, error } = useSupplierState();
  const { deleteSupplier, initialize } = useSupplierActions();

  const [filters, setFilters] = useState({
    searchTerm: "",
    active: "All" as boolean | "All",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "name" as keyof Supplier | "outstandingBalance" | "status",
    direction: "asc" as "asc" | "desc",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  const searchParams = useSearchParams();
  const supplierId = searchParams.get('id');

  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setSelectedSupplier(supplier);
        setShowDetailModal(true);
      }
    }
  }, [supplierId, suppliers]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter((supplier) => {
      const matchesSearch =
        !filters.searchTerm ||
        supplier.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        supplier.contactName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesActive =
        filters.active === "All" ||
        (filters.active === true && supplier.status === "active") ||
        (filters.active === false && supplier.status === "inactive");

      return matchesSearch && matchesActive;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === "outstandingBalance") {
        aValue = a.outstandingBalance || 0;
        bValue = b.outstandingBalance || 0;
      } else if (sortConfig.key === "status") {
        aValue = a.status;
        bValue = b.status;
      } else {
        aValue = a[sortConfig.key as keyof Supplier];
        bValue = b[sortConfig.key as keyof Supplier];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [suppliers, filters, sortConfig]);

  const metrics = useMemo(() => {
    const suppliersList = filteredAndSortedSuppliers;
    const activeCount = suppliersList.filter((s) => s.status === "active").length;
    const totalBalance = suppliersList.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
    const suppliersWithBalance = suppliersList.filter((s) => (s.outstandingBalance || 0) > 0).length;

    return {
      total: suppliersList.length,
      active: activeCount,
      inactive: suppliersList.length - activeCount,
      totalBalance,
      suppliersWithBalance,
    };
  }, [filteredAndSortedSuppliers]);

  const handleSort = (key: any) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error("Failed to delete supplier:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Synchronizing Supplier Database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Suppliers
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                Supply Chain & Procurement Management
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <Button variant="outline" className="h-11 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm">
              <Download className="w-4 h-4 mr-2 opacity-40" />
              Export
            </Button>
            <Button
              onClick={() => {
                setSelectedSupplier(null);
                setShowAddModal(true);
              }}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            title="Registry Size"
            value={metrics.total}
            subtitle={`${metrics.active} active entities`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="Active Partnerships"
            value={metrics.active}
            subtitle="Engaged supply lines"
            color="green"
          />
          <StatCard
            icon={DollarSign}
            title="Aggregate Credit"
            value={formatCurrency(metrics.totalBalance)}
            subtitle={`${metrics.suppliersWithBalance} outstanding accounts`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            title="Inactive Accounts"
            value={metrics.inactive}
            subtitle="Archived relationships"
            color="purple"
          />
        </div>

        {/* Filters Bar */}
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 relative w-full">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">Search Entity</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter suppliers..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full h-11 pl-10 pr-4 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary/20 transition-all text-sm font-bold placeholder:font-medium"
                />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">Partnership Status</span>
              <Select 
                value={filters.active === "All" ? "all" : filters.active ? "active" : "inactive"} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, active: v === "all" ? "All" : v === "active" }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold text-xs uppercase py-2.5">All Accounts</SelectItem>
                  <SelectItem value="active" className="font-bold text-xs uppercase py-2.5">Active Only</SelectItem>
                  <SelectItem value="inactive" className="font-bold text-xs uppercase py-2.5">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filters.searchTerm !== "" || filters.active !== "All") && (
              <Button 
                variant="ghost" 
                onClick={() => setFilters({ searchTerm: "", active: "All" })}
                className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full relative">
              <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-14 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2">
                       Supplier Entity
                       {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Technical & Comms</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("outstandingBalance")}>
                    <div className="flex items-center gap-2">
                      Credit Balance
                      {sortConfig.key === "outstandingBalance" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAndSortedSuppliers.length > 0 ? (
                  filteredAndSortedSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="group hover:bg-muted/30 transition-all duration-200 cursor-default"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col cursor-pointer hover:translate-x-1 transition-transform">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {supplier.name}
                            </span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </div>
                          {supplier.contactName && (
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                              {supplier.contactName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          {supplier.phone && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-gray-50 border border-gray-100 shrink-0">
                                <Phone className="w-2.5 h-2.5 text-muted-foreground/60" />
                              </div>
                              <span className="text-[11px] font-bold tracking-tight text-foreground/80">{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-gray-50 border border-gray-100 shrink-0">
                                <Mail className="w-2.5 h-2.5 text-muted-foreground/60" />
                              </div>
                              <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-start">
                          <div className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm border",
                            (supplier.outstandingBalance || 0) > 0 
                              ? "bg-orange-50 text-orange-600 border-orange-100" 
                              : "bg-green-50 text-green-600 border-green-100"
                          )}>
                            {formatCurrency(supplier.outstandingBalance || 0)}
                          </div>
                          <span className="text-[9px] uppercase text-muted-foreground/40 font-black tracking-widest mt-1.5">
                            Outstanding
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-none border",
                              supplier.status === "active" 
                                ? "bg-green-50 text-green-600 border-green-100" 
                                : "bg-gray-50 text-gray-500 border-gray-100"
                            )}
                          >
                            {supplier.status === "active" ? "Operational" : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 rounded-lg border-2 font-black text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentSupplier(supplier);
                              setShowPaymentModal(true);
                            }}
                          >
                            Pay
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-none shadow-2xl p-2">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-3 py-2">Entity Control</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentSupplier(supplier);
                                  setShowPaymentModal(true);
                                }}
                                className="rounded-xl font-bold text-xs py-2.5 cursor-pointer focus:bg-green-50 focus:text-green-600"
                              >
                                <DollarSign className="mr-2 h-4 w-4 opacity-70" /> Record Settlement
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-50 my-1" />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSupplier(supplier);
                                  setShowAddModal(true);
                                }}
                                className="rounded-xl font-bold text-xs py-2.5 cursor-pointer"
                              >
                                <Pencil className="mr-2 h-4 w-4 opacity-70" /> Edit Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(supplier.id);
                                }}
                                className="rounded-xl font-bold text-xs py-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash className="mr-2 h-4 w-4 opacity-70" /> Terminate Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-muted-foreground/10" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">No entries matched.</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-black">
              {selectedSupplier ? "Edit Operational Entity" : "Register New Supplier"}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Maintain accurate records for procurement and financial settlement.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <SupplierForm
              supplier={selectedSupplier || undefined}
              onSuccess={() => {
                setShowAddModal(false);
                initialize();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="h-full overflow-auto">
            {selectedSupplier && <SupplierDetail supplierId={selectedSupplier.id} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Modal */}
      {showPaymentModal && paymentSupplier && (
        <SupplierPaymentModal
          supplierId={paymentSupplier.id}
          supplierName={paymentSupplier.name}
          currentBalance={paymentSupplier.outstandingBalance || 0}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentSupplier(null);
            initialize();
          }}
        />
      )}
    </div>
  );
};
export default SupplierPageClient;
