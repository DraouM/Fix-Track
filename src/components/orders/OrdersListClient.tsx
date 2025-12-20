"use client";

import React, { useState } from "react";
import { 
    Search, 
    Filter, 
    Eye, 
    Printer, 
    FileText,
    Calendar,
    ArrowUpDown,
    DollarSign
} from "lucide-react";
import Link from "next/link";
import { OrderPaymentModal } from "./OrderPaymentModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { OrderDisplay } from "./OrdersMainClient";

interface OrdersListClientProps {
    orders: OrderDisplay[];
    onEdit?: (order: OrderDisplay) => void;
    onPaymentSuccess?: () => void;
}

export default function OrdersListClient({ orders, onEdit, onPaymentSuccess }: OrdersListClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentOrder, setPaymentOrder] = useState<OrderDisplay | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-green-200">Paid</Badge>;
            case "pending":
                return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>;
            case "partial":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Partial</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
            order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders History</h1>
                        <p className="text-gray-500 mt-1">
                            Manage and track your purchase orders
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                           <Filter className="w-4 h-4 text-gray-400" />
                           <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-2 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                           >
                               <option value="all">All Statuses</option>
                               <option value="paid">Paid</option>
                               <option value="pending">Pending</option>
                               <option value="partial">Partial</option>
                           </select>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[180px]">Order ID</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[200px]">Payment Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-center w-[120px]">Status</TableHead>
                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <FileText className="w-12 h-12 mb-2 text-gray-300" />
                                            <p className="text-lg font-medium">No orders found</p>
                                            <p className="text-sm">Try adjusting your filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => {
                                    const percentPaid = order.totalAmount > 0 
                                        ? Math.min(100, (order.paidAmount / order.totalAmount) * 100) 
                                        : 0;
                                    
                                    return (
                                        <TableRow key={order.id} className="group hover:bg-gray-50/50">
                                            <TableCell className="font-medium text-gray-900">
                                                {order.order_number || <span className="text-gray-400 italic"># Pending</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                        {order.supplier.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <Link 
                                                        href={`/suppliers?id=${order.supplierId}`}
                                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                    >
                                                        {order.supplier}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {order.date}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500">
                                                            ${order.paidAmount.toFixed(2)} paid
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            {percentPaid.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <Progress value={percentPaid} className="h-1.5" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-bold text-gray-900">
                                                    ${order.totalAmount.toFixed(2)}
                                                </div>
                                                {order.paidAmount < order.totalAmount && (
                                                    <div className="text-xs text-red-500 font-medium">
                                                        Due: ${(order.totalAmount - order.paidAmount).toFixed(2)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => onEdit?.(order)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all active:scale-95"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {order.status !== 'paid' && (
                                                        <button 
                                                            onClick={() => setPaymentOrder(order)}
                                                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-all active:scale-95"
                                                            title="Record Payment"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all active:scale-95"
                                                        title="Print"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Payment Modal */}
                {paymentOrder && (
                    <OrderPaymentModal
                        orderId={paymentOrder.id}
                        orderNumber={paymentOrder.order_number}
                        supplierName={paymentOrder.supplier}
                        totalAmount={paymentOrder.totalAmount}
                        paidAmount={paymentOrder.paidAmount}
                        onClose={() => setPaymentOrder(null)}
                        onSuccess={() => {
                            setPaymentOrder(null);
                            onPaymentSuccess?.();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
