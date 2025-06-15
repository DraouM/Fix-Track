
'use client';

import React, { useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Repair } from '@/types/repair';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge'; // Import Badge

interface RepairDetailProps {
  repair: Repair | null;
  onClose: () => void;
}

export function RepairDetail({ repair, onClose }: RepairDetailProps) {

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Repair Receipt</title>');
        printWindow.document.write('<link rel="stylesheet" href="/globals.css" type="text/css" media="print" />');
        printWindow.document.write('<style> @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 20px; } #print-button, .no-print { display: none !important; } .print-only-block { display: block !important; } .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .print-table th, .print-table td { border: 1px solid #ccc; padding: 8px; text-align: left; } .print-table th { background-color: #f2f2f2; } } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      } else {
         alert("Could not open print window. Please check your browser's popup settings.");
      }
    }
  };

  const totalPartsCost = useMemo(() => {
    if (!repair || !repair.usedParts) return 0;
    return repair.usedParts.reduce((total, part) => total + (part.unitCost * part.quantity), 0);
  }, [repair]);

   if (!repair) {
    return null;
  }

  const estimatedCostValue = parseFloat(repair.estimatedCost) || 0;
  const profitExcludingParts = estimatedCostValue - totalPartsCost;

  return (
    <Dialog open={!!repair} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <div id="receipt-content" className="print-only-block hidden">
            <h2 className="text-xl font-bold mb-2">FixTrack - Repair Receipt</h2>
            <p><strong>Repair ID:</strong> {repair.id}</p>
            <Separator className="my-2" />
            <p><strong>Customer:</strong> {repair.customerName}</p>
            <p><strong>Phone:</strong> {repair.phoneNumber}</p>
            <Separator className="my-2" />
            <p><strong>Device:</strong> {repair.deviceBrand} {repair.deviceModel}</p>
            <p><strong>Issue:</strong> {repair.issueDescription}</p>
            <Separator className="my-2" />
            <p><strong>Date Received:</strong> {format(new Date(repair.dateReceived), 'PPP p')}</p>
            <p><strong>Repair Status:</strong> {repair.repairStatus}</p>
            <p><strong>Payment Status:</strong> {repair.paymentStatus}</p> {/* Added Payment Status for print */}

            {repair.usedParts && repair.usedParts.length > 0 && (
              <>
                <h4 className="text-sm font-medium mt-3 mb-1">Parts Used:</h4>
                <table className="print-table">
                  <thead>
                    <tr><th>Part Name</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {repair.usedParts.map(part => (
                      <tr key={part.partId}>
                        <td>{part.name}</td>
                        <td>{part.quantity}</td>
                        <td>${part.unitCost.toFixed(2)}</td>
                        <td>${(part.unitCost * part.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1"><strong>Total Parts Cost:</strong> ${totalPartsCost.toFixed(2)}</p>
              </>
            )}
            <Separator className="my-2" />
            <p><strong>Total Estimated Repair Cost:</strong> ${estimatedCostValue.toFixed(2)}</p>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground mt-4">Thank you for your business!</p>
        </div>

        <div className="no-print">
          <DialogHeader>
            <DialogTitle>Repair Details</DialogTitle>
            <DialogDescription>
              Full details for repair ID: {repair.id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="grid gap-4 py-4">
              <DetailItem label="Customer Name" value={repair.customerName} />
              <DetailItem label="Phone Number" value={repair.phoneNumber} />
              <Separator />
              <DetailItem label="Device Brand" value={repair.deviceBrand} />
              <DetailItem label="Device Model" value={repair.deviceModel} />
              <DetailItem label="Issue Description" value={repair.issueDescription} isTextarea />
              <Separator />
              <DetailItem label="Quoted/Estimated Cost" value={`$${estimatedCostValue.toFixed(2)}`} />
              <DetailItem label="Date Received" value={format(new Date(repair.dateReceived), 'PPP p')} />
              <DetailItem label="Current Repair Status" value={repair.repairStatus} />
              <DetailItem label="Payment Status" value={repair.paymentStatus} /> {/* Added Payment Status for display */}

              {repair.usedParts && repair.usedParts.length > 0 && (
                <>
                  <Separator />
                  <h4 className="text-sm font-medium mt-2 mb-1">Parts Used</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repair.usedParts.map(part => (
                        <TableRow key={part.partId}>
                          <TableCell>{part.name}</TableCell>
                          <TableCell className="text-right">{part.quantity}</TableCell>
                          <TableCell className="text-right">${part.unitCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(part.unitCost * part.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right font-semibold">Total Parts Cost: ${totalPartsCost.toFixed(2)}</div>
                   <div className="text-right font-semibold text-primary">Estimated Profit (Excl. Labor): ${profitExcludingParts.toFixed(2)}</div>
                </>
              )}

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
