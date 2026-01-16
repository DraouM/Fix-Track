"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import {
  Wrench,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Upload,
} from "lucide-react";

import RepairForm from "@/components/repairs/RepairForm";
import { RepairTable } from "@/components/repairs/RepairTable";
import { RepairDetail } from "@/components/repairs/RepairDetail";
import type { Repair } from "@/types/repair";
import { useRepairContext, RepairProvider } from "@/context/RepairContext";
  
import {  useSettings } from "@/context/SettingsContext";
import { formatCurrency as formatCurrencyCentralized, getLocaleForIntl } from "@/lib/formatters";

export function RepairsPageInner() {
  const { t, i18n } = useTranslation();
  const { repairs } = useRepairContext();
  const { settings } = useSettings();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [createdRepair, setCreatedRepair] = useState<Repair | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = repairs.length;
    const completed = repairs.filter(
      (r) => r.status === "Completed" || r.status === "Delivered"
    ).length;
    const inProgress = repairs.filter((r) => r.status === "In Progress").length;
    const pending = repairs.filter((r) => r.status === "Pending").length;

    const totalRevenue = repairs.reduce(
      (sum, r) => sum + (r.totalPaid || 0),
      0
    );

    const pendingRevenue = repairs.reduce(
      (sum, r) => sum + (r.remainingBalance || 0),
      0
    );

    const unpaidCount = repairs.filter(
      (r) => r.paymentStatus === "Unpaid"
    ).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      totalRevenue,
      pendingRevenue,
      unpaidCount,
    };
  }, [repairs]);

  // ✅ Called when form succeeds
  const handleFormSuccess = useCallback((repair?: Repair) => {
    setIsFormOpen(false);
    setRepairToEdit(null);
    if (repair) {
      setCreatedRepair(repair);
    }
  }, []);

  // ✅ Open Add New form
  const openAddForm = useCallback(() => {
    setRepairToEdit(null);
    setFormInstanceKey((prevKey) => prevKey + 1); // force remount for a clean form
    setIsFormOpen(true);
  }, []);

  // ✅ Open Edit form
  const openEditForm = useCallback(async (repair: Repair) => {
    // Set partial data first to show form immediately
    setRepairToEdit(repair);
    setIsFormOpen(true);

    try {
      // Fetch full details including parts and payments
      // We use the direct invoke here to get the data without affecting global selection state necessarily
      // although updating the context would also be fine.
      const fullRepair = await invoke<Repair | null>("get_repair_by_id", {
        repairId: repair.id,
      });

      if (fullRepair) {
        console.log("Fetched full repair details (raw):", fullRepair);
        
        // Manual mapping because backend returns snake_case keys (RepairDb) 
        // but frontend expects camelCase (Repair)
        // casting to any to avoid TS shouting about snake_case properties accessing
        const raw = fullRepair as any;

        const mappedParts = (raw.used_parts || []).map((p: any) => ({
          id: p.id,
          repairId: p.repair_id,
          partName: p.part_name, // Map part_name -> partName
          cost: p.cost,          // mapped via serde rename "cost" in backend
          quantity: p.quantity,
          part_id: p.part_id,
        }));

        const mappedPayments = (raw.payments || []).map((p: any) => ({
          id: p.id,
          repair_id: p.repair_id, // interface uses snake_case for repair_id in some places, keeping as is
          amount: p.amount,
          date: p.date,
          method: p.method,
          received_by: p.received_by
        }));

        const mappedRepair: Repair = {
           id: raw.id,
           customerName: raw.customer_name,
           customerPhone: raw.customer_phone,
           deviceBrand: raw.device_brand,
           deviceModel: raw.device_model,
           issueDescription: raw.issue_description,
           estimatedCost: raw.estimated_cost,
           status: raw.status,
           paymentStatus: raw.payment_status,
           usedParts: mappedParts,
           payments: mappedPayments,
           history: raw.history || [], // History might also need mapping if used, but critical path is parts
           createdAt: raw.created_at,
           updatedAt: raw.updated_at,
           code: raw.code,
           // Recalculate totals if needed
           totalPaid: mappedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
           remainingBalance: raw.estimated_cost - mappedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        };

        console.log("Mapped full repair details:", mappedRepair);
        setRepairToEdit(mappedRepair);
      }
    } catch (error) {
      console.error("Failed to fetch full repair details:", error);
      // We already set the partial repair, so it will just show that if fetch fails
      toast.error("Failed to load full repair details. Some information might be missing.");
    }
  }, []);

  // ✅ Close dialog cleanup
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setRepairToEdit(null);
    }
  }, []);

  const formatCurrency = (value: number) =>
    formatCurrencyCentralized(value, settings.currency, getLocaleForIntl(i18n.language));

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
    trend,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple";
    trend?: number;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      orange: "bg-orange-50 text-orange-600",
      red: "bg-red-50 text-red-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</span>
          </div>
          {typeof trend === 'number' && (
            <div className={`flex items-center gap-1 text-[10px] font-black ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 && 'rotate-180'}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-foreground">{value}</div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70">
              <div className={`h-1 w-1 rounded-full ${colorClasses[color].replace('text-', 'bg-')}`}></div>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t('repairs.title')}
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                {t('repairs.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('common.export')}
              </Button>
            <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAddForm}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest"
                >
                  <Icons.plusCircle className="mr-2 h-4 w-4" />
                  {t('repairs.addRepair')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                <DialogHeader className="pb-6 border-b">
                  <DialogTitle className="text-2xl font-black">
                    {repairToEdit ? t('repairs.editRepair') : t('repairs.newRepair')}
                  </DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    {repairToEdit
                      ? t('repairs.editDesc') || "Update details for this repair order."
                      : t('repairs.addDesc') || "Fill in the details for a new repair order."}
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-6">
                  <RepairForm
                    key={
                      repairToEdit
                        ? `edit-${repairToEdit.id}`
                        : `new-repair-${formInstanceKey}`
                    }
                    repairToEdit={repairToEdit}
                    onSuccess={handleFormSuccess}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Wrench}
            title={t('repairs.totalRepairs')}
            value={statistics.total}
            subtitle={t('common.completedCount', { count: statistics.completed }) || `${statistics.completed} completed`}
            color="blue"
          />
          <StatCard
            icon={Clock}
            title={t('repairs.inprogress')}
            value={statistics.inProgress}
            subtitle={t('common.pendingCount', { count: statistics.pending }) || `${statistics.pending} pending`}
            color="orange"
          />
          <StatCard
            icon={DollarSign}
            title={t('repairs.totalRevenue')}
            value={formatCurrency(statistics.totalRevenue)}
            subtitle={t('repairs.completed')}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            title={t('repairs.outstanding')}
            value={formatCurrency(statistics.pendingRevenue)}
            subtitle={t('repairs.unpaidCount', { count: statistics.unpaidCount }) || `${statistics.unpaidCount} unpaid`}
            color="red"
          />
        </div>

        {/* Repairs Table */}
        <div className="space-y-4">
             <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary"></div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t('repairs.historyLogs')}</h2>
             </div>
             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <RepairTable onEditRepair={openEditForm} />
             </div>
        </div>

        {/* Created Repair Detail View */}
        {createdRepair && (
          <RepairDetail
            repair={createdRepair}
            open={!!createdRepair}
            onOpenChange={(isOpen) => {
              if (!isOpen) setCreatedRepair(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function RepairsPageClient() {
  return (
    <RepairProvider>
      <RepairsPageInner />
    </RepairProvider>
  );
}
