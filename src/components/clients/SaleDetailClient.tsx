"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ShoppingCart, User, Clock, 
  CheckCircle2, AlertCircle, DollarSign, 
  FileText, History, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSaleById } from "@/lib/api/sales";
import type { SaleWithDetails } from "@/types/sale";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SaleDetailClientProps {
  saleId: string;
}

export function SaleDetailClient({ saleId }: SaleDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState<SaleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSaleById(saleId);
        setData(result);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch sale details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [saleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading sale details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Sale not found.</p>
        <Button variant="link" onClick={() => router.push("/sales")}>Back to Sales</Button>
      </div>
    );
  }

  const { sale, items, payments, client_name } = data;

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

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Sale {sale.sale_number}</h1>
              <Badge variant={getStatusBadgeVariant(sale.status) as any} className="capitalize py-1 px-3">
                {sale.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Created on {formatDate(sale.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
          {sale.status === "draft" && (
            <Button className="bg-primary hover:bg-primary/90">
              Complete Sale
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Sale Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(item.total_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-6 border-t bg-muted/10 space-y-2">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Total Items Area:</span>
                 <span className="font-medium">{items.length} positions</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-lg font-bold">Total Amount:</span>
                 <span className="text-2xl font-bold text-primary">{formatCurrency(sale.total_amount)}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => router.push(`/clients/${sale.client_id}`)}>
                <span className="font-bold text-base">{client_name}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Customer Profile</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase">Payment Status</span>
                    <Badge variant={getPaymentStatusBadgeVariant(sale.payment_status) as any} className="capitalize text-[10px] px-2 py-0">
                      {sale.payment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Paid Amount:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(sale.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Remaining:</span>
                    <span className="text-lg font-bold text-destructive">
                      {formatCurrency(sale.total_amount - sale.paid_amount)}
                    </span>
                  </div>
               </div>
               
               {payments.length > 0 && (
                 <div className="space-y-2 pt-4 border-t border-primary/10">
                   <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                     <History className="h-3 w-3" /> Payment History
                   </p>
                   {payments.map(p => (
                     <div key={p.id} className="flex justify-between items-center p-2 rounded bg-white/50 border border-primary/5">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold">{p.method}</span>
                         <span className="text-[10px] text-muted-foreground">{formatDate(p.date)}</span>
                       </div>
                       <span className="text-sm font-bold text-green-700">{formatCurrency(p.amount)}</span>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>

          {sale.notes && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground italic">&quot;{sale.notes}&quot;</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
