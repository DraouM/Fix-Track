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

export default function CreateShoppingListClient() {
  const { suppliers, loading } = useSupplierState();
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: uuidv4(), name: "", quantity: 1 },
  ]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), name: "", quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
        toast.error("You must have at least one item in the list");
    }
  };

  const handleItemChange = (
    id: string,
    field: keyof ShoppingItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotalEstimated = () => {
    return items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0);
  };

  const calculateRemaining = () => {
      const total = calculateTotalEstimated();
      return Math.max(0, total - paidAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (items.some((item) => !item.name.trim())) {
      toast.error("Please fill in all item names");
      return;
    }

    const payload = {
        id: uuidv4(),
        name: "New Shopping List",
        supplierId: selectedSupplierId,
        items: items,
        totalEstimatedCost: calculateTotalEstimated(),
        paidAmount: paidAmount,
        status: paidAmount >= calculateTotalEstimated() ? 'paid' : 'pending',
        createdAt: new Date().toISOString()
    };

    console.log("Shopping List Created:", payload);
    toast.success("Shopping list created successfully! (See console for details)");
    
    // Reset form
    setItems([{ id: uuidv4(), name: "", quantity: 1 }]);
    setPaidAmount(0);
    setSelectedSupplierId("");
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
                    Create a new order and assign it to a supplier
                </p>
            </div>
            {/* Placeholder for future tab switching/multiple shopping lists */}
            <div className="hidden md:flex gap-2">
                 <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     Active Order #1
                 </button>
                 <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                     <Plus className="w-5 h-5" />
                 </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Items List */}
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-gray-500" />
                    Order Items
                  </h2>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {items.length} Item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                    <div className="col-span-5 sm:col-span-6">Product / Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 sm:col-span-3">Unit Price ($)</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                        <div
                        key={item.id}
                        className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group"
                        >
                        <div className="col-span-5 sm:col-span-6">
                             <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                                handleItemChange(item.id, "name", e.target.value)
                            }
                            placeholder="Type product name..."
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-400 font-medium text-sm"
                            required
                            />
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
                        <div className="col-span-4 sm:col-span-3">
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
                        <div className="col-span-1 flex justify-center">
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
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg appearance-none bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    !selectedSupplierId ? "text-gray-500 border-dashed border-gray-400" : "text-gray-900 border-gray-300"
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
                    {selectedSupplierId && (
                         <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                            <div className="text-xs text-blue-600 font-medium">Selected:</div>
                            <div className="text-sm font-bold text-blue-900">
                                {suppliers.find(s => s.id === selectedSupplierId)?.name}
                            </div>
                             <div className="text-xs text-blue-700">
                                {suppliers.find(s => s.id === selectedSupplierId)?.email || 'No email'}
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
                                value={paidAmount || ""}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
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
                             setItems([{ id: uuidv4(), name: "", quantity: 1 }]);
                             setPaidAmount(0);
                             setSelectedSupplierId("");
                        }}
                        className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium text-center transition-colors"
                    >
                        Clear & Reset
                    </button>
                </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
