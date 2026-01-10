"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEvents } from "@/context/EventContext";
import { invoke } from "@tauri-apps/api/core";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Wrench,
  AlertTriangle,
  Plus,
  CheckCircle,
  RefreshCw,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Clock,
  CheckCircle2,
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

import {
  LineChart,
  Line,
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
import { addExpense, Expense } from "@/lib/api/expense";
import {
  startSession,
  getCurrentSession,
  closeSession,
  getLastSessionClosingBalance,
  DailySession,
} from "@/lib/api/session";
import {
  getRevenueHistory,
  getRevenueBreakdown,
  getDashboardStats,
  RevenueData,
  RevenueBreakdown,
  DashboardStats as DashboardStatsType,
} from "@/lib/api/dashboard";
import { useRouter } from "next/navigation";

// Define transaction types
interface Transaction {
  id: string;
  type: "credit" | "debit";
  category: string;
  amount: number;
  description: string;
  time: string;
  status: string;
}

interface DashboardInventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

interface DashboardRepair {
  id: string;
  customer: string;
  device: string;
  status: string;
  issue: string;
  profit?: number;
}

export function UnifiedCashierDashboard() {
  // State for UI controls
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReason, setExpenseReason] = useState("");
  const [countedAmount, setCountedAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<
    DashboardInventoryItem[]
  >([]);
  const [repairs, setRepairs] = useState<DashboardRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentSession, setCurrentSession] = useState<DailySession | null>(
    null
  );
  const [isStartingDay, setIsStartingDay] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState("");
  const [historyData, setHistoryData] = useState<RevenueData[]>([]);
  const [breakdownData, setBreakdownData] = useState<RevenueBreakdown[]>([]);
  const [dashboardStats, setDashboardStats] =
    useState<DashboardStatsType | null>(null);
  const router = useRouter();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current session
      const session = await getCurrentSession();
      setCurrentSession(session);

      if (!session) {
        // If no session, try to get last closing balance for convenience
        const lastBalance = await getLastSessionClosingBalance();
        setOpeningBalanceInput(lastBalance.toString());
      }

      // 2. Get Inventory (Low stock alerts)
      const dbItems = await invoke<any[]>("get_items");
      const mappedItems: DashboardInventoryItem[] = dbItems.map((item) => ({
        id: item.id,
        name: item.item_name,
        stock: item.quantity_in_stock || 0,
        threshold: item.low_stock_threshold || 0,
      }));
      setInventoryItems(mappedItems);

      // 3. Get Repairs (Active repairs)
      const dbRepairs = await invoke<any[]>("get_repairs");
      const mappedRepairs: DashboardRepair[] = dbRepairs.map((r) => ({
        id: r.id,
        customer: r.customer_name,
        device: `${r.device_brand} ${r.device_model}`,
        status: r.status,
        issue: r.issue_description,
      }));
      setRepairs(mappedRepairs);

      // 4. Get All Session Transactions (Unified)
      const dbTransactions = await invoke<any[]>(
        "get_current_session_transactions"
      );
      const mappedTransactions: Transaction[] = dbTransactions.map((tx) => ({
        id: tx.id,
        type: tx.tx_type as "credit" | "debit",
        category: tx.category,
        amount: tx.amount,
        description: tx.description,
        time: new Date(tx.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: tx.status,
      }));

      setTransactions(mappedTransactions);

      // 5. Get Dashboard Stats & History
      const [stats, history, breakdown] = await Promise.all([
        getDashboardStats(),
        getRevenueHistory(7),
        getRevenueBreakdown(30),
      ]);
      setDashboardStats(stats);
      setHistoryData(history);
      setBreakdownData(breakdown);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { subscribe, unsubscribe, emit } = useEvents();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Memoize the handler to prevent recreation on each render
  const handleFinancialUpdate = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Subscribe to financial events to update dashboard automatically
  useEffect(() => {
    // Subscribe to financial data change events
    subscribe("financial-data-change", handleFinancialUpdate);

    return () => {
      unsubscribe("financial-data-change", handleFinancialUpdate);
    };
  }, [subscribe, unsubscribe, handleFinancialUpdate]);

  // Historical data for the trend chart
  const monthlyData =
    historyData.length > 0
      ? historyData
      : [
          { date: "Jul", revenue: 4200, profit: 1200 },
          { date: "Aug", revenue: 3800, profit: 1100 },
          { date: "Sep", revenue: 5100, profit: 1600 },
          { date: "Oct", revenue: 4800, profit: 1400 },
          { date: "Nov", revenue: 6200, profit: 2100 },
          { date: "Dec", revenue: 7500, profit: 2800 },
        ];

  // Calculate financial metrics
  const totalIn = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalIn - totalOut;
  const openingBalance = currentSession?.opening_balance || 0;
  const expectedCash = openingBalance + netCash;

  // Calculate inventory metrics
  const lowStockItems = inventoryItems.filter(
    (item) => item.stock <= item.threshold && item.stock > 0
  );
  const outOfStockItems = inventoryItems.filter((item) => item.stock === 0);

  // Calculate repair metrics
  const activeRepairs = repairs.filter(
    (r) =>
      r.status === "Pending" ||
      r.status === "In Progress" ||
      r.status === "Waiting for Parts"
  ).length;
  const completedRepairs = repairs.filter(
    (r) => r.status === "Completed" || r.status === "Delivered"
  ).length;

  // Revenue trend
  const revenueChange = dashboardStats?.revenue_change || 0;

  // Handle adding expense
  const handleAddExpense = async () => {
    if (expenseAmount && expenseReason && currentSession) {
      try {
        const amount = parseFloat(expenseAmount);
        await addExpense({
          id: "",
          amount,
          reason: expenseReason,
          date: new Date().toISOString(),
          session_id: currentSession.id,
        });

        // Add to local state for immediate feedback
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: "debit",
          category: "Expense",
          amount,
          description: expenseReason,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "completed",
        };

        setTransactions([newTransaction, ...transactions]);
        setExpenseAmount("");
        setExpenseReason("");

        // Emit event to notify other components of financial change
        emit("financial-data-change");
      } catch (error) {
        console.error("Failed to add expense:", error);
      }
    }
  };

  // Handle start day
  const handleStartDay = async () => {
    try {
      const balance = parseFloat(openingBalanceInput) || 0;
      const session = await startSession(balance);
      setCurrentSession(session);
      fetchDashboardData();
      // Emit event to notify other components of financial change
      emit("financial-data-change");
    } catch (error) {
      alert(`Failed to start session: ${error}`);
    }
  };

  // Handle closing day
  const handleCloseDay = async () => {
    if (countedAmount && withdrawalAmount && currentSession) {
      try {
        const actualCash = parseFloat(countedAmount);
        const payout = parseFloat(withdrawalAmount);
        const discrepancy = actualCash - expectedCash;
        const carryForward = actualCash - payout;

        await closeSession(
          currentSession.id,
          actualCash,
          payout,
          closingNote || `Closure discrepancy: ${formatCurrency(discrepancy)}`
        );

        alert(`Day closed!
Expected: ${formatCurrency(expectedCash)}
Actual: ${formatCurrency(actualCash)}
Discrepancy: ${formatCurrency(discrepancy)}
Payout: ${formatCurrency(payout)}
Carry Forward: ${formatCurrency(carryForward)}`);

        setCurrentSession(null);
        setCountedAmount("");
        setWithdrawalAmount("");
        setClosingNote("");
        fetchDashboardData();

        // Emit event to notify other components of financial change
        emit("financial-data-change");
      } catch (error) {
        alert(`Failed to close session: ${error}`);
      }
    }
  };

  // Refresh transactions
  const handleRefresh = async () => {
    fetchDashboardData();
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendUp,
    color = "blue",
    onClick,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: string | number;
    trendUp?: boolean;
    color?: "blue" | "green" | "orange" | "red";
    onClick?: React.MouseEventHandler<HTMLDivElement>;
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300",
      green:
        "bg-green-100 text-green-600 border-green-200 hover:border-green-300",
      orange:
        "bg-orange-100 text-orange-600 border-orange-200 hover:border-orange-300",
      red: "bg-red-100 text-red-600 border-red-200 hover:border-red-300",
    };

    const bgClasses = {
      blue: "bg-blue-50",
      green: "bg-green-50",
      orange: "bg-orange-50",
      red: "bg-red-50",
    };

    return (
      <Card
        className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
          colorClasses[color].split(" ")[2]
        } ${bgClasses[color]}`}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">
                {title}
              </CardTitle>
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
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${colorClasses[color]
              .split(" ")[1]
              .replace("text-", "text-")}`}
          >
            {value}
          </div>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    );
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Business Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time overview & financial management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 relative">
        {!currentSession && !loading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm px-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-blue-500">
              <CardHeader className="text-center">
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Start Your Day
                </CardTitle>
                <p className="text-gray-500">
                  Initialize the cash drawer to begin
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Opening Cash Balance
                  </label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={openingBalanceInput}
                      onChange={(e) => setOpeningBalanceInput(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 text-lg h-12"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleStartDay}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Session
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="cashier" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Cashier
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Transactions
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={TrendingUp}
                  title="Monthly Revenue"
                  value={formatCurrency(dashboardStats?.total_revenue || 0)}
                  subtitle="Current month"
                  trend={Math.abs(revenueChange)}
                  trendUp={revenueChange > 0}
                  color="green"
                  onClick={() => setActiveTab("transactions")}
                />
                <StatCard
                  icon={DollarSign}
                  title="Net Cash"
                  value={formatCurrency(netCash)}
                  subtitle={`Total Cash: ${formatCurrency(expectedCash)}`}
                  color="blue"
                  onClick={() => setActiveTab("cashier")}
                />
                <StatCard
                  icon={Wrench}
                  title="Active Repairs"
                  value={dashboardStats?.active_repairs || 0}
                  subtitle={`${
                    dashboardStats?.completed_repairs || 0
                  } completed`}
                  color="orange"
                  onClick={() => router.push("/repairs")}
                />
                <StatCard
                  icon={AlertTriangle}
                  title="Stock Alerts"
                  value={dashboardStats?.stock_alerts || 0}
                  subtitle={`${dashboardStats?.out_of_stock || 0} out of stock`}
                  color="red"
                  onClick={() => router.push("/inventory")}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue & Profit Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Revenue & Profit Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6" }}
                          name="Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981" }}
                          name="Profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Breakdown Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {breakdownData.some((b) => b.amount > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={breakdownData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="amount"
                              nameKey="category"
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {breakdownData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => formatCurrency(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No revenue data for this period
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Repairs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-orange-600" />
                        Recent Repairs
                      </CardTitle>
                      <span className="text-sm text-gray-500">
                        {activeRepairs} active
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {repairs
                        .filter(
                          (r) =>
                            r.status !== "Completed" && r.status !== "Delivered"
                        )
                        .slice(0, 5)
                        .map((repair) => (
                          <div
                            key={repair.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                repair.status === "Completed"
                                  ? "bg-green-100"
                                  : repair.status === "In Progress"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              {repair.status === "Completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : repair.status === "In Progress" ? (
                                <Clock className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {repair.customer}
                              </div>
                              <div className="text-sm text-gray-600">
                                {repair.device} - {repair.issue}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  repair.status === "Completed"
                                    ? "default"
                                    : repair.status === "In Progress"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {repair.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Alerts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Stock Alerts
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {outOfStockItems.length + lowStockItems.length} items
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {outOfStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-sm text-red-600">
                            Out of stock
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap">
                          Reorder
                        </button>
                      </div>
                    ))}
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-sm text-amber-600">
                            Low stock: {item.stock} units
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 whitespace-nowrap">
                          Reorder
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cashier Tab */}
            <TabsContent value="cashier" className="space-y-6 mt-6">
              {/* Current Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={TrendingUp}
                  title="Total In"
                  value={formatCurrency(totalIn)}
                  subtitle="All revenue"
                  color="green"
                />
                <StatCard
                  icon={TrendingDown}
                  title="Total Out"
                  value={formatCurrency(totalOut)}
                  subtitle="Expenses"
                  color="red"
                />
                <StatCard
                  icon={DollarSign}
                  title="Net Cash"
                  value={formatCurrency(netCash)}
                  subtitle={`Balance: ${formatCurrency(expectedCash)}`}
                  color="blue"
                />
              </div>

              {/* Quick Actions */}
              <Card className="bg-blue-600 text-white border-none shadow-lg mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-bold">Quick Actions</h2>
                      <p className="text-blue-100 italic">
                        Select an action to perform common tasks quickly
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push("/transactions?mode=sale")}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        New Sale
                      </Button>
                      <Button
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push("/repairs?action=new")}
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        New Repair
                      </Button>
                      <Button
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push("/inventory?action=add")}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
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
                      <p className="text-xs text-muted-foreground mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Opening Balance:</span>
                          <span>{formatCurrency(openingBalance)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Total Revenue (+):</span>
                          <span>{formatCurrency(totalIn)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Total Expenses (-):</span>
                          <span>{formatCurrency(totalOut)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t">
                          <span>Expected Cash:</span>
                          <span>{formatCurrency(expectedCash)}</span>
                        </div>
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

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Today's Transactions
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {lastUpdated && (
                        <span>
                          Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading transactions...</span>
                    </div>
                  ) : (
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
                          {transactions.length > 0 ? (
                            transactions.map((transaction) => (
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
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-8 text-center text-muted-foreground"
                              >
                                No transactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
