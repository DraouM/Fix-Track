"use client";

import { useState, useCallback, useMemo } from "react";
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
import type { Repair } from "@/types/repair";
import { useRepairContext } from "@/context/RepairContext";

import { RepairProvider } from "@/context/RepairContext";

export function RepairsPageInner() {
  const { repairs } = useRepairContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
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
  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setRepairToEdit(null);
  }, []);

  // ✅ Open Add New form
  const openAddForm = useCallback(() => {
    setRepairToEdit(null);
    setFormInstanceKey((prevKey) => prevKey + 1); // force remount for a clean form
    setIsFormOpen(true);
  }, []);

  // ✅ Open Edit form
  const openEditForm = useCallback((repair: Repair) => {
    setRepairToEdit(repair);
    setIsFormOpen(true);
  }, []);

  // ✅ Close dialog cleanup
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setRepairToEdit(null);
    }
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600" />
              Repairs
            </h1>
            <p className="text-gray-600 mt-1">
              Manage repair orders and track customer service
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAddForm}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Icons.plusCircle className="w-4 h-4" />
                  Add Repair
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {repairToEdit ? "Edit Repair" : "New Repair"}
                  </DialogTitle>
                  <DialogDescription>
                    {repairToEdit
                      ? "Update details for this repair order."
                      : "Fill in the details for a new repair order."}
                  </DialogDescription>
                </DialogHeader>
                <RepairForm
                  key={
                    repairToEdit
                      ? `edit-${repairToEdit.id}`
                      : `new-repair-${formInstanceKey}`
                  }
                  repairToEdit={repairToEdit}
                  onSuccess={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Wrench}
            title="Total Repairs"
            value={statistics.total}
            subtitle={`${statistics.completed} completed`}
            color="blue"
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={statistics.inProgress}
            subtitle={`${statistics.pending} pending`}
            color="orange"
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={formatCurrency(statistics.totalRevenue)}
            subtitle="From completed repairs"
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            title="Outstanding"
            value={formatCurrency(statistics.pendingRevenue)}
            subtitle={`${statistics.unpaidCount} unpaid repairs`}
            color="red"
          />
        </div>

        {/* Repairs Table */}
        <RepairTable onEditRepair={openEditForm} />
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
