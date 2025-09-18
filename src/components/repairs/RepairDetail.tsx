"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRepairActions } from "@/context/RepairContext"; // ✅ context
import { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { Printer } from "lucide-react";

interface RepairDetailProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepairDetail({
  repair,
  open,
  onOpenChange,
}: RepairDetailProps) {
  const { updateRepairStatus, updatePaymentStatus } = useRepairActions();

  if (!repair) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-repair");
    if (!printContent) return;
    const newWin = window.open("", "_blank");
    if (!newWin) return;
    newWin.document.write(`
      <html>
        <head>
          <title>Repair Receipt</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    newWin.document.close();
    newWin.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Repair Details</DialogTitle>
          <DialogDescription>
            Detailed view of repair order #{repair.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div id="printable-repair" className="space-y-6">
            {/* Customer Info */}
            <div>
              <h2 className="text-lg font-semibold">Customer</h2>
              <p>
                {repair.customerName} — {repair.customerPhone}
              </p>
            </div>

            {/* Device Info */}
            <div>
              <h2 className="text-lg font-semibold">Device</h2>
              <p>
                {repair.deviceBrand} {repair.deviceModel}
              </p>
              <p className="text-muted-foreground">{repair.issueDescription}</p>
            </div>

            {/* Status + Payment (Editable) */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Status</h2>
              <div className="flex gap-4 items-center">
                {/* Repair Status */}
                <div>
                  <span className="block text-sm text-muted-foreground mb-1">
                    Repair Status
                  </span>
                  <Select
                    value={repair.status}
                    onValueChange={(val) =>
                      updateRepairStatus(repair.id, val as RepairStatus)
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status */}
                <div>
                  <span className="block text-sm text-muted-foreground mb-1">
                    Payment Status
                  </span>
                  <Select
                    value={repair.paymentStatus}
                    onValueChange={(val) =>
                      updatePaymentStatus(repair.id, val as PaymentStatus)
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partially Paid">
                        Partially Paid
                      </SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            {/* <div>
              <h2 className="text-lg font-semibold mb-2">Financials</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Estimated Cost</td>
                    <td>${repair.estimatedCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Final Cost</td>
                    <td>${repair.finalCost?.toFixed(2) ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Paid Amount</td>
                    <td>${repair.paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Profit</td>
                    <td className="font-semibold text-green-600">
                      ${(repair.finalCost ?? 0) - (repair.partsCost ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div> */}

            <Separator />

            {/* Notes */}
            <div>
              <h2 className="text-lg font-semibold">Notes</h2>
              {/* <p className="text-muted-foreground">
                {repair.notes || "No additional notes"}
              </p> */}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
