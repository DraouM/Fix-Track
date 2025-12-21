"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Minus, Trash2, Save, ShoppingCart, 
  User, CheckCircle2, AlertCircle, DollarSign, X, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useClientContext } from "@/context/ClientContext";
import { useInventory } from "@/context/InventoryContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { Sale, SaleItem, SalePayment } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";
import { createSale, addSaleItem, addSalePayment, completeSale } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/clientUtils";

export function CreateSaleClient() {
  const router = useRouter();
  const { clients } = useClientContext();
  const { searchItems } = useInventory();

  // Sale State
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  
  // UI State
  const [itemSearch, setItemSearch] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
  const remainingBalance = totalAmount - paidAmount;

  // Search Items
  useEffect(() => {
    const performSearch = async () => {
      if (itemSearch.length > 1) {
        const results = await searchItems(itemSearch);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    performSearch();
  }, [itemSearch, searchItems]);

  const addItem = (invItem: InventoryItem) => {
    const existingIndex = items.findIndex(i => i.item_id === invItem.id);
    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total_price = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      setItems([...items, {
        id: uuidv4(),
        sale_id: "", // Will be set on save
        item_id: invItem.id,
        item_name: `${invItem.phoneBrand} - ${invItem.itemName}`,
        quantity: 1,
        unit_price: invItem.sellingPrice || 0,
        total_price: invItem.sellingPrice || 0,
      }]);
    }
    setItemSearch("");
    setSearchResults([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          total_price: newQty * item.unit_price
        };
      }
      return item;
    }));
  };

  const handleSaveSale = async (complete: boolean) => {
    if (!selectedClientId) {
       toast.error("Please select a client");
       return;
    }
    if (items.length === 0) {
       toast.error("Please add at least one item");
       return;
    }

    setIsSaving(true);
    try {
      const saleId = uuidv4();
      const sale: Sale = {
        id: saleId,
        sale_number: "", // Backend generates if empty
        client_id: selectedClientId,
        status: "draft",
        payment_status: "unpaid",
        total_amount: totalAmount,
        paid_amount: 0,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdSale = await createSale(sale);
      
      // Add Items
      for (const item of items) {
        await addSaleItem({ ...item, sale_id: saleId });
      }

      // Add Payment if any
      if (paidAmount > 0) {
        const payment: SalePayment = {
          id: uuidv4(),
          sale_id: saleId,
          amount: paidAmount,
          method: paymentMethod,
          date: new Date().toISOString(),
          received_by: "Current User",
          notes: "Initial payment",
        };
        await addSalePayment(payment);
      }

      // Complete if requested
      if (complete) {
        await completeSale(saleId);
        toast.success(`Sale ${createdSale.sale_number} completed successfully`);
      } else {
        toast.success(`Sale ${createdSale.sale_number} saved as draft`);
      }

      router.push("/sales");
    } catch (err: any) {
      toast.error(err.message || "Failed to save sale");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
            <p className="text-muted-foreground">Create a new customer sale and record payment.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 px-6 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Items to Sell
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search inventory items by name, brand, or model..." 
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchResults.map(result => (
                        <div 
                          key={result.id}
                          className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                          onClick={() => addItem(result)}
                        >
                          <div>
                            <p className="font-medium text-sm">{result.phoneBrand}</p>
                            <p className="text-xs text-muted-foreground">{result.itemName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(result.sellingPrice || 0)}</p>
                            <p className={`text-[10px] font-medium ${(result.quantityInStock || 0) > 5 ? "text-green-600" : "text-destructive"}`}>
                              {result.quantityInStock} in stock
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Item Details</TableHead>
                    <TableHead className="text-center w-[120px]">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.item_name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-10" />
                        <p>Search for items above to add them to this sale.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Input 
                 placeholder="Any internal notes or customer requests for this sale..." 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Select a Client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.outstandingBalance > 0 ? `(Bal: ${formatCurrency(c.outstandingBalance)})` : ""}
                  </option>
                ))}
              </select>
              {selectedClientId && (
                <div className="mt-4 p-3 rounded-md bg-muted/40 border space-y-2">
                   {clients.find(c => c.id === selectedClientId)?.email && (
                     <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                       <ShoppingCart className="h-3 w-3" /> Customer Email present
                     </p>
                   )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-lg">Checkout Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">SubtotalItems:</span>
                 <span className="font-bold">{formatCurrency(totalAmount)}</span>
               </div>
               <div className="h-px bg-primary/20" />
               <div className="flex justify-between items-center">
                 <span className="text-base font-bold">Total Amount:</span>
                 <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
               </div>

               <div className="space-y-2 pt-4">
                 <label className="text-sm font-medium">Payment Received ($)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      type="number" 
                      className="pl-9 h-10 font-bold text-lg text-green-600"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-medium">Payment Method</label>
                 <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
               </div>

               {remainingBalance > 0 && (
                 <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                   <AlertCircle className="h-4 w-4 text-destructive" />
                   <p className="text-xs text-destructive font-medium">
                     Remaining balance of {formatCurrency(remainingBalance)} will be added to customer credit.
                   </p>
                 </div>
               )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
               <Button 
                className="w-full h-12 text-lg font-bold" 
                disabled={isSaving || items.length === 0}
                onClick={() => handleSaveSale(true)}
               >
                 {isSaving ? "Processing..." : "Complete Sale"}
               </Button>
               <Button 
                variant="outline" 
                className="w-full" 
                disabled={isSaving || items.length === 0}
                onClick={() => handleSaveSale(false)}
               >
                 Save as Draft
               </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
