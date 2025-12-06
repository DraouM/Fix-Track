"use client";

import React, { useState, useEffect } from "react";
import {
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
  Search,
  Pencil,
  DollarSign,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { SupplierForm } from "./SupplierForm";
import { SupplierPaymentModal } from "./SupplierPaymentModal";

interface SupplierDetailProps {
  supplierId: string;
}

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const { suppliers } = useSupplierState();
  const { getSupplierHistory, getSupplierById } = useSupplierActions();
  
  // Get supplier from context
  const supplier = getSupplierById(supplierId);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch history when supplierId changes
  useEffect(() => {
    if (supplierId) {
      getSupplierHistory(supplierId);
    }
  }, [supplierId, getSupplierHistory]);

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading supplier details...</p>
      </div>
    );
  }

  // Use history from the supplier object (enhanced by the context)
  const history = supplier.history || [];

  // Filter payment history based on search and filters
  const filteredHistory = history.filter((event) => {
    const matchesSearch =
      !searchTerm ||
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.relatedId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      (event.type === "Payment Made" && paymentMethodFilter === "payment") ||
      (event.type === "Purchase Order Created" &&
        paymentMethodFilter === "purchase") ||
      (event.type === "Credit Balance Adjusted" &&
        paymentMethodFilter === "adjustment");

    const matchesStatus = statusFilter === "all"; 

    return matchesSearch && matchesPaymentMethod && matchesStatus;
  });

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

  const handleExportReport = () => {
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {supplier.name}
              </h1>
              <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                {supplier.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              ID: {supplier.id}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowPaymentModal(true)}
                    size="icon"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full h-10 w-10 shadow-sm"
                  >
                    <DollarSign className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Record Payment</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleEditSupplier}
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Supplier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportReport} disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showPaymentModal && (
            <SupplierPaymentModal
                supplierId={supplierId}
                supplierName={supplier.name}
                currentBalance={supplier.outstandingBalance || 0}
                onClose={() => setShowPaymentModal(false)}
            />
        )}

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
                  Contact Information
                </h2>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {supplier.contactName || "No contact name"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {supplier.email ? (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">No email</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {supplier.phone ? (
                      <a
                        href={`tel:${supplier.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">No phone</span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">
                      {supplier.address || "No address provided"}
                    </span>
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
                    {supplier.preferredPaymentMethod || "Not set"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Outstanding Balance</span>
                  <span
                    className={`font-bold ${
                      (supplier.outstandingBalance || 0) > 0
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
            <TabsTrigger value="payment-history">History & Logs</TabsTrigger>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {formatDate(event.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(event.type)}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {event.notes}
                            </div>
                            {event.relatedId && (
                              <div className="text-xs text-gray-500">
                                ID: {event.relatedId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {event.amount !== undefined && event.amount !== 0
                              ? formatCurrency(event.amount)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-gray-500"
                        >
                          No history found matching your criteria
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
                    Showing {filteredHistory.length} of {history.length} events
                  </span>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Edit Supplier</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <SupplierForm
                  supplier={supplier}
                  onSuccess={() => {
                    handleCloseEditModal();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierDetail;
