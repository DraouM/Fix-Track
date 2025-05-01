
'use client'; // Add 'use client' directive

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
import { useState } from 'react'; // Import useState

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false); // State to control dialog

  const handleFormSuccess = () => {
    setIsFormOpen(false); // Close dialog on successful submission
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Phone Repair Tracker</h1>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}> {/* Control dialog with state */}
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
             {/* Pass onSuccess handler to close dialog */}
            <RepairForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      <Analytics />
      {/* Removed static RepairForm from here */}
      <RepairList />
    </div>
  );
}
