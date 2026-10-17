"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Wrench,
  DollarSign,
  Download,
  Upload,
  Users,
  ChevronRight,
} from "lucide-react";
import { openTechniciansWindow } from "@/lib/openWindow";
import { useSettings } from "@/context/SettingsContext";
import {
  formatCurrency as formatCurrencyCentralized,
  getLocaleForIntl,
} from "@/lib/formatters";

import RepairForm from "@/components/repairs/RepairForm";
import { RepairTable } from "@/components/repairs/RepairTable";
import { RepairDetail } from "@/components/repairs/RepairDetail";
import { RepairFinancialDialog } from "@/components/repairs/RepairFinancialDialog";
import type { Repair } from "@/types/repair";
import { useRepairContext, RepairProvider } from "@/context/RepairContext";
import {
  OPEN_NEW_REPAIR_EVENT,
  PENDING_NEW_REPAIR_KEY,
} from "@/hooks/useAddRepairShortcut";
import { Icons } from "../icons";

export function RepairsPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
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

  // Global Ctrl/Cmd+Shift+N shortcut: open the form when the event fires
  // while this page is mounted, or consume the pending intent on mount
  // (when the shortcut triggered a navigation from another page).
  useEffect(() => {
    const handleOpenNewRepair = () => {
      try {
        sessionStorage.removeItem(PENDING_NEW_REPAIR_KEY);
      } catch {
        // storage unavailable: the event alone is enough
      }
      openAddForm();
    };

    window.addEventListener(OPEN_NEW_REPAIR_EVENT, handleOpenNewRepair);
    try {
      if (sessionStorage.getItem(PENDING_NEW_REPAIR_KEY)) {
        handleOpenNewRepair();
      }
    } catch {
      // ignore
    }

    return () =>
      window.removeEventListener(OPEN_NEW_REPAIR_EVENT, handleOpenNewRepair);
  }, [openAddForm]);

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
          technicianId: raw.technician_id ?? null,
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

  // ✅ Open technicians details in a dedicated window (native in Tauri,
  // in-app navigation as web fallback)
  const handleOpenTechniciansWindow = useCallback(async () => {
    const opened = await openTechniciansWindow();
    if (!opened) {
      router.push("/technicians");
    }
  }, [router]);

  // ✅ Close dialog cleanup
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setRepairToEdit(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Unified Desktop Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:px-6 sm:py-3.5 rounded-3xl border border-gray-200/70 dark:border-slate-800 shadow-sm">
          {/* Left: Title & Live Financial Pulse Pill */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                {t("repairs.title")}
              </h1>

              {/* Financial Summary Pill */}
              <button
                type="button"
                onClick={() => setIsFinanceOpen(true)}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition-all text-xs font-bold cursor-pointer"
                title={t("repairs.viewFinancialSummary")}
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("repairs.viewFinancialSummary")}</span>
                <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Right: Actions Group */}
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={handleOpenTechniciansWindow}
              className="h-10 px-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <Users className="w-3.5 h-3.5 mr-2" />
              {t("technicians.title")}
            </Button>
            <Button
              variant="outline"
              className="h-10 px-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              {t("common.export")}
            </Button>

            {/* Primary Action: + Add Repair */}
            <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAddForm}
                  className="h-10 px-4 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 text-xs font-black uppercase tracking-wider gap-2 cursor-pointer transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Icons.plusCircle className="h-4 w-4 stroke-[2.5]" />
                  <span>{t("repairs.addRepair")}</span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/15 text-[9px] font-mono font-bold tracking-normal opacity-80">
                    ⇧N
                  </kbd>
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
