// "use client";

// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Database,
//   Package,
//   Wrench,
//   DollarSign,
//   HelpCircle,
// } from "lucide-react";

// interface InventoryItem {
//   id: string;
//   item_name: string;
//   phone_brand: string;
//   item_type: string;
//   buying_price: number;
//   selling_price: number;
//   quantity_in_stock?: number;
//   low_stock_threshold?: number;
//   supplier_info?: string;
// }

// interface DashboardContentProps {
//   items: InventoryItem[];
//   loading: boolean;
//   error: string;
//   success: string;
//   onInitDatabase: () => void;
//   onAddTestItem: () => void;
//   onLoadItems: () => void;
//   onDeleteItem: (itemId: string) => void;
// }

// export function DashboardContent({
//   items = [],
//   loading = false,
//   error = "",
//   success = "",
//   onInitDatabase,
//   onAddTestItem,
//   onLoadItems,
//   onDeleteItem,
// }: DashboardContentProps) {
//   const router = useRouter();

//   return (
//     <div className="space-y-6">
//       {/* Status Messages */}
//       {error && (
//         <div className="rounded-lg border border-red-200 bg-red-50 p-4">
//           <div className="flex items-center gap-2">
//             <div className="size-4 rounded-full bg-red-500" />
//             <p className="text-sm font-medium text-red-800">{error}</p>
//           </div>
//         </div>
//       )}

//       {success && (
//         <div className="rounded-lg border border-green-200 bg-green-50 p-4">
//           <div className="flex items-center gap-2">
//             <div className="size-4 rounded-full bg-green-500" />
//             <p className="text-sm font-medium text-green-800">{success}</p>
//           </div>
//         </div>
//       )}

//       {/* Dashboard Cards */}
//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//         {/* Database Status Card */}
//         <div className="rounded-lg border bg-card p-6">
//           <div className="flex items-center gap-4">
//             <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100">
//               <Database className="size-6 text-blue-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold">Database Status</h3>
//               <p className="text-sm text-muted-foreground">
//                 {items.length > 0
//                   ? "Connected & Ready"
//                   : "Needs Initialization"}
//               </p>
//             </div>
//           </div>
//           <div className="mt-4">
//             <Button
//               onClick={onInitDatabase}
//               disabled={loading}
//               className="w-full"
//               variant={items.length > 0 ? "secondary" : "default"}
//             >
//               {loading ? "Initializing..." : "Initialize Database"}
//             </Button>
//           </div>
//         </div>

//         {/* Inventory Overview Card */}
//         <div className="rounded-lg border bg-card p-6">
//           <div className="flex items-center gap-4">
//             <div className="flex size-12 items-center justify-center rounded-lg bg-green-100">
//               <Package className="size-6 text-green-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold">Inventory Items</h3>
//               <p className="text-sm text-muted-foreground">
//                 {items.length} items in database
//               </p>
//             </div>
//           </div>
//           <div className="mt-4 space-y-2">
//             <Button
//               onClick={onAddTestItem}
//               disabled={loading}
//               className="w-full"
//               variant="outline"
//             >
//               {loading ? "Adding..." : "Add Test Item"}
//             </Button>
//             <Button
//               onClick={() => router.push("/inventory")}
//               className="w-full"
//             >
//               Manage Inventory
//             </Button>
//           </div>
//         </div>

//         {/* Repairs Overview Card */}
//         <div className="rounded-lg border bg-card p-6">
//           <div className="flex items-center gap-4">
//             <div className="flex size-12 items-center justify-center rounded-lg bg-orange-100">
//               <Wrench className="size-6 text-orange-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold">Repair Management</h3>
//               <p className="text-sm text-muted-foreground">
//                 Track and manage repairs
//               </p>
//             </div>
//           </div>
//           <div className="mt-4">
//             <Button onClick={() => router.push("/repairs")} className="w-full">
//               Go to Repairs
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Items Table */}
//       {items.length > 0 && (
//         <div className="rounded-lg border bg-card">
//           <div className="border-b p-6">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Inventory Items</h2>
//               <Badge variant="secondary">{items.length} items</Badge>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="border-b bg-muted/50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Item Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Brand
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Stock
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Prices
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border">
//                 {items.map((item) => (
//                   <tr key={item.id} className="hover:bg-muted/50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       {item.item_name}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
//                       {item.phone_brand}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
//                       {item.item_type}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
//                       {item.quantity_in_stock ?? "N/A"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
//                       <div className="flex items-center gap-2">
//                         <DollarSign className="size-3" />
//                         {item.buying_price} / ${item.selling_price}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       <Button
//                         onClick={() => onDeleteItem(item.id)}
//                         disabled={loading}
//                         variant="destructive"
//                         size="sm"
//                       >
//                         Delete
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Getting Started Guide */}
//       <div className="rounded-lg border bg-muted/50 p-6">
//         <h3 className="font-semibold mb-4 flex items-center gap-2">
//           <HelpCircle className="size-5" />
//           Getting Started
//         </h3>
//         <div className="grid gap-4 md:grid-cols-3">
//           <div className="rounded-lg bg-background p-4">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
//                 1
//               </span>
//               <span className="font-medium">Initialize Database</span>
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Set up your database tables to start managing data
//             </p>
//           </div>
//           <div className="rounded-lg bg-background p-4">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-medium">
//                 2
//               </span>
//               <span className="font-medium">Add Test Data</span>
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Add sample items to verify everything is working
//             </p>
//           </div>
//           <div className="rounded-lg bg-background p-4">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="flex size-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
//                 3
//               </span>
//               <span className="font-medium">Start Managing</span>
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Navigate to Inventory or Repairs to start working
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
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

// Sample data - replace with real data from your database
const inventoryData = [
  {
    id: 1,
    name: "iPhone 13 Pro Screen",
    brand: "Apple",
    type: "Screen",
    buyingPrice: 120,
    sellingPrice: 180,
    stock: 5,
    threshold: 10,
  },
  {
    id: 2,
    name: "Samsung S21 Battery",
    brand: "Samsung",
    type: "Battery",
    buyingPrice: 35,
    sellingPrice: 65,
    stock: 2,
    threshold: 5,
  },
  {
    id: 3,
    name: "iPhone 12 Back Glass",
    brand: "Apple",
    type: "Back Glass",
    buyingPrice: 25,
    sellingPrice: 50,
    stock: 15,
    threshold: 8,
  },
  {
    id: 4,
    name: "Xiaomi Mi 11 Screen",
    brand: "Xiaomi",
    type: "Screen",
    buyingPrice: 80,
    sellingPrice: 130,
    stock: 0,
    threshold: 5,
  },
  {
    id: 5,
    name: "iPhone 11 Camera",
    brand: "Apple",
    type: "Camera",
    buyingPrice: 45,
    sellingPrice: 85,
    stock: 8,
    threshold: 6,
  },
];

const repairData = [
  {
    id: 1,
    customer: "John Doe",
    device: "iPhone 13",
    issue: "Screen Replacement",
    status: "In Progress",
    profit: 60,
  },
  {
    id: 2,
    customer: "Jane Smith",
    device: "Samsung S21",
    issue: "Battery",
    status: "Completed",
    profit: 30,
  },
  {
    id: 3,
    customer: "Bob Wilson",
    device: "iPhone 12",
    issue: "Back Glass",
    status: "Pending",
    profit: 25,
  },
  {
    id: 4,
    customer: "Alice Brown",
    device: "Xiaomi Mi 11",
    issue: "Screen",
    status: "In Progress",
    profit: 50,
  },
];

const monthlyData = [
  { month: "Jan", revenue: 4500, profit: 1800, repairs: 12 },
  { month: "Feb", revenue: 5200, profit: 2100, repairs: 15 },
  { month: "Mar", revenue: 4800, profit: 1950, repairs: 14 },
  { month: "Apr", revenue: 6100, profit: 2450, repairs: 18 },
  { month: "May", revenue: 7200, profit: 2900, repairs: 22 },
  { month: "Jun", revenue: 6800, profit: 2700, repairs: 20 },
];

export function DashboardContent() {
  const [timeRange, setTimeRange] = useState("month");

  // Calculate metrics
  const totalInventoryValue = inventoryData.reduce(
    (sum, item) => sum + item.buyingPrice * item.stock,
    0
  );
  const potentialProfit = inventoryData.reduce(
    (sum, item) => sum + (item.sellingPrice - item.buyingPrice) * item.stock,
    0
  );
  const lowStockItems = inventoryData.filter(
    (item) => item.stock <= item.threshold && item.stock > 0
  );
  const outOfStockItems = inventoryData.filter((item) => item.stock === 0);

  const activeRepairs = repairData.filter(
    (r) => r.status !== "Completed"
  ).length;
  const completedRepairs = repairData.filter(
    (r) => r.status === "Completed"
  ).length;
  const pendingRepairs = repairData.filter(
    (r) => r.status === "Pending"
  ).length;

  const currentMonthRevenue = monthlyData[monthlyData.length - 1].revenue;
  const previousMonthRevenue = monthlyData[monthlyData.length - 2].revenue;
  const revenueChange = (
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
    100
  ).toFixed(1);

  // Stock distribution by category
  const stockByType = inventoryData.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + item.stock;
    return acc;
  }, {});

  const pieData = Object.entries(stockByType).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendUp,
    color = "blue",
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

  const QuickAction = ({ icon: Icon, label, onClick, color = "blue" }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed hover:border-${color}-500 hover:bg-${color}-50 transition-all group`}
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-2">
            {["day", "week", "month"].map((range) => (
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Inventory Value"
            value={`$${totalInventoryValue.toLocaleString()}`}
            subtitle={`Potential profit: $${potentialProfit.toLocaleString()}`}
            color="blue"
            trend={undefined}
            trendUp={undefined}
          />
          <StatCard
            icon={TrendingUp}
            title="Monthly Revenue"
            value={`$${currentMonthRevenue.toLocaleString()}`}
            trend={Math.abs(revenueChange)}
            trendUp={parseFloat(revenueChange) > 0}
            color="green"
            subtitle={undefined}
          />
          <StatCard
            icon={Wrench}
            title="Active Repairs"
            value={activeRepairs}
            subtitle={`${completedRepairs} completed this month`}
            color="orange"
            trend={undefined}
            trendUp={undefined}
          />
          <StatCard
            icon={AlertTriangle}
            title="Stock Alerts"
            value={outOfStockItems.length + lowStockItems.length}
            subtitle={`${outOfStockItems.length} out of stock`}
            color="red"
            trend={undefined}
            trendUp={undefined}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={Plus}
              label="Add Inventory"
              onClick={() => alert("Navigate to Add Inventory")}
              color="blue"
            />
            <QuickAction
              icon={Wrench}
              label="New Repair Job"
              onClick={() => alert("Navigate to New Repair")}
              color="orange"
            />
            <QuickAction
              icon={ShoppingCart}
              label="Record Sale"
              onClick={() => alert("Record Sale Modal")}
              color="green"
            />
            <QuickAction
              icon={Users}
              label="Add Supplier"
              onClick={() => alert("Navigate to Add Supplier")}
              color="purple"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Profit Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue & Profit Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
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
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Stock Distribution by Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row - Alerts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Stock Alerts
              </h2>
              <span className="text-sm text-gray-500">
                {outOfStockItems.length + lowStockItems.length} items
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
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
                    <div className="text-sm text-red-600">Out of stock</div>
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
          </div>

          {/* Recent Repairs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Repairs
              </h2>
              <span className="text-sm text-gray-500">
                {repairData.length} active
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {repairData.map((repair) => (
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
                    <div className="text-sm font-medium text-green-600">
                      ${repair.profit}
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        repair.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : repair.status === "In Progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {repair.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
