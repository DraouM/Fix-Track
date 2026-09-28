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
import { Wrench, DollarSign, Download, Upload } from "lucide-react";

import RepairForm from "@/components/repairs/RepairForm";
import { RepairTable } from "@/components/repairs/RepairTable";
import { RepairDetail } from "@/components/repairs/RepairDetail";
import { RepairFinancialDialog } from "@/components/repairs/RepairFinancialDialog";
import type { Repair } from "@/types/repair";
import { useRepairContext, RepairProvider } from "@/context/RepairContext";

export function RepairsPageInner() {
  const { t } = useTranslation();
  const { repairs } = useRepairContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [createdRepair, setCreatedRepair] = useState<Repair | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);

  // Header counters (financial stats live in the Financial Overview dialog)
  const statistics = useMemo(() => {
    const total = repairs.length;
    const inProgress = repairs.filter((r) => r.status === "In Progress").length;

    return {
      total,
      inProgress,
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
          cost: p.cost, // mapped via serde rename "cost" in backend
          quantity: p.quantity,
          part_id: p.part_id,
        }));

        const mappedPayments = (raw.payments || []).map((p: any) => ({
          id: p.id,
          repair_id: p.repair_id, // interface uses snake_case for repair_id in some places, keeping as is
          amount: p.amount,
          date: p.date,
          method: p.method,
          received_by: p.received_by,
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
          totalPaid: mappedPayments.reduce(
            (sum: number, p: any) => sum + (p.amount || 0),
            0,
          ),
          remainingBalance:
            raw.estimated_cost -
            mappedPayments.reduce(
              (sum: number, p: any) => sum + (p.amount || 0),
              0,
            ),
        };

        console.log("Mapped full repair details:", mappedRepair);
        setRepairToEdit(mappedRepair);
      }
    } catch (error) {
      console.error("Failed to fetch full repair details:", error);
      // We already set the partial repair, so it will just show that if fetch fails
      toast.error(
        "Failed to load full repair details. Some information might be missing.",
      );
    }
  }, []);

  // ✅ Close dialog cleanup
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setRepairToEdit(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t("repairs.title")}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                  <span className="text-xs font-black">{statistics.total}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {t("repairs.totalRepairs")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50">
                  <span className="text-xs font-black">
                    {statistics.inProgress}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {t("repairs.inprogress")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFinanceOpen(true)}
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {t("repairs.viewFinancialSummary")}
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("common.export")}
            </Button>
            <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAddForm}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest"
                >
                  <Icons.plusCircle className="mr-2 h-4 w-4" />
                  {t("repairs.addRepair")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
                <DialogHeader className="pb-6 border-b dark:border-slate-800">
                  <DialogTitle className="text-2xl font-black">
                    {repairToEdit
                      ? t("repairs.editRepair")
                      : t("repairs.newRepair")}
                  </DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    {repairToEdit
                      ? t("repairs.editDesc") ||
                        "Update details for this repair order."
                      : t("repairs.addDesc") ||
                        "Fill in the details for a new repair order."}
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

        {/* Repairs Table */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <RepairTable onEditRepair={openEditForm} />
          </div>
        </div>

        {/* Financial Overview Popup */}
        <RepairFinancialDialog
          open={isFinanceOpen}
          onOpenChange={setIsFinanceOpen}
        />

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
