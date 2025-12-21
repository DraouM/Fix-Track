"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSupplierState, useSupplierActions } from "@/context/SupplierContext";
import {
  Plus,
  Trash2,
  Building2,
  ShoppingCart,
  Save,
  ShoppingBag,
  CreditCard,
  Search,
  MoreVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { invoke } from '@tauri-apps/api/core';
import { formatCurrency } from "@/lib/clientUtils";
import { 
  createOrder, 
  addOrderItem, 
  addOrderPayment,
  completeOrder,
  createNewOrder,
  createNewOrderItem,
  createNewPayment,
  calculateItemTotal,
  updateOrder,
  updateOrderItem,
  removeOrderItem,
  getOrderById
} from "@/lib/api/orders";
import type { Order as DBOrder, OrderItem as DBOrderItem, OrderWithDetails } from "@/types/order";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice?: number;
  inventory_item_id?: string;
}

interface Order {
    id: string;
    name: string;
    items: ShoppingItem[];
    supplierId: string;
    paidAmount: number;
    status: 'pending' | 'paid';
}

interface CreateShoppingListProps {
    onSaveOrder?: (order: any) => void;
    orderToEdit?: any; // Ideally should be Order type but reusing existing mock structures for now
}

export default function CreateShoppingListClient({ onSaveOrder, orderToEdit }: CreateShoppingListProps) {
  const { suppliers, loading } = useSupplierState();
  const { fetchSuppliers } = useSupplierActions();
  
  // Inventory item type from database
  interface InventoryItem {
    id: string;
    item_name: string;
    phone_brand: string;
    item_type: string;
    buying_price: number;
    selling_price: number;
    quantity_in_stock?: number;
  }

  // State for inventory search
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>("");
  const [inventoryResults, setInventoryResults] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Search inventory items from database
  const searchInventory = async (query: string) => {
    if (query.length < 2) {
      setInventoryResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const results = await invoke<InventoryItem[]>('search_items', { query });
      setInventoryResults(results);
    } catch (error) {
      console.error('Inventory search failed:', error);
      toast.error('Failed to search inventory');
    } finally {
      setSearching(false);
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load order to edit when prop changes or initialize setup
  React.useEffect(() => {
    const setupInitialOrder = () => {
      if (!orderToEdit && orders.length === 0) {
        const newId = uuidv4();
        const initialOrder: Order = {
          id: newId,
          name: "New Order #1",
          items: [{ id: uuidv4(), name: "", quantity: 1 }],
          supplierId: "",
          paidAmount: 0,
          status: 'pending'
        };
        setOrders([initialOrder]);
        setActiveOrderId(newId);
      }
    };

    const loadOrderForEdit = async () => {
      if (orderToEdit) {
        try {
          // Fetch full order details from database
          const orderDetails = await invoke<any>('get_order_by_id', { orderId: orderToEdit.id });
          
          if (orderDetails) {
            // Convert database order to local Order format
            const localOrder: Order = {
              id: orderDetails.order.id,
              name: `Order ${orderDetails.order.order_number}`,
              items: orderDetails.items.map((item: any) => ({
                id: item.id,
                name: item.item_name,
                quantity: item.quantity,
                inventory_item_id: item.item_id,
                estimatedPrice: item.unit_price
              })),
              supplierId: orderDetails.order.supplier_id,
              paidAmount: orderDetails.order.paid_amount,
              status: orderDetails.order.payment_status === 'paid' ? 'paid' : 'pending'
            };
            
            // Check if already exists in workspace and update or add
            setOrders(prevOrders => {
              const existsIndex = prevOrders.findIndex(o => o.id === localOrder.id);
              
              if (existsIndex >= 0) {
                // Update existing order
                const updated = [...prevOrders];
                updated[existsIndex] = localOrder;
                return updated;
              } else {
                // Add new order to workspace
                return [...prevOrders, localOrder];
              }
            });
            
            // Set as active order
            setActiveOrderId(localOrder.id);
          }
        } catch (error) {
          console.error('Failed to load order details:', error);
          toast.error('Failed to load order details');
        }
      }
    };
    
    setupInitialOrder();
    loadOrderForEdit();
  }, [orderToEdit]);

  // Derived state for the active view
  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0] || {
    id: "",
    name: "Loading...",
    items: [],
    supplierId: "",
    paidAmount: 0,
    status: 'pending'
  };

  // Helper to update the active order
  const updateActiveOrder = (updates: Partial<Order>) => {
      setOrders(prev => prev.map(order => 
          order.id === activeOrderId ? { ...order, ...updates } : order
      ));
  };

  const handleAddOrder = () => {
      const newOrder: Order = {
          id: uuidv4(),
          name: `New Order #${orders.length + 1}`,
          items: [{ id: uuidv4(), name: "", quantity: 1 }],
          supplierId: "",
          paidAmount: 0,
          status: 'pending'
      };
      setOrders([...orders, newOrder]);
      setActiveOrderId(newOrder.id);
  };

  const handleCloseOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    
    const remainingOrders = orders.filter(o => o.id !== orderId);
    
    if (remainingOrders.length === 0) {
      const newId = uuidv4();
      const newOrder: Order = {
        id: newId,
        name: "New Order #1",
        items: [{ id: uuidv4(), name: "", quantity: 1 }],
        supplierId: "",
        paidAmount: 0,
        status: 'pending'
      };
      setOrders([newOrder]);
      setActiveOrderId(newId);
    } else {
      setOrders(remainingOrders);
      if (activeOrderId === orderId) {
        setActiveOrderId(remainingOrders[remainingOrders.length - 1].id);
      }
    }
  };

  const handleAddItem = () => {
    updateActiveOrder({
        items: [...activeOrder.items, { id: uuidv4(), name: "", quantity: 1 }]
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (activeOrder.items.length > 1) {
       updateActiveOrder({
           items: activeOrder.items.filter((item) => item.id !== itemId)
       });
    } else {
        toast.error("You must have at least one item in the list");
    }
  };

  const handleItemChange = (
    itemId: string,
    field: keyof ShoppingItem,
    value: string | number
  ) => {
    const updatedItems = activeOrder.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // If name or item_id changes, we might want to clear the other, but usually name is driven by item_id selection
          if (field === "name" && typeof value === "string") {
             setInventorySearchQuery(value);
             searchInventory(value);
             // Clear inventory_item_id if name is manually edited
             updatedItem.inventory_item_id = undefined;
          }
          return updatedItem;
        }
        return item;
      });
      updateActiveOrder({ items: updatedItems });
  };

  const handleSelectInventoryItem = (itemId: string, inventoryItem: InventoryItem) => {
      const updatedItems = activeOrder.items.map(item => {
          if (item.id === itemId) {
              return { 
                ...item, 
                name: inventoryItem.item_name, 
                estimatedPrice: inventoryItem.buying_price,
                inventory_item_id: inventoryItem.id
              };
          }
          return item;
      });
      updateActiveOrder({ items: updatedItems });
      setFocusedItemId(null);
      setInventorySearchQuery("");
      setInventoryResults([]);
  };

  const calculateTotalEstimated = () => {
    return activeOrder.items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0);
  };

  const calculateRemaining = () => {
      const total = calculateTotalEstimated();
      return Math.max(0, total - activeOrder.paidAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeOrder.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (activeOrder.items.some((item) => !item.name.trim())) {
      toast.error("Please fill in all item names");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Processing Order:", activeOrder);
      
      // Check if order exists in DB
      let existingOrder: OrderWithDetails | null = null;
      try {
           existingOrder = await getOrderById(activeOrder.id);
      } catch (err) {
           existingOrder = null;
      }

      if (existingOrder) {
          // UPDATE FLOW
          console.log("Updating existing order:", existingOrder);
          
          const totalAmount = calculateTotalEstimated();
          
          // 1. Update Order Header
          const dbOrderUpdate: DBOrder = {
              ...existingOrder.order,
              supplier_id: activeOrder.supplierId,
              total_amount: totalAmount,
              updated_at: new Date().toISOString()
          };
          await updateOrder(dbOrderUpdate);

          // 2. Update Items (Diffing)
          const dbItems = existingOrder.items;
          const currentItems = activeOrder.items;

          const itemsToDelete = dbItems.filter(dbItem => !currentItems.find(ci => ci.id === dbItem.id));
          for (const item of itemsToDelete) {
              await removeOrderItem(item.id, activeOrder.id);
          }

          for (const item of currentItems) {
              const existingItem = dbItems.find(di => di.id === item.id);
              if (existingItem) {
                  const updateItem: DBOrderItem = {
                      ...existingItem,
                      item_id: item.inventory_item_id,
                      item_name: item.name,
                      quantity: item.quantity,
                      unit_price: item.estimatedPrice || 0,
                      total_price: item.quantity * (item.estimatedPrice || 0)
                  };
                  await updateOrderItem(updateItem);
              } else {
                  const newItem = createNewOrderItem(activeOrder.id, item.name);
                  newItem.id = item.id;
                  newItem.item_id = item.inventory_item_id;
                  newItem.quantity = item.quantity;
                  newItem.unit_price = item.estimatedPrice || 0;
                  newItem.total_price = item.quantity * (item.estimatedPrice || 0);
                  await addOrderItem(newItem);
              }
          }

          // 3. Update Payments
          const currentDbPaid = existingOrder.order.paid_amount;
          if (activeOrder.paidAmount > currentDbPaid) {
              const diff = activeOrder.paidAmount - currentDbPaid;
              const payment = createNewPayment(activeOrder.id, diff, 'Cash');
              await addOrderPayment(payment);
          }

          await fetchSuppliers();
          toast.success("Order updated successfully!");
          if (onSaveOrder) onSaveOrder(activeOrder.id);

      } else {
          // CREATE FLOW
          const totalAmount = calculateTotalEstimated();
          
          const dbOrder = createNewOrder(activeOrder.supplierId);
          dbOrder.id = activeOrder.id; // Use workspace ID
          dbOrder.total_amount = totalAmount;
          dbOrder.paid_amount = activeOrder.paidAmount;
          dbOrder.payment_status = activeOrder.paidAmount >= totalAmount ? 'paid' as const : 
                                   activeOrder.paidAmount > 0 ? 'partial' as const : 'unpaid' as const;
          
          const createdOrder = await createOrder(dbOrder);
          
          for (const item of activeOrder.items) {
            const dbItem = createNewOrderItem(createdOrder.id);
            dbItem.id = item.id;
            dbItem.item_id = item.inventory_item_id;
            dbItem.item_name = item.name;
            dbItem.quantity = item.quantity;
            dbItem.unit_price = item.estimatedPrice || 0;
            dbItem.total_price = item.quantity * (item.estimatedPrice || 0);
            await addOrderItem(dbItem);
          }
          
          if (activeOrder.paidAmount > 0) {
            const payment = createNewPayment(createdOrder.id, activeOrder.paidAmount, 'Cash');
            await addOrderPayment(payment);
          }
          
          await completeOrder(createdOrder.id);
          
          await fetchSuppliers();
          toast.success(`Order saved successfully! Order #${createdOrder.order_number}`);
          
          if (onSaveOrder) {
              onSaveOrder(createdOrder.id);
          }
      }
    
      // Cleanup
      const remainingOrders = orders.filter(o => o.id !== activeOrderId);
      if (remainingOrders.length === 0) {
          const newId = uuidv4();
          setOrders([{
              id: newId,
              name: "New Order #1",
              items: [{ id: uuidv4(), name: "", quantity: 1 }],
              supplierId: "",
              paidAmount: 0,
              status: 'pending'
          }]);
          setActiveOrderId(newId);
      } else {
          setOrders(remainingOrders);
          setActiveOrderId(remainingOrders[0].id);
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-8 h-8 text-blue-600" />
                    New Order
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage your orders and assignments
                </p>
            </div>
            
            {/* Order Tabs */}
            <div className="hidden md:flex flex-wrap gap-2">
                 {orders.map(order => (
                     <button 
                        key={order.id}
                        onClick={() => setActiveOrderId(order.id)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors group ${
                            activeOrderId === order.id 
                                ? "bg-white border-blue-200 text-blue-700 shadow-sm"
                                : "bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                     >
                        <div className={`w-2 h-2 rounded-full ${activeOrderId === order.id ? "bg-blue-500" : "bg-gray-300"}`}></div>
                        <span className="max-w-[120px] truncate">{order.name}</span>
                        <div 
                          onClick={(e) => handleCloseOrder(e, order.id)}
                          className={`p-0.5 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-colors ${
                             activeOrderId === order.id ? "text-blue-400" : "text-gray-400 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                           <X className="w-3.5 h-3.5" />
                        </div>
                     </button>
                 ))}
                 <button 
                    onClick={handleAddOrder}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Create New Order"
                 >
                     <Plus className="w-5 h-5" />
                 </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Items List */}
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 rounded-t-xl">
                  <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-gray-500" />
                        Order Items
                      </h2>
                      {/* Editable Order Name */}
                      <input 
                        type="text"
                        value={activeOrder.name}
                        onChange={(e) => updateActiveOrder({ name: e.target.value })}
                        className="text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent outline-none px-1 text-gray-600 focus:text-gray-900 transition-colors"
                      />
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {activeOrder.items.length} Item{activeOrder.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                    <div className="col-span-4">Product / Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-3">
                    {activeOrder.items.map((item) => (
                        <div
                        key={item.id}
                        className="grid grid-cols-12 gap-4 items-start bg-gray-50 p-3 rounded-lg hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group relative"
                        >
                        <div className="col-span-4 relative">
                             <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                                handleItemChange(item.id, "name", e.target.value)
                            }
                            onFocus={() => setFocusedItemId(item.id)}
                            onBlur={() => setTimeout(() => setFocusedItemId(null), 200)} // Delay to allow click
                            placeholder="Type product name..."
                            className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 p-1 focus:ring-0 text-gray-900 placeholder-gray-400 font-medium text-sm transition-colors outline-none"
                            required
                            />
                            {/* Inventory Search Results Dropdown */}
                            {focusedItemId === item.id && inventoryResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1 max-h-48 overflow-auto">
                                    {inventoryResults.map(inventoryItem => (
                                        <div 
                                            key={inventoryItem.id}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur
                                                handleSelectInventoryItem(item.id, inventoryItem);
                                            }}
                                        >
                                            <span className="font-medium truncate">{inventoryItem.item_name}</span>
                                            <span className="text-gray-400 text-xs ml-2">{formatCurrency(inventoryItem.buying_price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Show searching indicator */}
                            {focusedItemId === item.id && searching && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1 px-3 py-2">
                                    <div className="text-xs text-gray-400 italic">Searching inventory...</div>
                                </div>
                            )}
                        </div>
                        <div className="col-span-2">
                            <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                                handleItemChange(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 1
                                )
                            }
                            className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                             <div className="relative">
                                <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.estimatedPrice || ""}
                                onChange={(e) =>
                                    handleItemChange(
                                    item.id,
                                    "estimatedPrice",
                                    parseFloat(e.target.value) || 0
                                    )
                                }
                                placeholder="0.00"
                                className="w-full bg-white border border-gray-200 rounded-md pl-6 pr-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-end h-full">
                            <span className="font-semibold text-gray-700 text-sm">
                                {formatCurrency((item.estimatedPrice || 0) * item.quantity)}
                            </span>
                        </div>
                        <div className="col-span-1 flex justify-center h-full items-center">
                            <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-2 mt-4"
                    >
                    <Plus className="w-4 h-4" />
                    Add New Line Item
                  </button>
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN: Supplier & Payment Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Supplier Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Supplier Details
                </h2>
                
                <div className="space-y-4">

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-500">Select Supplier</label>
                            {activeOrder.supplierId && (
                                <Link 
                                    href={`/suppliers?id=${activeOrder.supplierId}`}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                                >
                                    View Profile
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={activeOrder.supplierId}
                                onChange={(e) => updateActiveOrder({ supplierId: e.target.value })}
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg appearance-none bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    !activeOrder.supplierId ? "text-gray-500 border-dashed border-gray-400" : "text-gray-900 border-gray-300"
                                }`}
                                required
                            >
                                <option value="" disabled>Search or Select Supplier...</option>
                                {loading ? (
                                    <option disabled>Loading...</option>
                                ) : (
                                    suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))
                                )}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    {/* Selected Supplier Info Preview (Optional) */}
                    {activeOrder.supplierId && (
                         <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                            <div className="text-xs text-blue-600 font-medium">Selected:</div>
                            <div className="text-sm font-bold text-blue-900">
                                {suppliers.find(s => s.id === activeOrder.supplierId)?.name}
                            </div>
                             <div className="text-xs text-blue-700">
                                {suppliers.find(s => s.id === activeOrder.supplierId)?.email || 'No email'}
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Payment / Summary Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    Payment Summary
                </h2>

                <div className="space-y-3 pb-6 border-b border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(calculateTotalEstimated())}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Payment</span>
                        <div className="w-24 relative">
                             <input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={activeOrder.paidAmount || ""}
                                onChange={(e) => updateActiveOrder({ paidAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-5 pr-2 py-1 text-right text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                             />
                        </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                        <span>Total (Balance)</span>
                        <span className={calculateRemaining() > 0 ? "text-orange-600" : "text-green-600"}>
                            {formatCurrency(calculateRemaining())}
                        </span>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                     <button
                        type="submit"
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${
                          isSaving ? "bg-gray-400 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                        }`}
                    >
                        {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Saving...
                            </>
                        ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Order
                            </>
                        )}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => {
                             // Reset just the current order, or maybe delete it? 
                             // For now, let's just reset items
                             updateActiveOrder({
                                 items: [{ id: uuidv4(), name: "", quantity: 1 }],
                                 supplierId: "",
                                 paidAmount: 0
                             });
                        }}
                        className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium text-center transition-colors"
                    >
                        Reset Order
                    </button>
                </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
