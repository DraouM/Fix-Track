
'use client'; 

import { RepairForm } from '@/components/RepairForm';
import { RepairList } from '@/components/RepairList';
import { Analytics } from '@/components/Analytics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { useState, useCallback } from 'react'; 
import type { Repair } from '@/types/repair'; // Import Repair type

export default function RepairsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setRepairToEdit(null); // Clear item being edited
  }, []);

  const openAddForm = () => {
    setRepairToEdit(null); // Ensure we are adding, not editing
    setIsFormOpen(true);
  }

  const openEditForm = useCallback((repair: Repair) => {
    setRepairToEdit(repair);
    setIsFormOpen(true);
  }, []);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repair Dashboard</h1>
         <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setRepairToEdit(null); // Clear edit state if dialog is closed
         }}> 
          <DialogTrigger asChild>
             <Button onClick={openAddForm}>
                <Icons.plusCircle className="mr-2 h-4 w-4" />
                Add New Repair
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto"> {/* Increased width for parts & added scroll */}
            <DialogHeader>
              <DialogTitle>{repairToEdit ? 'Edit Repair' : 'Add New Repair'}</DialogTitle>
              <DialogDescription>
                {repairToEdit ? 'Update the details for this repair order.' : 'Enter the details for the new repair order.'}
              </DialogDescription>
            </DialogHeader>
            <RepairForm 
              key={repairToEdit ? repairToEdit.id : 'new-repair-form'} 
              onSuccess={handleFormSuccess} 
              repairToEdit={repairToEdit} 
            />
          </DialogContent>
        </Dialog>
      </div>
      <Analytics />
      <RepairList onEditRepair={openEditForm} /> {/* Pass handler to RepairList */}
    </div>
  );
}

