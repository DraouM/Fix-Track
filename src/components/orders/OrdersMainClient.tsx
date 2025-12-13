"use client";

import React, { useState, useEffect } from "react";
import CreateShoppingListClient from "@/components/shopping/CreateShoppingListClient";
import OrdersListClient from "@/components/orders/OrdersListClient";
import { LayoutDashboard, History } from "lucide-react";
import { getOrders } from "@/lib/api/orders";
import type { Order as DBOrder } from "@/types/order";
import { toast } from "sonner";

// Legacy interface for display in history list
export interface OrderDisplay {
    id: string;
    order_number: string;
    supplier: string;
    date: string;
    status: 'paid' | 'pending' | 'partial';
    itemsCount: number;
    totalAmount: number;
    paidAmount: number;
}

import { useSupplierState } from "@/context/SupplierContext";

export default function OrdersMainClient() {
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");
  const [historyOrders, setHistoryOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderToEdit, setOrderToEdit] = useState<DBOrder | null>(null);

  const { suppliers } = useSupplierState();

  // Load orders from database
  useEffect(() => {
    loadOrders();
  }, [suppliers]); // Re-run when suppliers load to ensure names are resolved

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orders = await getOrders(); // Get all orders
      
      // Transform DB orders to display format
      const displayOrders: OrderDisplay[] = orders.map(order => {
        const supplierName = suppliers.find(s => s.id === order.supplier_id)?.name || 'Unknown Supplier';
        return {
            id: order.id,
            order_number: order.order_number,
            supplier: supplierName, 
            date: order.created_at.split('T')[0], // Extract date part
            status: order.payment_status as 'paid' | 'pending' | 'partial',
            itemsCount: 0, // Still 0 for now as we don't have this data in list view
            totalAmount: order.total_amount,
            paidAmount: order.paid_amount,
        };
      });
      
      setHistoryOrders(displayOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      // toast.error('Failed to load orders'); // Suppress error on initial load race conditions
    } finally {
      setLoading(false);
    }
  };


  const handleSaveOrder = async (orderId: string) => {
      // Reload orders after save
      await loadOrders();
      setActiveTab("history");
      setOrderToEdit(null);
      toast.success("Order saved successfully!");
  };

  const handleEditOrder = async (orderDisplay: OrderDisplay) => {
      try {
        // For now, we'll pass the order ID to the workspace
        // The workspace component will load the full order details
        setOrderToEdit({ 
          id: orderDisplay.id,
          order_number: orderDisplay.order_number,
          supplier_id: orderDisplay.supplier,
          status: 'draft', // Will be loaded properly in workspace
          payment_status: orderDisplay.status,
          total_amount: orderDisplay.totalAmount,
          paid_amount: orderDisplay.paidAmount,
          created_at: orderDisplay.date,
          updated_at: orderDisplay.date,
        } as DBOrder);
        setActiveTab("workspace");
      } catch (error) {
        console.error('Failed to edit order:', error);
        toast.error('Failed to load order for editing');
      }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 pt-4">
        <div className="max-w-7xl mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`pb-4 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "workspace"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Workspace
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <History className="w-4 h-4" />
            History
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {historyOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
          {activeTab === "workspace" ? (
             <CreateShoppingListClient onSaveOrder={handleSaveOrder} orderToEdit={orderToEdit} />
          ) : (
             <OrdersListClient orders={historyOrders} onEdit={handleEditOrder} />
          )}
      </div>
    </div>
  );
}
