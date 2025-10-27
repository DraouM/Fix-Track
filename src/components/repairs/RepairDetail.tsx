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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  MoreHorizontal,
  Download,
} from "lucide-react";
import { RepairPaymentForm } from "./RepairPaymentForm";
import { useState, useEffect } from "react";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { toast } from "sonner";
import { ReceiptTemplate } from "@/components/helpers/ReceiptTemplate";
import { StickerTemplate } from "@/components/helpers/StickerTemplate";
import { PrinterSelectionDialog } from "@/components/helpers/PrinterSelectionDialog";
import { reportError } from "@/lib/crashReporter";

interface RepairDetailProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PrintOptions {
  useEscPos?: boolean;
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
  const { updateRepairStatus } = useRepairActions();
  const { getItemById } = useRepairContext();
  const {
    printReceipt,
    printSticker,
    downloadAsHTML,
    showPrintTroubleshoot,
    isPrinterSelectionOpen,
    setIsPrinterSelectionOpen,
    handlePrinterSelection,
  } = usePrintUtils();

  // Local state for loading indicators
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [isGeneratingEscPosReceipt, setIsGeneratingEscPosReceipt] =
    useState(false);
  const [isGeneratingEscPosSticker, setIsGeneratingEscPosSticker] =
    useState(false);
  const [hasError, setHasError] = useState(false);

  // Get the most up-to-date repair data from context
  const currentRepair = repair ? getItemById(repair.id) || repair : null;

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: Error) => {
      console.error("RepairDetail error:", error);
      reportError(error, "RepairDetail");
      setHasError(true);
      toast.error("❌ An error occurred. Please try again.");
    };

    // Add error boundary
    try {
      // Validate repair data
      if (repair && !repair.id) {
        throw new Error("Invalid repair data: missing ID");
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [repair]);

  if (hasError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              An error occurred while loading the repair details. Please try
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentRepair) return null;

  const repairData: Repair = currentRepair;

  // Print handlers with error handling
  const handlePrintReceipt = async () => {
    if (isGeneratingReceipt) return;

    setIsGeneratingReceipt(true);
    try {
      // Validate repair data before printing
      if (!repairData.id) {
        throw new Error("Invalid repair data for printing");
      }

      const success = await printReceipt(repairData, {
        includePayments: true,
        includeParts: true,
      });

      if (!success) {
        toast.error("❌ Receipt printing failed. Please try again.");
      }
    } catch (error) {
      console.error("Failed to print receipt:", error);
      reportError(error as Error, "RepairDetail.handlePrintReceipt");
      toast.error(
        "❌ Receipt printing failed. Please try again or check your printer."
      );
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handlePrintReceiptEscPos = async () => {
    if (isGeneratingEscPosReceipt) return;

    setIsGeneratingEscPosReceipt(true);
    try {
      // Validate repair data before printing
      if (!repairData.id) {
        throw new Error("Invalid repair data for ESC/POS printing");
      }

      const success = await printReceipt(repairData, {
        includePayments: true,
        includeParts: true,
        useEscPos: true,
      });

      if (!success) {
        toast.error("❌ ESC/POS receipt printing failed. Please try again.");
      }
    } catch (error) {
      console.error("Failed to print ESC/POS receipt:", error);
      reportError(error as Error, "RepairDetail.handlePrintReceiptEscPos");
      toast.error(
        "❌ ESC/POS receipt printing failed. Please try again or check your printer."
      );
    } finally {
      setIsGeneratingEscPosReceipt(false);
    }
  };

  const handlePrintSticker = async () => {
    if (isGeneratingSticker) return;

    setIsGeneratingSticker(true);
    try {
      // Validate repair data before printing
      if (!repairData.id) {
        throw new Error("Invalid repair data for sticker printing");
      }

      const success = await printSticker(repairData);

      if (!success) {
        toast.error("❌ Sticker printing failed. Please try again.");
      }
    } catch (error) {
      console.error("Failed to print sticker:", error);
      reportError(error as Error, "RepairDetail.handlePrintSticker");
      toast.error(
        "❌ Sticker printing failed. Please try again or check your printer."
      );
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handlePrintStickerEscPos = async () => {
    if (isGeneratingEscPosSticker) return;

    setIsGeneratingEscPosSticker(true);
    try {
      // Validate repair data before printing
      if (!repairData.id) {
        throw new Error("Invalid repair data for ESC/POS sticker printing");
      }

      const success = await printSticker(repairData, {
        useEscPos: true,
      });

      if (!success) {
        toast.error("❌ ESC/POS sticker printing failed. Please try again.");
      }
    } catch (error) {
      console.error("Failed to print ESC/POS sticker:", error);
      reportError(error as Error, "RepairDetail.handlePrintStickerEscPos");
      toast.error(
        "❌ ESC/POS sticker printing failed. Please try again or check your printer."
      );
    } finally {
      setIsGeneratingEscPosSticker(false);
    }
  };

  const handlePopupBlocked = () => {
    toast.info(
      "ℹ️ If printing doesn't work:\n" +
        "• Check if popups are blocked for this site\n" +
        "• Click the popup blocker icon in your browser\n" +
        "• Allow popups for this site and try again\n" +
        "• Alternatively, use the Download option",
      { duration: 10000 }
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Repair Details
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Order #{repairData.id} • Created{" "}
                  {repairData.createdAt
                    ? formatDate(repairData.createdAt)
                    : "N/A"}
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
            <div className="space-y-4 pr-4">
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
                          {repairData.customerName || "Unknown Customer"}
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
                          {repairData.customerPhone || "No phone provided"}
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
                          {repairData.deviceBrand || "Unknown"}{" "}
                          {repairData.deviceModel || "Device"}
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
                            {repairData.issueDescription ||
                              "No description provided"}
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
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`px-3 py-1 ${getPaymentStatusColor(
                            repairData.paymentStatus
                          )}`}
                        >
                          <DollarSign className="h-4 w-4" />
                          <span className="ml-1">
                            {repairData.paymentStatus}
                          </span>
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment status is automatically calculated
                        </p>
                      </div>
                    </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Estimated Cost
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            ${(repairData.estimatedCost || 0).toFixed(2)}
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
                            {repairData.updatedAt
                              ? formatDate(repairData.updatedAt)
                              : "N/A"}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />
                  <h4 className="text-sm font-medium mb-2">Record a Payment</h4>
                  <RepairPaymentForm
                    repair={repairData}
                    onSuccess={() => {
                      console.log("Payment recorded successfully");
                    }}
                  />
                </CardContent>
              </Card>

              {/* Payments Card */}
              {repairData.payments &&
                Array.isArray(repairData.payments) &&
                repairData.payments.length > 0 && (
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
                              <TableHead className="text-right">
                                Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {repairData.payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {payment.date
                                    ? formatDate(payment.date)
                                    : "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${(payment.amount || 0).toFixed(2)}
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
                          .reduce((sum, p) => sum + (p.amount || 0), 0)
                          .toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Repair History Card */}
              {repairData.history &&
                Array.isArray(repairData.history) &&
                repairData.history.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-gray-600" />
                        Repair History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {repairData.history.slice(0, 5).map((historyItem) => (
                          <div
                            key={historyItem.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                {historyItem.timestamp
                                  ? formatDate(historyItem.timestamp)
                                  : "N/A"}
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

          <div className="flex justify-between items-center flex-shrink-0 gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handlePrintReceipt}
                disabled={isGeneratingReceipt}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingReceipt ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isGeneratingReceipt ? "Printing..." : "Print Receipt"}
              </Button>

              <Button
                onClick={handlePrintReceiptEscPos}
                disabled={isGeneratingEscPosReceipt}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingEscPosReceipt ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isGeneratingEscPosReceipt ? "ESC/POS..." : "ESC/POS Receipt"}
              </Button>

              <Button
                onClick={handlePrintSticker}
                disabled={isGeneratingSticker}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isGeneratingSticker ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isGeneratingSticker ? "Printing..." : "Print Sticker"}
              </Button>

              <Button
                onClick={handlePrintStickerEscPos}
                disabled={isGeneratingEscPosSticker}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isGeneratingEscPosSticker ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isGeneratingEscPosSticker ? "ESC/POS..." : "ESC/POS Sticker"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadAsHTML(repairData, "receipt")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt (Backup)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadAsHTML(repairData, "sticker")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Sticker (Backup)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={showPrintTroubleshoot}
                    className="flex items-center gap-2 text-blue-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Print Help & Tips
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Selection Dialog */}
      <PrinterSelectionDialog
        open={isPrinterSelectionOpen}
        onOpenChange={setIsPrinterSelectionOpen}
        onPrinterSelect={handlePrinterSelection}
        title="Select Printer"
        description="Choose a printer for your document"
      />

      {/* Hidden Print Templates - These are rendered outside the dialog */}
      {repairData && (
        <>
          <div id="receipt-print-template">
            <ReceiptTemplate
              repair={repairData}
              includePayments={true}
              includeParts={true}
            />
          </div>
          <div id="sticker-print-template">
            <StickerTemplate repair={repairData} />
          </div>
        </>
      )}
    </>
  );
}
