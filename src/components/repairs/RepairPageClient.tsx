"use client";

import { useState, useCallback } from "react";
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

// import { RepairForm } from "@/components/RepairForm";
import { RepairTable } from "@/components/repairs/RepairTable";
// import { Analytics } from "@/components/Analytics";
import type { Repair } from "@/types/repair";

import { RepairProvider } from "@/context/RepairContext";

export function RepairsPageInner() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Repair Dashboard</h1>
        <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={openAddForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" />
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
            {/* <RepairForm
              key={
                repairToEdit
                  ? `edit-${repairToEdit.id}`
                  : `new-repair-${formInstanceKey}`
              }
              repairToEdit={repairToEdit}
              onSuccess={handleFormSuccess}
            /> */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      {/* <Analytics /> */}

      {/* Repairs Table */}
      <RepairTable onEditRepair={openEditForm} />
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
