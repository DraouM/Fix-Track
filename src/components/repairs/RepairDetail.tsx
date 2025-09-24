"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRepairActions, useRepairContext } from "@/context/RepairContext";
import { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import {
  Printer,
  User,
  Smartphone,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Calendar,
  Phone,
} from "lucide-react";
import { RepairPaymentForm } from "./RepairPaymentForm";

interface RepairDetailProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: RepairStatus) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPaymentStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "Partially Paid":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Unpaid":
      return "bg-red-100 text-red-800 border-red-200";
    case "Refunded":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status: RepairStatus) => {
  switch (status) {
    case "Pending":
      return <Clock className="h-4 w-4" />;
    case "In Progress":
      return <Loader className="h-4 w-4" />;
    case "Completed":
      return <CheckCircle className="h-4 w-4" />;
    case "Delivered":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <XCircle className="h-4 w-4" />;
  }
};

export function RepairDetail({
  repair,
  open,
  onOpenChange,
}: RepairDetailProps) {
  const { updateRepairStatus, updatePaymentStatus } = useRepairActions();
  const { getItemById } = useRepairContext();

  // Get the most up-to-date repair data from context
  const currentRepair = repair ? getItemById(repair.id) || repair : null;

  if (!currentRepair) return null;

  // At this point, currentRepair is guaranteed to be non-null
  const repairData: Repair = currentRepair;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-repair");
    if (!printContent) return;
    const newWin = window.open("", "_blank");
    if (!newWin) return;
    newWin.document.write(`
      <html>
        <head>
          <title>Repair Receipt - Order #${repairData.id}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 20px; 
              line-height: 1.4; 
              color: #000;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
            }
            .section { margin-bottom: 20px; }
            .section h3 { 
              margin: 0 0 10px 0; 
              font-size: 16px; 
              font-weight: bold; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 5px; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
            }
            .label { font-weight: bold; }
            .status { 
              display: inline-block; 
              padding: 4px 8px; 
              border: 1px solid #000; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REPAIR RECEIPT</h1>
            <p>Order #${repairData.id}</p>
            <p>Date: ${formatDate(repairData.createdAt)}</p>
          </div>
          
          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="label">Name:</span>
              <span>${repairData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span>${repairData.customerPhone}</span>
            </div>
          </div>

          <div class="section">
            <h3>Device Information</h3>
            <div class="info-row">
              <span class="label">Device:</span>
              <span>${repairData.deviceBrand} ${repairData.deviceModel}</span>
            </div>
            <div class="info-row">
              <span class="label">Issue:</span>
              <span>${repairData.issueDescription}</span>
            </div>
          </div>

          <div class="section">
            <h3>Status & Payment</h3>
            <div class="info-row">
              <span class="label">Repair Status:</span>
              <span class="status">${repairData.status}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Status:</span>
              <span class="status">${repairData.paymentStatus}</span>
            </div>
            <div class="info-row">
              <span class="label">Estimated Cost:</span>
              <span>$${repairData.estimatedCost.toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <p style="text-align: center; margin-top: 30px; font-size: 12px;">
              Thank you for choosing our repair service!
            </p>
          </div>
        </body>
      </html>
    `);
    newWin.document.close();
    newWin.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Repair Details
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Order #{repairData.id} • Created{" "}
                {formatDate(repairData.createdAt)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`px-3 py-1 ${getStatusColor(repairData.status)}`}
              >
                {getStatusIcon(repairData.status)}
                <span className="ml-1">{repairData.status}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div id="printable-repair" className="space-y-4 pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Customer Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {repairData.customerName}
                      </p>
                      <p className="text-sm text-gray-500">Customer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {repairData.customerPhone}
                      </p>
                      <p className="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    Device Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {repairData.deviceBrand} {repairData.deviceModel}
                      </p>
                      <p className="text-sm text-gray-500">Device</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Issue Description
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {repairData.issueDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Management Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Status Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Repair Status
                    </label>
                    <Select
                      value={repairData.status}
                      onValueChange={(val) =>
                        updateRepairStatus(repairData.id, val as RepairStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(repairData.status)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="In Progress">
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4" />
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="Completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="Delivered">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Delivered
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Status
                    </label>
                    <Select
                      value={repairData.paymentStatus}
                      onValueChange={(val) =>
                        updatePaymentStatus(repairData.id, val as PaymentStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unpaid">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Unpaid
                          </div>
                        </SelectItem>
                        <SelectItem value="Partially Paid">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            Partially Paid
                          </div>
                        </SelectItem>
                        <SelectItem value="Paid">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Paid
                          </div>
                        </SelectItem>
                        <SelectItem value="Refunded">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-purple-500" />
                            Refunded
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 ${getStatusColor(repairData.status)}`}
                  >
                    {getStatusIcon(repairData.status)}
                    <span className="ml-1">{repairData.status}</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 ${getPaymentStatusColor(
                      repairData.paymentStatus
                    )}`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="ml-1">{repairData.paymentStatus}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Estimated Cost
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          ${repairData.estimatedCost.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Parts Used
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {repairData.usedParts?.length || 0}
                        </p>
                      </div>
                      <Smartphone className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">
                          Payments
                        </p>
                        <p className="text-2xl font-bold text-purple-700">
                          {repairData.payments?.length || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          Last Updated
                        </p>
                        <p className="text-sm font-bold text-orange-700">
                          {formatDate(repairData.updatedAt)}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Inside RepairDetail, after showing Payment Status */}
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium mb-2">
                      Record a Payment
                    </h4>
                    <RepairPaymentForm
                      repair={repairData}
                      onSuccess={() => {
                        // you can refresh the detail view or just close the form
                        console.log("Payment recorded successfully");
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Card */}
            {repairData.payments && repairData.payments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairData.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell className="text-right">
                              ${payment.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-right font-semibold">
                    Total Paid: $
                    {repairData.payments
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repair History Card */}
            {repairData.history && repairData.history.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Repair History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {repairData.history
                      .slice(0, 5)
                      .map((historyItem, index) => (
                        <div
                          key={historyItem.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              {formatDate(historyItem.timestamp)}
                            </p>
                            <p className="text-sm font-medium">
                              {JSON.stringify(historyItem.event)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator className="my-3 flex-shrink-0" />

        <div className="flex justify-between items-center flex-shrink-0">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
