
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
import { useState } from 'react'; 

export default function RepairsPage() { // Renamed Home to RepairsPage for clarity
  const [isFormOpen, setIsFormOpen] = useState(false); 

  const handleFormSuccess = () => {
    setIsFormOpen(false); 
  };

  return (
    // Removed container mx-auto p-4 as AppLayout might handle this.
    // If not, it can be re-added here or within AppLayout's SidebarInset.
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repair Dashboard</h1>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}> 
          <DialogTrigger asChild>
             <Button>
                <Icons.plusCircle className="mr-2 h-4 w-4" />
                Add New Repair
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Add New Repair</DialogTitle>
              <DialogDescription>
                Enter the details for the new repair order.
              </DialogDescription>
            </DialogHeader>
            <RepairForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      <Analytics />
      <RepairList />
    </div>
  );
}
