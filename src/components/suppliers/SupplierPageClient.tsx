"use client";
import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import type { Supplier, PaymentMethod } from "@/types/supplier";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { SupplierForm } from "./SupplierForm";

const SupplierPageClient = () => {
  // Use actual supplier context instead of mock data
  const { suppliers, loading, error } = useSupplierState();
  const { deleteSupplier, initialize } = useSupplierActions();

  // Filter and sort state
  const [filters, setFilters] = useState({
    searchTerm: "",
    active: "All" as boolean | "All",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "name" as keyof Supplier | "outstandingBalance" | "status",
    direction: "asc" as "asc" | "desc",
  });

  // Local UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter((supplier) => {
      const matchesSearch =
        !filters.searchTerm ||
        supplier.name
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.contactName
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.email
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.phone
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const matchesActive =
        filters.active === "All" ||
        (filters.active === true && supplier.status === "active") ||
        (filters.active === false && supplier.status === "inactive");

      return matchesSearch && matchesActive;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle special cases for sorting
      if (sortConfig.key === "outstandingBalance") {
        aValue = a.outstandingBalance || 0;
        bValue = b.outstandingBalance || 0;
      } else if (sortConfig.key === "status") {
        aValue = a.status;
        bValue = b.status;
      } else {
        // Handle regular properties
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

  // Calculate summary metrics from actual data
  const metrics = useMemo(() => {
    const suppliersList = filteredAndSortedSuppliers;
    const activeCount = suppliersList.filter(
      (s) => s.status === "active"
    ).length;
    const totalBalance = suppliersList.reduce(
      (sum, s) => sum + (s.outstandingBalance || 0),
      0
    );
    const suppliersWithBalance = suppliersList.filter(
      (s) => (s.outstandingBalance || 0) > 0
    ).length;

    return {
      total: suppliersList.length,
      active: activeCount,
      inactive: suppliersList.length - activeCount,
      totalBalance,
      suppliersWithBalance,
    };
  }, [filteredAndSortedSuppliers]);

  // Handle search term change
  const setSearchTerm = (term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  // Handle active filter change
  const setActiveFilter = (active: boolean | "All") => {
    setFilters((prev) => ({ ...prev, active }));
  };

  // Reset filters to show all suppliers
  const showAllSuppliers = () => {
    setFilters({
      searchTerm: "",
      active: "All",
    });
    setSortConfig({
      key: "name",
      direction: "asc",
    });
  };

  // Handle sort
  const handleSort = (key: any) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle delete with confirmation
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        alert("Failed to delete supplier. Please try again.");
      }
    }
  };

  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowAddModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedSupplier(null);
  };

  // Handle add new supplier
  const handleAddNew = () => {
    setSelectedSupplier(null);
    setShowAddModal(true);
  };

  // Initialize suppliers data on component mount
  // useEffect(() => {
  //   initialize();
  // }, [initialize]);

  // Stat Card Component
  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600 truncate">
            {title}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-gray-900 truncate">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Suppliers
            </h3>
            <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              Suppliers
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Manage your supplier relationships and credit balances
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            title="Active Suppliers"
            value={metrics.active}
            subtitle={`${metrics.total} total suppliers`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="With Balance"
            value={metrics.suppliersWithBalance}
            subtitle="Suppliers with credit"
            color="green"
          />
          <StatCard
            icon={DollarSign}
            title="Total Credit Balance"
            value={formatCurrency(metrics.totalBalance)}
            subtitle="Total outstanding"
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            title="Inactive Suppliers"
            value={metrics.inactive}
            subtitle="Not currently active"
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Active Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={showAllSuppliers}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.active === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                onClick={() => setActiveFilter(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.active === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active ({metrics.active})
              </button>
              <button
                onClick={() => setActiveFilter(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.active === false
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactive ({metrics.inactive})
              </button>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Supplier
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("outstandingBalance")}
                  >
                    <div className="flex items-center">
                      Credit Balance
                      {sortConfig.key === "outstandingBalance" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Last Updated
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {supplier.name}
                          </div>
                          {supplier.contactName && (
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {supplier.contactName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 min-w-0">
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.address && (
                          <div
                            className="text-sm text-gray-500 flex items-start gap-2 mt-1 truncate"
                            title={supplier.address}
                          >
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className={`text-sm font-semibold truncate ${
                          (supplier.outstandingBalance || 0) > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(supplier.outstandingBalance || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {supplier.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden md:inline">Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <XCircle className="w-3 h-3" />
                          <span className="hidden md:inline">Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {supplier.updatedAt
                            ? formatDate(supplier.updatedAt)
                            : "invalid date"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit supplier"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete supplier"
                          disabled={loading}
                        >
                          <Trash className="w-4 h-4 text-red-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedSuppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No suppliers found
              </h3>
              <p className="text-gray-500 max-w-xs text-sm mb-4">
                {filters.searchTerm || filters.active !== "All"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first supplier"}
              </p>
              {filters.searchTerm || filters.active !== "All" ? (
                <button
                  onClick={showAllSuppliers}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Show All Suppliers
                </button>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add First Supplier
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          {filteredAndSortedSuppliers.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
                <span className="truncate">
                  Showing {filteredAndSortedSuppliers.length} supplier(s)
                </span>
                <span className="truncate">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal Placeholder - Replaced with actual SupplierForm */}
        {showAddModal && (
          <SupplierForm
            supplier={selectedSupplier || undefined}
            onSuccess={() => {
              handleCloseModal();
              // Refresh the supplier list
              initialize();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SupplierPageClient;
