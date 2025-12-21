"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Printer,
  History,
  Barcode,
  QrCode,
  User,
  Calendar,
  Filter,
  Package,
  Tag,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/clientUtils";

// Fake data for demonstration
const fakeInventoryItems = [
  {
    id: "1",
    phoneBrand: "iPhone",
    itemName: "Screen Replacement",
    sellingPrice: 89.99,
    quantityInStock: 15,
  },
  {
    id: "2",
    phoneBrand: "Samsung",
    itemName: "Battery Replacement",
    sellingPrice: 49.99,
    quantityInStock: 22,
  },
  {
    id: "3",
    phoneBrand: "Google",
    itemName: "Charging Port",
    sellingPrice: 39.99,
    quantityInStock: 8,
  },
  {
    id: "4",
    phoneBrand: "OnePlus",
    itemName: "Camera Module",
    sellingPrice: 129.99,
    quantityInStock: 5,
  },
  {
    id: "5",
    phoneBrand: "Xiaomi",
    itemName: "Speaker",
    sellingPrice: 24.99,
    quantityInStock: 30,
  },
];

const fakeTransactionHistory = [
  {
    id: "1001",
    receiptNumber: "TXN001",
    date: "2023-06-15 14:30",
    items: 3,
    total: 164.97,
    paymentMethod: "Cash",
    status: "completed",
  },
  {
    id: "1002",
    receiptNumber: "TXN002",
    date: "2023-06-15 14:15",
    items: 1,
    total: 89.99,
    paymentMethod: "Card",
    status: "completed",
  },
  {
    id: "1003",
    receiptNumber: "TXN003",
    date: "2023-06-15 13:45",
    items: 2,
    total: 114.98,
    paymentMethod: "Cash",
    status: "completed",
  },
  {
    id: "1004",
    receiptNumber: "TXN004",
    date: "2023-06-15 13:20",
    items: 5,
    total: 299.95,
    paymentMethod: "Card",
    status: "completed",
  },
  {
    id: "1005",
    receiptNumber: "TXN005",
    date: "2023-06-15 12:50",
    items: 1,
    total: 49.99,
    paymentMethod: "Cash",
    status: "completed",
  },
];

const fakeClients = [
  { id: "1", name: "John Smith", outstandingBalance: 0 },
  { id: "2", name: "Sarah Johnson", outstandingBalance: 25.5 },
  { id: "3", name: "Michael Brown", outstandingBalance: 0 },
];

export function TillPageClient() {
  // State for cart items
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "iPhone Screen Replacement",
      quantity: 1,
      price: 89.99,
      total: 89.99,
    },
    {
      id: "2",
      name: "Samsung Battery Replacement",
      quantity: 2,
      price: 49.99,
      total: 99.98,
    },
  ]);

  // State for UI controls
  const [itemSearch, setItemSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("1");
  const [paidAmount, setPaidAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [activeTab, setActiveTab] = useState("till");

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const change = paidAmount - total;

  // Handle adding items to cart
  const addToCart = (item: any) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                total: (cartItem.quantity + 1) * cartItem.price,
              }
            : cartItem
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: item.id,
          name: `${item.phoneBrand} ${item.itemName}`,
          quantity: 1,
          price: item.sellingPrice,
          total: item.sellingPrice,
        },
      ]);
    }
    setItemSearch("");
  };

  // Handle quantity changes
  const updateQuantity = (id: string, delta: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  // Filter inventory items based on search
  const filteredItems = fakeInventoryItems.filter(
    (item) =>
      item.phoneBrand.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.itemName.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Till Point</h1>
                <p className="text-sm text-gray-500">
                  Process transactions and manage sales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Printers
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="till" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Till
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="till" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Item Search and Cart */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Item Search */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        Scan Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Scan barcode or search items..."
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          className="pl-10 h-10"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {itemSearch && (
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                          {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                                onClick={() => addToCart(item)}
                              >
                                <div>
                                  <p className="font-medium text-sm">
                                    {item.phoneBrand} - {item.itemName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {item.quantityInStock} in stock
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">
                                    {formatCurrency(item.sellingPrice)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No items found
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Add Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-16 flex flex-col gap-1"
                        >
                          <Package className="h-5 w-5" />
                          <span className="text-xs">Custom Item</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-16 flex flex-col gap-1"
                        >
                          <Tag className="h-5 w-5" />
                          <span className="text-xs">Discount</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-16 flex flex-col gap-1"
                        >
                          <Zap className="h-5 w-5" />
                          <span className="text-xs">Service Fee</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shopping Cart */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        Current Transaction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {cartItems.length > 0 ? (
                        <div className="divide-y">
                          {cartItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold">
                                  {formatCurrency(item.total)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(item.price)} each
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 h-8 w-8 text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                          <p className="mt-2 text-muted-foreground">
                            No items in cart
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Scan or search for items to add
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Payment and Customer */}
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                      >
                        {fakeClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}{" "}
                            {client.outstandingBalance > 0
                              ? `(Bal: ${formatCurrency(
                                  client.outstandingBalance
                                )})`
                              : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="link"
                        className="p-0 mt-2 h-auto text-xs"
                      >
                        + Add new customer
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Payment Summary */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle>Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (8%):</span>
                        <span className="font-medium">
                          {formatCurrency(tax)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-lg">{formatCurrency(total)}</span>
                      </div>

                      <div className="pt-3">
                        <label className="text-sm font-medium">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Button
                            variant={
                              paymentMethod === "Cash" ? "default" : "outline"
                            }
                            className="h-12"
                            onClick={() => setPaymentMethod("Cash")}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cash
                          </Button>
                          <Button
                            variant={
                              paymentMethod === "Card" ? "default" : "outline"
                            }
                            className="h-12"
                            onClick={() => setPaymentMethod("Card")}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Card
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-sm font-medium">
                          Amount Paid
                        </label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={paidAmount}
                            onChange={(e) =>
                              setPaidAmount(parseFloat(e.target.value) || 0)
                            }
                            className="pl-10 h-10"
                          />
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-md ${
                          change >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Change:</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(change)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button className="w-full h-12 text-lg font-bold">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Complete Sale
                      </Button>
                      <Button variant="outline" className="w-full">
                        Save for Later
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-12">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                      </Button>
                      <Button variant="outline" className="h-12">
                        <History className="h-4 w-4 mr-2" />
                        Last Receipt
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      Transaction History
                    </CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search transactions..."
                          className="pl-9 w-full md:w-64"
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">
                            Receipt #
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Date
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Items
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Payment
                          </th>
                          <th className="text-right p-3 text-sm font-medium">
                            Total
                          </th>
                          <th className="p-3 text-sm font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fakeTransactionHistory.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="p-3 font-medium">
                              {transaction.receiptNumber}
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {transaction.date}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {transaction.items} items
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">
                                {transaction.paymentMethod}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-bold">
                              {formatCurrency(transaction.total)}
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
