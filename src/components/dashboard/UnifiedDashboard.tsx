"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Wrench,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Plus,
  CreditCard,
  Banknote,
  FileText,
  Calendar,
  Filter,
  Zap,
  Tag,
  Printer,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/clientUtils";
import { getSales } from "@/lib/api/sales";
import type { Sale } from "@/types/sale";

// Types for our financial data
interface FinancialSummary {
  totalRevenue: number;
  totalProfit: number;
  cashRevenue: number;
  cardRevenue: number;
  totalExpenses: number;
  currentBalance: number;
  pendingTransactions: number;
}

interface RecentTransaction {
  id: string;
  type: "sale" | "repair" | "expense";
  customer: string;
  amount: number;
  method: string;
  status: string;
  timestamp: string;
}

interface CashFlowData {
  date: string;
  cashIn: number;
  cashOut: number;
  balance: number;
}

export function UnifiedDashboard() {
  const [timeRange, setTimeRange] = useState("today");
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalProfit: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    totalExpenses: 0,
    currentBalance: 0,
    pendingTransactions: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real financial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch sales data
        const sales = await getSales();

        // Calculate financial metrics
        let totalRevenue = 0;
        let cashRevenue = 0;
        let cardRevenue = 0;
        let pendingTransactions = 0;

        const transactions: RecentTransaction[] = [];

        sales.forEach((sale) => {
          totalRevenue += sale.total_amount;

          if (sale.status === "completed") {
            // Add to transactions list
            transactions.push({
              id: sale.id,
              type: "sale",
              customer: `Customer #${sale.client_id.substring(0, 6)}`,
              amount: sale.total_amount,
              method: "Cash", // Simplified for demo
              status: sale.payment_status,
              timestamp: sale.created_at,
            });

            // Categorize by payment method (simplified)
            if (sale.payment_status === "paid") {
              cashRevenue += sale.total_amount * 0.7; // Assume 70% cash
              cardRevenue += sale.total_amount * 0.3; // Assume 30% card
            }
          } else {
            pendingTransactions++;
          }
        });

        // Sort transactions by timestamp
        transactions.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Take only the most recent 10 transactions
        const recentTransactions = transactions.slice(0, 10);

        // Calculate profit (simplified)
        const totalProfit = totalRevenue * 0.4; // Assume 40% profit margin

        // Calculate current balance (simplified)
        const currentBalance = cashRevenue - totalRevenue * 0.1; // Assume 10% expenses

        setFinancialSummary({
          totalRevenue,
          totalProfit,
          cashRevenue,
          cardRevenue,
          totalExpenses: totalRevenue * 0.1,
          currentBalance,
          pendingTransactions,
        });

        setRecentTransactions(recentTransactions);

        // Generate mock cash flow data for the chart
        const mockCashFlowData = [
          { date: "Mon", cashIn: 4500, cashOut: 1200, balance: 3300 },
          { date: "Tue", cashIn: 5200, cashOut: 1500, balance: 7000 },
          { date: "Wed", cashIn: 4800, cashOut: 1300, balance: 10500 },
          { date: "Thu", cashIn: 6100, cashOut: 1800, balance: 14800 },
          { date: "Fri", cashIn: 7200, cashOut: 2100, balance: 19900 },
          { date: "Sat", cashIn: 6800, cashOut: 1900, balance: 24800 },
        ];

        setCashFlowData(mockCashFlowData);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendUp,
    color = "blue",
  }: {
    icon: React.ComponentType<any>;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: string;
    trendUp?: boolean;
    color?: "blue" | "green" | "orange" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-600">{title}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {subtitle && (
                <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
              )}
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trendUp
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend}%
            </div>
          )}
        </div>
      </div>
    );
  };

  const QuickAction = ({
    icon: Icon,
    label,
    onClick,
    color = "blue",
    disabled = false,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    color?: "blue" | "green" | "orange" | "purple" | "red";
    disabled?: boolean;
  }) => {
    const colorClasses = {
      blue: "border-blue-300 hover:border-blue-500 hover:bg-blue-50",
      green: "border-green-300 hover:border-green-500 hover:bg-green-50",
      orange: "border-orange-300 hover:border-orange-500 hover:bg-orange-50",
      purple: "border-purple-300 hover:border-purple-500 hover:bg-purple-50",
      red: "border-red-300 hover:border-red-500 hover:bg-red-50",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed ${colorClasses[color]} transition-all group w-full disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div
          className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-700 group-hover:text-gray-900">
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Unified Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time financial overview and cashier operations
            </p>
          </div>
          <div className="flex gap-2">
            {["today", "week", "month"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={formatCurrency(financialSummary.totalRevenue)}
            subtitle={`${formatCurrency(financialSummary.totalProfit)} profit`}
            color="blue"
          />
          <StatCard
            icon={Banknote}
            title="Cash Revenue"
            value={formatCurrency(financialSummary.cashRevenue)}
            subtitle="Most transactions"
            color="green"
          />
          <StatCard
            icon={CreditCard}
            title="Card Revenue"
            value={formatCurrency(financialSummary.cardRevenue)}
            subtitle="30% of transactions"
            color="purple"
          />
          <StatCard
            icon={ShoppingCart}
            title="Pending Transactions"
            value={financialSummary.pendingTransactions}
            subtitle="Awaiting completion"
            color="orange"
          />
        </div>

        {/* Quick Cashier Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cashier Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={ShoppingCart}
              label="New Sale"
              onClick={() => alert("Navigate to New Sale")}
              color="green"
            />
            <QuickAction
              icon={Plus}
              label="Add Expense"
              onClick={() => alert("Open Add Expense Modal")}
              color="red"
            />
            <QuickAction
              icon={Printer}
              label="Print Receipt"
              onClick={() => alert("Open Print Dialog")}
              color="blue"
            />
            <QuickAction
              icon={History}
              label="End of Day"
              onClick={() => alert("Open End of Day Reconciliation")}
              color="orange"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cash Flow Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cashIn"
                  name="Cash In"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="cashOut"
                  name="Cash Out"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444" }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Methods
            </h2>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex justify-center space-x-8 mb-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Cash (70%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm">Card (30%)</span>
                  </div>
                </div>
                <div className="relative w-48 h-48 mx-auto">
                  <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-purple-500 clip-path-half"
                    style={{
                      clipPath: "polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)",
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Recent Transactions & Cash Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="p-2 rounded-lg bg-blue-100">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {transaction.customer}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent transactions
                </div>
              )}
            </div>
          </div>

          {/* Cash Operations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cash Operations
            </h2>
            <div className="space-y-4">
              {/* Current Balance */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">
                    Current Balance
                  </span>
                  <span className="text-2xl font-bold text-blue-900">
                    {formatCurrency(financialSummary.currentBalance)}
                  </span>
                </div>
              </div>

              {/* Quick Expense Entry */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Add Quick Expense
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Amount"
                    type="number"
                    className="text-sm"
                  />
                  <Input placeholder="Description" className="text-sm" />
                  <Button size="sm" className="h-9">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* End of Day */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">End of Day</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected Cash:</span>
                    <span className="font-medium">
                      {formatCurrency(financialSummary.cashRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount:</span>
                    <Input
                      placeholder="0.00"
                      type="number"
                      className="w-24 h-7 text-right text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Carry Forward:</span>
                    <span className="font-medium">
                      {formatCurrency(financialSummary.cashRevenue - 100)}{" "}
                      {/* Simplified */}
                    </span>
                  </div>
                  <Button className="w-full mt-2" variant="outline">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Close Day
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
