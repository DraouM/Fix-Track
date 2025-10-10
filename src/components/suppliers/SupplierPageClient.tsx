"use client";
import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";

// Sample supplier data - replace with your database
const suppliersData = [
  {
    id: "1",
    name: "TechParts Supply Co.",
    contactPerson: "John Smith",
    email: "john@techparts.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Street, Silicon Valley, CA",
    status: "active",
    productsSupplied: 24,
    totalOrders: 156,
    avgDeliveryTime: 3,
    reliabilityScore: 98,
    outstandingBalance: 2400,
    lastOrderDate: "2025-10-01",
    paymentTerms: "Net 30",
  },
  {
    id: "2",
    name: "Mobile Parts Direct",
    contactPerson: "Sarah Johnson",
    email: "sarah@mobileparts.com",
    phone: "+1 (555) 234-5678",
    address: "456 Phone Ave, New York, NY",
    status: "active",
    productsSupplied: 18,
    totalOrders: 89,
    avgDeliveryTime: 5,
    reliabilityScore: 92,
    outstandingBalance: 0,
    lastOrderDate: "2025-09-28",
    paymentTerms: "Net 15",
  },
  {
    id: "3",
    name: "Global Electronics Hub",
    contactPerson: "Mike Chen",
    email: "mike@globalelectronics.com",
    phone: "+1 (555) 345-6789",
    address: "789 Circuit Blvd, Austin, TX",
    status: "active",
    productsSupplied: 32,
    totalOrders: 203,
    avgDeliveryTime: 4,
    reliabilityScore: 95,
    outstandingBalance: 5600,
    lastOrderDate: "2025-10-03",
    paymentTerms: "Net 45",
  },
  {
    id: "4",
    name: "Repair Components Inc.",
    contactPerson: "Emily Davis",
    email: "emily@repaircomponents.com",
    phone: "+1 (555) 456-7890",
    address: "321 Parts Lane, Chicago, IL",
    status: "inactive",
    productsSupplied: 12,
    totalOrders: 45,
    avgDeliveryTime: 7,
    reliabilityScore: 85,
    outstandingBalance: 1200,
    lastOrderDate: "2025-08-15",
    paymentTerms: "Net 30",
  },
  {
    id: "5",
    name: "Swift Supply Solutions",
    contactPerson: "David Park",
    email: "david@swiftsupply.com",
    phone: "+1 (555) 567-8901",
    address: "654 Quick St, Seattle, WA",
    status: "active",
    productsSupplied: 28,
    totalOrders: 178,
    avgDeliveryTime: 2,
    reliabilityScore: 99,
    outstandingBalance: 3200,
    lastOrderDate: "2025-10-04",
    paymentTerms: "Net 30",
  },
];

const SuppliersListPage = () => {
  const [suppliers, setSuppliers] = useState(suppliersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Calculate summary metrics
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalProducts = suppliers.reduce(
    (sum, s) => sum + s.productsSupplied,
    0
  );
  const totalOutstanding = suppliers.reduce(
    (sum, s) => sum + s.outstandingBalance,
    0
  );
  const avgReliability = (
    suppliers.reduce((sum, s) => sum + s.reliabilityScore, 0) / suppliers.length
  ).toFixed(1);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  const getReliabilityBadge = (score) => {
    if (score >= 95)
      return { color: "bg-green-100 text-green-700", label: "Excellent" };
    if (score >= 85)
      return { color: "bg-blue-100 text-blue-700", label: "Good" };
    if (score >= 75)
      return { color: "bg-orange-100 text-orange-700", label: "Fair" };
    return { color: "bg-red-100 text-red-700", label: "Poor" };
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      setSuppliers(suppliers.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">
              Manage your supplier relationships and orders
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            title="Active Suppliers"
            value={activeSuppliers}
            subtitle={`${suppliers.length} total suppliers`}
            color="blue"
          />
          <StatCard
            icon={Package}
            title="Products Supplied"
            value={totalProducts}
            subtitle="Across all suppliers"
            color="green"
          />
          <StatCard
            icon={DollarSign}
            title="Outstanding Balance"
            value={`$${totalOutstanding.toLocaleString()}`}
            subtitle="Total payables"
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            title="Avg Reliability"
            value={`${avgReliability}%`}
            subtitle="Overall performance"
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers by name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({suppliers.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active ({activeSuppliers})
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "inactive"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactive ({suppliers.length - activeSuppliers})
              </button>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => {
                  const reliabilityBadge = getReliabilityBadge(
                    supplier.reliabilityScore
                  );
                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" />
                              {supplier.contactPerson}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {supplier.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {supplier.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.productsSupplied} products
                          </div>
                          <div className="text-xs text-gray-500">
                            {supplier.totalOrders} total orders
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${reliabilityBadge.color}`}
                          >
                            {supplier.reliabilityScore}%{" "}
                            {reliabilityBadge.label}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {supplier.avgDeliveryTime} days avg
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div
                            className={`text-sm font-semibold ${
                              supplier.outstandingBalance > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            ${supplier.outstandingBalance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {supplier.paymentTerms}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {supplier.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowAddModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit supplier"
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete supplier"
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredSuppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No suppliers found
              </h3>
              <p className="text-gray-500 max-w-sm text-sm mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add First Supplier
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          {filteredSuppliers.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {filteredSuppliers.length} of {suppliers.length}{" "}
                  suppliers
                </span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSupplier(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                <p>Form component will be added here</p>
                <p className="text-sm mt-2">
                  This will include all supplier fields
                </p>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSupplier(null);
                  }}
                  className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersListPage;
