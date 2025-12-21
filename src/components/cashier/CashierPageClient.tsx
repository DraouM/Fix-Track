"use client";

import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  ShoppingCart,
  Wrench,
  Package,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
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
const fakeTransactions = [
  {
    id: "1",
    type: "credit",
    category: "Repair",
    amount: 100,
    description: "Screen fix - iPhone 13",
    time: "09:30 AM",
  },
  {
    id: "2",
    type: "debit",
    category: "Stock Purchase",
    amount: 250,
    description: "Bought 10 Charging Ports",
    time: "10:15 AM",
  },
  {
    id: "3",
    type: "credit",
    category: "Sale",
    amount: 300,
    description: "Sold Phone Case & Charger",
    time: "11:45 AM",
  },
  {
    id: "4",
    type: "debit",
    category: "Expense",
    amount: 50,
    description: "Electricity / Lunch",
    time: "01:20 PM",
  },
  {
    id: "5",
    type: "credit",
    category: "Repair",
    amount: 150,
    description: "Battery replacement - Samsung Galaxy",
    time: "02:30 PM",
  },
  {
    id: "6",
    type: "credit",
    category: "Sale",
    amount: 75,
    description: "Screen protector",
    time: "03:15 PM",
  },
];

const fakePaymentMethods = [
  { method: "Cash", amount: 425 },
  { method: "Card", amount: 200 },
  { method: "Transfer", amount: 150 },
];

export function CashierPageClient() {
  // State for UI controls
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReason, setExpenseReason] = useState("");
  const [countedAmount, setCountedAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Calculate financial metrics
  const totalIn = fakeTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = fakeTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalIn - totalOut;
  const openingBalance = 5; // Fixed opening balance
  const expectedCash = openingBalance + netCash;

  // Handle adding expense
  const handleAddExpense = () => {
    if (expenseAmount && expenseReason) {
      // In a real app, this would add to the transactions list
      alert(`Added expense: $${expenseAmount} for ${expenseReason}`);
      setExpenseAmount("");
      setExpenseReason("");
    }
  };

  // Handle closing day
  const handleCloseDay = () => {
    if (countedAmount && withdrawalAmount) {
      const actualCash = parseFloat(countedAmount);
      const payout = parseFloat(withdrawalAmount);
      const discrepancy = actualCash - expectedCash;
      const carryForward = actualCash - payout;

      alert(`Day closed!
Expected: $${expectedCash.toFixed(2)}
Actual: $${actualCash.toFixed(2)}
Discrepancy: $${discrepancy.toFixed(2)}
Payout: $${payout.toFixed(2)}
Carry Forward: $${carryForward.toFixed(2)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cashier's Desk
                </h1>
                <p className="text-sm text-gray-500">
                  Manage daily transactions and close out
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Reports
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
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* Top Section: Current Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total In */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <TrendingUp className="h-5 w-5" />
                      Total In
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-800">
                      {formatCurrency(totalIn)}
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Repairs + Sales
                    </p>
                  </CardContent>
                </Card>

                {/* Total Out */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <TrendingDown className="h-5 w-5" />
                      Total Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-800">
                      {formatCurrency(totalOut)}
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Purchases + Expenses
                    </p>
                  </CardContent>
                </Card>

                {/* Net Cash in Drawer */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <DollarSign className="h-5 w-5" />
                      Net Cash
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-800">
                      {formatCurrency(netCash)}
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Current Balance: {formatCurrency(expectedCash)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fakePaymentMethods.map((method, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{method.method}</span>
                          <Badge variant="secondary">
                            {formatCurrency(method.amount)}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (method.amount /
                                  (fakePaymentMethods.reduce(
                                    (sum, m) => sum + m.amount,
                                    0
                                  ) || 1)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Middle Section: Expense Entry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Add Expense
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <Input
                        value={expenseReason}
                        onChange={(e) => setExpenseReason(e.target.value)}
                        placeholder="e.g., Cleaning supplies"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleAddExpense} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </CardContent>
                </Card>

                {/* Bottom Section: End of Day Close-out */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      End of Day Close-out
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Counted Amount
                      </label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={countedAmount}
                          onChange={(e) => setCountedAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expected: {formatCurrency(expectedCash)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Withdrawal Amount
                      </label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Closing Note (Optional)
                      </label>
                      <Input
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        placeholder="Any notes about today..."
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleCloseDay}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Close Day
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Today's Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">
                            Time
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Category
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Description
                          </th>
                          <th className="text-right p-3 text-sm font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fakeTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {transaction.time}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  transaction.type === "credit"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {transaction.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {transaction.description}
                            </td>
                            <td
                              className={`p-3 text-right font-bold ${
                                transaction.type === "credit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "credit" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
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
