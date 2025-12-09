"use client";

import React, { useState } from "react";
import CreateShoppingListClient from "@/components/shopping/CreateShoppingListClient";
import OrdersListClient from "@/components/orders/OrdersListClient";
import { LayoutDashboard, History } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

// Types shared between components
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice?: number;
}

export interface Order {
    id: string;
    // For created orders, we might not have all these fields initially tailored for the history view, 
    // but we will map them.
    name?: string; 
    supplier: string; // Updated from supplierId for display simplicity in history, or we resolve it.
    date: string;
    status: 'paid' | 'pending' | 'partial';
    itemsCount: number;
    totalAmount: number;
    paidAmount: number;
}

// Mock Data moved here
const MOCK_HISTORY_ORDERS: Order[] = [
    {
        id: "ORD-2025-001",
        supplier: "TechParts Supply",
        date: "2025-10-15",
        status: "paid",
        itemsCount: 12,
        totalAmount: 1450.00,
        paidAmount: 1450.00
    },
    {
        id: "ORD-2025-002",
        supplier: "Global Electronics Hub",
        date: "2025-10-18",
        status: "pending",
        itemsCount: 5,
        totalAmount: 320.50,
        paidAmount: 0
    },
    {
        id: "ORD-2025-003",
        supplier: "Construction Materials Co.",
        date: "2025-10-20",
        status: "partial",
        itemsCount: 8,
        totalAmount: 2100.00,
        paidAmount: 1000.00
    },
    {
        id: "ORD-2025-004",
        supplier: "Office Depot",
        date: "2025-10-21",
        status: "pending",
        itemsCount: 3,
        totalAmount: 85.00,
        paidAmount: 0
    },
    {
        id: "ORD-2025-005",
        supplier: "TechParts Supply",
        date: "2025-10-22",
        status: "paid",
        itemsCount: 2,
        totalAmount: 120.00,
        paidAmount: 120.00
    }
];

export default function OrdersMainClient() {
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");
  const [historyOrders, setHistoryOrders] = useState<Order[]>(MOCK_HISTORY_ORDERS);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const handleSaveOrder = (newOrderData: any) => {
      // Check if this is an update to an existing finalized order
      const existingOrderIndex = historyOrders.findIndex(o => o.id === newOrderData.id);

      if (existingOrderIndex >= 0) {
          // UPDATE existing order
          const updatedOrders = [...historyOrders];
          updatedOrders[existingOrderIndex] = {
              ...updatedOrders[existingOrderIndex], // Keep existing fields like date if we don't want to change them, or overwrite
              supplier: newOrderData.supplierName || updatedOrders[existingOrderIndex].supplier,
              status: newOrderData.status,
              itemsCount: newOrderData.items.length,
              totalAmount: newOrderData.totalEstimatedCost,
              paidAmount: newOrderData.paidAmount,
              // Update other fields as needed
          };
          setHistoryOrders(updatedOrders);
      } else {
          // CREATE new order
          // Map the creation data format to the history format
          const newHistoryOrder: Order = {
              id: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
              supplier: newOrderData.supplierName || "Unknown Supplier",
              date: new Date().toISOString().split('T')[0],
              status: newOrderData.status,
              itemsCount: newOrderData.items.length,
              totalAmount: newOrderData.totalEstimatedCost,
              paidAmount: newOrderData.paidAmount
          };
          setHistoryOrders([newHistoryOrder, ...historyOrders]);
      }

      setActiveTab("history");
      setOrderToEdit(null); // Clear edit state on save
  };

  const handleEditOrder = (order: Order) => {
      setOrderToEdit(order);
      setActiveTab("workspace");
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
