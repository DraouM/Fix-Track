"use client";

import { RepairForm } from "@/components/RepairForm";
import { RepairList } from "@/components/RepairList";
import { Analytics } from "@/components/Analytics";
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
import { useState, useCallback } from "react";
import type { Repair } from "@/types/repair"; // Import Repair type

export default function RepairsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0); // Key to force form re-mount

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setRepairToEdit(null);
  }, []);

  const openAddForm = useCallback(() => {
    setRepairToEdit(null);
    setFormInstanceKey((prevKey) => prevKey + 1); // Increment key to force re-mount for "add new"
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((repair: Repair) => {
    setRepairToEdit(repair);
    // Optionally, you could reset formInstanceKey here or leave it,
    // as repair.id will make the key unique for edits.
    // setFormInstanceKey(0);
    setIsFormOpen(true);
  }, []);

  const handleDialogOpeChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setRepairToEdit(null);
    }
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repair Dashboard</h1>
        <Dialog open={isFormOpen} onOpenChange={handleDialogOpeChange}>
          <DialogTrigger asChild>
            <Button onClick={openAddForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" />
              Add New Repair
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {repairToEdit ? "Edit Repair" : "Add New Repair"}
              </DialogTitle>
              <DialogDescription>
                {repairToEdit
                  ? "Update the details for this repair order."
                  : "Enter the details for the new repair order."}
              </DialogDescription>
            </DialogHeader>
            <RepairForm
              key={
                repairToEdit
                  ? repairToEdit.id
                  : `new-repair-form-${formInstanceKey}`
              }
              onSuccess={handleFormSuccess}
              repairToEdit={repairToEdit}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Analytics />
      <RepairList onEditRepair={openEditForm} />{" "}
      {/* Pass handler to RepairList */}
    </div>
  );
}
