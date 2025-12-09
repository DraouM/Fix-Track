"use client";

import React, { useState } from "react";
import { useSupplierState } from "@/context/SupplierContext";
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
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice?: number;
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
  
  // Mock Data for Product Search
  const MOCK_PRODUCTS = [
    { id: "p1", name: "Portland Cement (50kg)", defaultPrice: 12.50 },
    { id: "p2", name: "Sand (per ton)", defaultPrice: 45.00 },
    { id: "p3", name: "Gravel (per ton)", defaultPrice: 40.00 },
    { id: "p4", name: "Steel Rebar (12mm)", defaultPrice: 8.75 },
    { id: "p5", name: "Red Bricks (1000 pcs)", defaultPrice: 350.00 },
    { id: "p6", name: "PVC Pipe (4 inch, 6m)", defaultPrice: 22.00 },
    { id: "p7", name: "Electrical Wire (2.5mm roll)", defaultPrice: 65.00 },
    { id: "p8", name: "White Paint (20L)", defaultPrice: 85.00 },
  ];

  const MOCK_INITIAL_ORDERS: Order[] = [
      {
          id: "order-1",
          name: "Site A Materials",
          items: [
              { id: "item-1", name: "Portland Cement (50kg)", quantity: 10, estimatedPrice: 12.50 },
              { id: "item-2", name: "Sand (per ton)", quantity: 5, estimatedPrice: 45.00 },
          ],
          supplierId: "sup-1", // Assuming this might match a mock supplier ID or be empty if not found
          paidAmount: 200,
          status: 'pending'
      },
      {
          id: "order-2",
          name: "Office Supplies",
          items: [
              { id: "item-3", name: "White Paint (20L)", quantity: 2, estimatedPrice: 85.00 },
          ],
          supplierId: "",
          paidAmount: 0,
          status: 'pending'
      }
  ];

  const [orders, setOrders] = useState<Order[]>(MOCK_INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string>(MOCK_INITIAL_ORDERS[0].id);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Load order to edit when prop changes
  React.useEffect(() => {
    if (orderToEdit) {
        setOrders(prevOrders => {
            // Check if already exists in workspace
            const exists = prevOrders.find(o => o.id === orderToEdit.id);
            
            // Try to find the supplier ID based on name if possible
            const matchedSupplier = suppliers.find(s => s.name === orderToEdit.supplier);

            if (exists) {
                // If it exists but has no supplier ID, and we found a match now (e.g. suppliers loaded late), update it
                if (!exists.supplierId && matchedSupplier) {
                    return prevOrders.map(o => o.id === orderToEdit.id ? { ...o, supplierId: matchedSupplier.id } : o);
                }
                
                // Otherwise just switch to it
                if (activeOrderId !== exists.id) {
                     setActiveOrderId(exists.id);
                }
                return prevOrders;
            }
            
            // Reconstruct the full order object from the history format (which might be partial)
            // For this mock, we'll try to use what we have or default

            const restoredOrder: Order = {
                id: orderToEdit.id,
                name: orderToEdit.name || `Order ${orderToEdit.id}`, // Fallback name
                items: orderToEdit.items || [{ id: uuidv4(), name: "Restored Item", quantity: 1, estimatedPrice: 0 }], // We'd need to store items in history in reality
                supplierId: matchedSupplier ? matchedSupplier.id : "", // Map back to ID
                paidAmount: orderToEdit.paidAmount || 0,
                status: orderToEdit.status
            };
            
            // Since our history mock doesn't store "items" array, let's just create a dummy one for demonstration
            // In a real app, 'orderToEdit' would fetch the full order details including items.
            if (!restoredOrder.items || restoredOrder.items.length === 0 || (orderToEdit.itemsCount && !orderToEdit.items)) {
                 restoredOrder.items = Array(orderToEdit.itemsCount || 1).fill(null).map((_, i) => ({
                     id: uuidv4(), 
                     name: `Restored Item ${i+1}`, 
                     quantity: 1, 
                     estimatedPrice: (orderToEdit.totalAmount / (orderToEdit.itemsCount || 1)) 
                 }));
            }

            // Append and select
            setActiveOrderId(restoredOrder.id);
            return [...prevOrders, restoredOrder];
        });
    }
  }, [orderToEdit, suppliers]);

  // Derived state for the active view
  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0];

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
          // If name changes, check for exact match in mock db to auto-fill price
          if (field === "name") {
             const product = MOCK_PRODUCTS.find(p => p.name.toLowerCase() === (value as string).toLowerCase());
             if (product && !item.estimatedPrice) {
                 updatedItem.estimatedPrice = product.defaultPrice;
             }
          }
          return updatedItem;
        }
        return item;
      });
      updateActiveOrder({ items: updatedItems });
  };

  const handleSelectProduct = (itemId: string, product: typeof MOCK_PRODUCTS[0]) => {
      const updatedItems = activeOrder.items.map(item => {
          if (item.id === itemId) {
              return { ...item, name: product.name, estimatedPrice: product.defaultPrice };
          }
          return item;
      });
      updateActiveOrder({ items: updatedItems });
      setFocusedItemId(null);
  };

  const calculateTotalEstimated = () => {
    return activeOrder.items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0);
  };

  const calculateRemaining = () => {
      const total = calculateTotalEstimated();
      return Math.max(0, total - activeOrder.paidAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeOrder.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (activeOrder.items.some((item) => !item.name.trim())) {
      toast.error("Please fill in all item names");
      return;
    }

    console.log("Saving Order:", activeOrder);
    
    // Find supplier name
    const supplier = suppliers.find(s => s.id === activeOrder.supplierId);
    
    // Determine supplier name with fallback
    let supplierName = "Unknown Supplier";
    if (supplier) {
        supplierName = supplier.name;
    } else if (orderToEdit && orderToEdit.id === activeOrder.id) {
        // Fallback: If we couldn't match an ID but we are editing this order, 
        // preserve the original name (likely a mock name that doesn't exist in DB)
        supplierName = orderToEdit.supplier || "Unknown Supplier";
    }

    // Call parent handler
    if (onSaveOrder) {
        onSaveOrder({
            ...activeOrder,
            supplierName: supplierName,
            totalEstimatedCost: calculateTotalEstimated()
        });
    }

    toast.success(`Order "${activeOrder.name}" saved successfully!`);
    
    // Optional: Reset or mark as paid/saved in a real app
    
    // Cleanup: Remove the saved order from the workspace
    const remainingOrders = orders.filter(o => o.id !== activeOrderId);
    
    if (remainingOrders.length === 0) {
        // If it was the last order, reset to a clean state with a new ID
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
        // Otherwise, switch to the first available order
        setOrders(remainingOrders);
        setActiveOrderId(remainingOrders[0].id);
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
                        className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeOrder.id === order.id 
                                ? "bg-white border-blue-200 text-blue-700 shadow-sm"
                                : "bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                     >
                        <div className={`w-2 h-2 rounded-full ${activeOrder.id === order.id ? "bg-blue-500" : "bg-gray-300"}`}></div>
                        {order.name}
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
                    <div className="col-span-3">Unit Price ($)</div>
                    <div className="col-span-2 text-right">Total ($)</div>
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
                            {/* Suggestions Dropdown */}
                            {focusedItemId === item.id && item.name.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1 max-h-48 overflow-auto">
                                    {MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(item.name.toLowerCase())).map(product => (
                                        <div 
                                            key={product.id}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur
                                                handleSelectProduct(item.id, product);
                                            }}
                                        >
                                            <span className="font-medium truncate">{product.name}</span>
                                            <span className="text-gray-400 text-xs ml-2">${product.defaultPrice.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(item.name.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-2 text-xs text-gray-400 italic">No matches found</div>
                                    )}
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
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
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
                                ${((item.estimatedPrice || 0) * item.quantity).toFixed(2)}
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
                        <label className="text-xs font-semibold text-gray-500">Select Supplier</label>
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
                        <span>${calculateTotalEstimated().toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Payment</span>
                        <div className="w-24 relative">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
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
                            ${calculateRemaining().toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                     <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-blue-200 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Save Order
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
