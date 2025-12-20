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

import { getOrdersBySupplier } from "@/lib/api/orders";
import type { Order as DBOrder } from "@/types/order";
import Link from "next/link";

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

  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Fetch history and orders when supplierId changes
  useEffect(() => {
    if (supplierId) {
      getSupplierHistory(supplierId);
      loadOrders();
    }
  }, [supplierId, getSupplierHistory]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await getOrdersBySupplier(supplierId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load supplier orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-5">
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <span className="text-3xl font-bold text-white">
                  {supplier.name.charAt(0).toUpperCase()}
                </span>
              </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {supplier.name}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <Badge 
                  variant={supplier.status === "active" ? "default" : "secondary"}
                  className={`px-3 py-1 ${
                    supplier.status === "active" 
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                  }`}
                >
                  {supplier.status === "active" ? (
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    "Inactive"
                  )}
                </Badge>
                <span className="text-gray-400 font-medium">#{supplier.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:shadow-lg gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Record Payment
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Record a new payment</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleEditSupplier}
                    variant="outline"
                    className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 shadow-sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Supplier Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-white border-gray-200 hover:bg-gray-50 shadow-sm">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportReport} disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
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

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
             </div>
             
             <div className="space-y-5">
                <div className="flex items-center gap-3 group">
                   <div className="w-40 text-sm font-medium text-gray-500">Contact Person</div>
                   <div className="text-sm font-medium text-gray-900">{supplier.contactName || "—"}</div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-40 text-sm font-medium text-gray-500">Email Address</div>
                   <div className="text-sm text-gray-900">
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                          {supplier.email}
                        </a>
                      ) : "—"}
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-40 text-sm font-medium text-gray-500">Phone Number</div>
                   <div className="text-sm text-gray-900">
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                          {supplier.phone}
                        </a>
                      ) : "—"}
                   </div>
                </div>

                <div className="flex items-start gap-3">
                   <div className="w-40 text-sm font-medium text-gray-500 pt-0.5">Address</div>
                   <div className="text-sm text-gray-900 flex items-start gap-1.5">
                      {supplier.address ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400" />
                          <span className="max-w-[200px] leading-relaxed">{supplier.address}</span>
                        </>
                      ) : "—"}
                   </div>
                </div>
             </div>
          </div>

          {/* Financial Overview Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Financial Overview</h2>
             </div>

             <div className="space-y-6">
                <div>
                   <div className="text-sm font-medium text-gray-500 mb-2">Outstanding Balance</div>
                   <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold tracking-tight ${
                        (supplier.outstandingBalance || 0) > 0 ? "text-orange-600" : "text-emerald-600"
                      }`}>
                        {formatCurrency(supplier.outstandingBalance || 0)}
                      </span>
                      <span className="text-sm font-medium text-gray-500">current due</span>
                   </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-500">Preferred Payment</span>
                     <Badge variant="outline" className="font-medium">
                        {supplier.preferredPaymentMethod || "Not set"}
                     </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-500">Last Updated</span>
                     <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(supplier.updatedAt)}
                     </span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {supplier.notes && (
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Notes
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">{supplier.notes}</p>
          </div>
        )}

        {/* Tabs - Search Bar Container */}
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
              <div className="mt-4 overflow-x-auto">
                {loadingOrders ? (
                  <div className="py-8 text-center text-gray-500">Loading orders...</div>
                ) : orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.created_at.split('T')[0]}</TableCell>
                          <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>{formatCurrency(order.paid_amount)}</TableCell>
                          <TableCell>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/orders`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-gray-500">No orders found for this supplier.</div>
                )}
              </div>
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
