'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Repair } from '@/types/repair'; // Import shared type
import { format } from 'date-fns'; // For date formatting

interface RepairDetailProps {
  repair: Repair | null; // Allow null for when no repair is selected
  onClose: () => void;
}

export function RepairDetail({ repair, onClose }: RepairDetailProps) {

  const handlePrint = () => {
    // Basic print functionality. More advanced receipt generation might need a dedicated library or service.
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      const printWindow = window.open('', '', 'height=600,width=800');

      if (printWindow) {
        printWindow.document.write('<html><head><title>Repair Receipt</title>');
        // Optionally link to your global CSS or add specific print styles
        printWindow.document.write('<link rel="stylesheet" href="/globals.css" type="text/css" />'); // Adjust path if necessary
        printWindow.document.write('<style> @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 20px; } #print-button { display: none; } } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus(); // Necessary for some browsers
        // Use timeout to ensure content is loaded before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250); // Adjust delay if needed
      } else {
         alert("Could not open print window. Please check your browser's popup settings.");
      }
    }
  };


   if (!repair) {
    return null; // Don't render the dialog if no repair is selected
  }

  return (
    <Dialog open={!!repair} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        {/* Content specifically for printing */}
        <div id="receipt-content" className="print:block hidden"> {/* Hidden by default, shown only for printing */}
            <h2 className="text-xl font-bold mb-2">Repair Receipt</h2>
            <p><strong>Repair ID:</strong> {repair.id}</p>
            <Separator className="my-2" />
            <p><strong>Customer:</strong> {repair.customerName}</p>
            <p><strong>Phone:</strong> {repair.phoneNumber}</p>
             <Separator className="my-2" />
            <p><strong>Device:</strong> {repair.deviceBrand} {repair.deviceModel}</p>
            <p><strong>Issue:</strong> {repair.issueDescription}</p>
             <Separator className="my-2" />
            <p><strong>Date Received:</strong> {format(new Date(repair.dateReceived), 'PPP p')}</p>
            <p><strong>Status:</strong> {repair.repairStatus}</p>
            <p><strong>Estimated Cost:</strong> ${repair.estimatedCost}</p>
             <Separator className="my-2" />
             <p className="text-xs text-muted-foreground mt-4">Thank you for your business!</p>
        </div>

         {/* Visible Dialog Content */}
        <div className="print:hidden"> {/* Hide this section when printing */}
          <DialogHeader>
            <DialogTitle>Repair Details</DialogTitle>
            <DialogDescription>
              Full details for repair ID: {repair.id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6"> {/* Added ScrollArea */}
            <div className="grid gap-4 py-4">
              <DetailItem label="Customer Name" value={repair.customerName} />
              <DetailItem label="Phone Number" value={repair.phoneNumber} />
              <Separator />
              <DetailItem label="Device Brand" value={repair.deviceBrand} />
              <DetailItem label="Device Model" value={repair.deviceModel} />
              <DetailItem label="Issue Description" value={repair.issueDescription} isTextarea />
              <Separator />
              <DetailItem label="Estimated Cost" value={`$${repair.estimatedCost}`} />
               <DetailItem label="Date Received" value={format(new Date(repair.dateReceived), 'PPP p')} />
              <DetailItem label="Current Status" value={repair.repairStatus} />

              {/* Status History */}
              {repair.statusHistory && repair.statusHistory.length > 0 && (
                <>
                  <Separator />
                  <h4 className="text-sm font-medium mt-2 mb-1">Status History</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    {repair.statusHistory.map((history, index) => (
                      <li key={index}>
                        <strong>{history.status}</strong> - {format(new Date(history.timestamp), 'PP p')}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button id="print-button" onClick={handlePrint}>Print Receipt</Button>
             <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
         </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for displaying detail items
interface DetailItemProps {
  label: string;
  value: string;
  isTextarea?: boolean;
}

function DetailItem({ label, value, isTextarea = false }: DetailItemProps) {
  return (
    <div className="grid grid-cols-3 items-start gap-4">
      <label className="text-sm font-medium text-right pt-1">{label}</label>
      {isTextarea ? (
        <p className="col-span-2 text-sm min-h-[40px] break-words whitespace-pre-wrap bg-muted/30 p-2 rounded-md border border-input">
          {value}
        </p>
      ) : (
        <p className="col-span-2 text-sm pt-1">{value}</p>
      )}
    </div>
  );
}
