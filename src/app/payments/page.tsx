"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { Wallet, Search, Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { UnifiedPayment } from "@/types/payment";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await invoke<UnifiedPayment[]>("get_all_payments");
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error(t("common.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.source_number?.toLowerCase().includes(searchLower) ||
      p.party_name?.toLowerCase().includes(searchLower) ||
      p.method.toLowerCase().includes(searchLower) ||
      p.source_type.toLowerCase().includes(searchLower)
    );
  });

  const totalAmount = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("payments.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("payments.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg py-1 px-3 bg-primary/5 border-primary/20">
            {t("common.total")}: {totalAmount.toLocaleString()}
          </Badge>
          <Button onClick={fetchPayments} variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.searchPlaceholder")}
                className="pl-9 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PaymentTable 
            payments={filteredPayments} 
            loading={loading} 
            onUpdate={fetchPayments} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
