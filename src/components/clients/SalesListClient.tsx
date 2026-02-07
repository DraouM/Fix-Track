"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Eye, FileText, CheckCircle2, AlertCircle, Clock, Plus,
  TrendingUp, RefreshCcw, ShoppingCart as SalesIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientContext } from "@/context/ClientContext";
import { useRouter } from "next/navigation";
import { getSales } from "@/lib/api/sales";
import type { Sale } from "@/types/sale";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { toast } from "sonner";

export function SalesListClient() {
  const router = useRouter();
  const { clients } = useClientContext();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const data = await getSales(filter);
      setSales(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const filteredSales = sales.filter(sale => {
    const client = clients.find(c => c.id === sale.client_id);
    const clientName = client?.name.toLowerCase() || "";
    const saleNumber = sale.sale_number.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return clientName.includes(search) || saleNumber.includes(search);
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "draft": return "secondary";
      default: return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "partial": return "warning";
      case "unpaid": return "destructive";
      default: return "outline";
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <SalesIcon className="w-8 h-8 text-blue-600" />
              Sales History
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage all customer sales and transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={fetchSales} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => router.push("/sales/new")} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Plus className="mr-2 h-4 w-4" /> New Sale
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={SalesIcon}
            title="Total Sales"
            value={sales.length}
            subtitle={`${sales.filter(s => s.status === "completed").length} completed`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="Completed"
            value={sales.filter(s => s.status === "completed").length}
            subtitle="Successfully closed"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Revenue"
            value={formatCurrency(sales.reduce((sum, s) => sum + s.total_amount, 0))}
            subtitle="Gross income"
            color="purple"
          />
          <StatCard
            icon={AlertCircle}
            title="Unpaid Amount"
            value={formatCurrency(sales.reduce((sum, s) => sum + (s.total_amount - s.paid_amount), 0))}
            subtitle="Pending collection"
            color="red"
          />
        </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-0 border-b border-gray-100 mb-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sale # or customer..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" className="w-[300px]" onValueChange={setStatusFilter}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Loading sales history...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold">{sale.sale_number}</TableCell>
                      <TableCell className="text-xs">{formatDate(sale.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        {clients.find(c => c.id === sale.client_id)?.name || "Unknown Client"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(sale.status) as any} className="capitalize">
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusBadgeVariant(sale.payment_status) as any} className="capitalize">
                          {sale.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-base">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/sales/detail?id=${sale.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      <SalesIcon className="h-10 w-10 mx-auto mb-2 opacity-10" />
                      <p>No sales records found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
