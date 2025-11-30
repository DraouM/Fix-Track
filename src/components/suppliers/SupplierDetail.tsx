"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import type { Supplier, SupplierHistoryEvent } from "@/types/supplier";
import { SupplierForm } from "./SupplierForm";

// Mock payment history data
const MOCK_PAYMENT_HISTORY: SupplierHistoryEvent[] = [
  {
    id: "pay_001",
    supplierId: "sup_001",
    date: "2025-10-15T10:30:00Z",
    type: "Payment Made",
    notes: "Bank transfer payment for October invoice",
    amount: 2500.0,
    relatedId: "inv_001",
  },
  {
    id: "pay_002",
    supplierId: "sup_001",
    date: "2025-09-20T14:15:00Z",
    type: "Payment Made",
    notes: "Check payment for September delivery",
    amount: 1850.75,
    relatedId: "inv_002",
  },
  {
    id: "pay_003",
    supplierId: "sup_001",
    date: "2025-08-05T09:45:00Z",
    type: "Payment Made",
    notes: "Cash payment for urgent order",
    amount: 750.5,
    relatedId: "inv_003",
  },
  {
    id: "pay_004",
    supplierId: "sup_001",
    date: "2025-07-12T16:20:00Z",
    type: "Payment Made",
    notes: "Credit card payment",
    amount: 3200.0,
    relatedId: "inv_004",
  },
  {
    id: "pay_005",
    supplierId: "sup_001",
    date: "2025-06-18T11:30:00Z",
    type: "Payment Made",
    notes: "Bank transfer payment",
    amount: 1950.25,
    relatedId: "inv_005",
  },
  {
    id: "po_001",
    supplierId: "sup_001",
    date: "2025-10-20T09:15:00Z",
    type: "Purchase Order Created",
    notes: "New order for iPhone screens",
    amount: 4200.0,
    relatedId: "po_001",
  },
  {
    id: "adj_001",
    supplierId: "sup_001",
    date: "2025-05-10T13:45:00Z",
    type: "Credit Balance Adjusted",
    notes: "Manual adjustment for returned items",
    amount: -150.0,
    relatedId: "ret_001",
  },
];

// Mock supplier data
const MOCK_SUPPLIER: Supplier = {
  id: "sup_001",
  name: "TechParts Supply Co.",
  contactName: "John Smith",
  email: "john.smith@techparts.com",
  phone: "+1 (555) 123-4567",
  address: "123 Tech Street, Silicon Valley, CA 94000",
  notes:
    "Reliable supplier for mobile phone parts. Preferred vendor for Samsung and Apple components.",
  preferredPaymentMethod: "Bank Transfer",
  status: "active",
  createdAt: "2024-01-15T08:00:00Z",
  updatedAt: "2025-10-20T14:30:00Z",
  outstandingBalance: 1250.75,
  history: MOCK_PAYMENT_HISTORY,
};

interface SupplierDetailProps {
  supplierId: string;
}

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const [supplier] = useState<Supplier>(MOCK_SUPPLIER);
  const [paymentHistory] =
    useState<SupplierHistoryEvent[]>(MOCK_PAYMENT_HISTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter payment history based on search and filters
  const filteredPaymentHistory = paymentHistory.filter((event) => {
    const matchesSearch =
      !searchTerm ||
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.relatedId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      (event.type === "Payment Made" && paymentMethodFilter === "payment") ||
      (event.type === "Purchase Order Created" &&
        paymentMethodFilter === "purchase") ||
      (event.type === "Credit Balance Adjusted" &&
        paymentMethodFilter === "adjustment");

    const matchesStatus =
      statusFilter === "all" ||
      (event.type === "Payment Made" && statusFilter === "completed") ||
      (event.type === "Purchase Order Created" && statusFilter === "pending");

    return matchesSearch && matchesPaymentMethod && matchesStatus;
  });

  // Get unique payment methods from history
  const paymentMethods = Array.from(
    new Set(
      paymentHistory
        .filter((event) => event.type === "Payment Made")
        .map((event) => "Payment")
    )
  );

  const getStatusBadgeVariant = (type: string) => {
    switch (type) {
      case "Payment Made":
        return "default";
      case "Purchase Order Created":
        return "secondary";
      case "Credit Balance Adjusted":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPaymentMethodVariant = (type: string) => {
    switch (type) {
      case "Bank Transfer":
        return "default";
      case "Cash":
        return "success";
      case "Check":
        return "warning";
      case "Credit Card":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a report
    alert("Export functionality would be implemented here");
  };

  const handleEditSupplier = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - simplified for modal */}
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Supplier Details
            </h1>
            <p className="text-gray-600">
              View and manage supplier information and transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handleEditSupplier}>Edit Supplier</Button>
          </div>
        </div>

        {/* Supplier Overview Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {supplier.name}
                </h2>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {supplier.contactName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{supplier.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    variant={
                      supplier.status === "active" ? "default" : "secondary"
                    }
                  >
                    {supplier.status === "active" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Preferred Payment</span>
                  <Badge variant="secondary">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {supplier.preferredPaymentMethod}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Outstanding Balance</span>
                  <span
                    className={`font-bold ${
                      supplier.outstandingBalance > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(supplier.outstandingBalance || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-900">
                    {formatDate(supplier.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {supplier.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{supplier.notes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payment-history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment-history">Payment History</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-history" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Filters and Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="payment">Payments</option>
                      <option value="purchase">Purchase Orders</option>
                      <option value="adjustment">Adjustments</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment History Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentHistory.length > 0 ? (
                      filteredPaymentHistory.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(transaction.type)}
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {transaction.notes}
                            </div>
                            {transaction.relatedId && (
                              <div className="text-xs text-gray-500">
                                ID: {transaction.relatedId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.amount
                              ? formatCurrency(transaction.amount)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {transaction.type === "Payment Made" ? (
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : transaction.type ===
                              "Purchase Order Created" ? (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Processed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No transactions found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <span className="text-gray-600">
                    Showing {filteredPaymentHistory.length} of{" "}
                    {paymentHistory.length} transactions
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      Total Payments:{" "}
                      {formatCurrency(
                        paymentHistory
                          .filter((t) => t.type === "Payment Made")
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </span>
                    <span className="text-gray-600">
                      Total Purchases:{" "}
                      {formatCurrency(
                        paymentHistory
                          .filter((t) => t.type === "Purchase Order Created")
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchase-orders" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icons.file className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Purchase Orders
              </h3>
              <p className="text-gray-500 mb-4">
                Purchase order management functionality will be implemented in a
                future update.
              </p>
              <Button variant="outline" disabled>
                View Purchase Orders
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icons.barChart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supplier Analytics
              </h3>
              <p className="text-gray-500 mb-4">
                Analytics and reporting features will be implemented in a future
                update.
              </p>
              <Button variant="outline" disabled>
                View Analytics
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Supplier Modal */}
        {showEditModal && (
          <SupplierForm
            supplier={supplier}
            onSuccess={() => {
              handleCloseEditModal();
              // In a real implementation, we would refresh the supplier data
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SupplierDetail;
