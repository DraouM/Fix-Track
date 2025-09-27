// src/utils/repairUtils.ts
import type { RepairStatus, PaymentStatus } from "@/types/repair";

/* -----------------------------
 * ✅ STATUS & PAYMENT MAPPINGS
 * ----------------------------- */
const REPAIR_STATUS_VARIANTS: Record<RepairStatus, string> = {
  Pending: "warning",
  "In Progress": "secondary",
  Completed: "success",
  Delivered: "default",
};

const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, string> = {
  Paid: "success",
  "Partially Paid": "secondary",
  Unpaid: "destructive",
  Refunded: "refunded",
};

/**
 * Get badge variant for repair status
 */
export const getRepairStatusBadgeVariant = (status: RepairStatus): string =>
  REPAIR_STATUS_VARIANTS[status] || "outline";

/**
 * Get badge variant for payment status
 */
export const getPaymentStatusBadgeVariant = (status: PaymentStatus): string =>
  PAYMENT_STATUS_VARIANTS[status] || "outline";

/* -----------------------------
 * ✅ COST & PAYMENT CALCULATIONS
 * ----------------------------- */

/**
 * Calculate total cost of a repair (parts + labor)
 */
export const repairCalculateTotal = (repair: {
  usedParts?: Array<{ cost: number; quantity: number }>;
  laborCost?: number;
}): number => {
  const partsTotal =
    repair.usedParts?.reduce(
      (sum, part) => sum + Math.max(0, part.cost) * Math.max(0, part.quantity),
      0
    ) || 0;

  return partsTotal + Math.max(0, repair.laborCost || 0);
};

/**
 * Calculate total amount paid
 */
export const repairCalculatePaid = (
  payments: Array<{ amount: number }>
): number => payments.reduce((sum, p) => sum + Math.max(0, p.amount), 0);

/**
 * Calculate remaining balance
 */
export const repairCalculateBalance = (
  total: number,
  payments: Array<{ amount: number }>
): number => {
  const paid = repairCalculatePaid(payments);
  return Math.max(0, total - paid);
};

/**
 * Get payment status based on total vs paid
 */
export const getPaymentStatusFromAmounts = (
  total: number,
  paid: number
): PaymentStatus => {
  if (paid >= total) return "Paid";
  if (paid > 0) return "Partially Paid";
  return "Unpaid";
};

/**
 * Calculate payment status from repair data
 * This ensures consistent calculation across the app
 */
export const calculatePaymentStatusFromRepair = (repair: {
  estimatedCost: number;
  payments?: Array<{ amount: number }>;
  totalPaid?: number;
}): PaymentStatus => {
  // Use totalPaid if available (already calculated), otherwise calculate from payments
  const paid = repair.totalPaid ?? repairCalculatePaid(repair.payments || []);
  return getPaymentStatusFromAmounts(repair.estimatedCost, paid);
};

/* -----------------------------
 * ✅ DATE / TIME HELPERS
 * ----------------------------- */

/**
 * Format repair duration (e.g. "2d 4h")
 */
export const formatRepairDuration = (
  startDate: Date,
  endDate?: Date
): string => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(
    (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffInDays > 0) {
    return `${diffInDays}d ${diffInHours}h`;
  }
  return `${diffInHours}h`;
};

/**
 * Check if repair is urgent (due soon)
 */
export const isRepairUrgent = (
  promisedDate: Date,
  bufferHours: number = 24
): boolean => {
  const now = new Date();
  const promised = new Date(promisedDate);
  const timeDiff = promised.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  return hoursDiff <= bufferHours && hoursDiff > 0;
};

/**
 * Check if repair is overdue
 */
export const isRepairOverdue = (promisedDate: Date): boolean => {
  const now = new Date();
  return now > new Date(promisedDate);
};

/* -----------------------------
 * ✅ STATUS FLOW HELPERS
 * ----------------------------- */

/**
 * Get next suggested repair status
 */
export const getNextRepairStatus = (
  currentStatus: RepairStatus
): RepairStatus => {
  const statusFlow: RepairStatus[] = [
    "Pending",
    "In Progress",
    "Completed",
    "Delivered",
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
    return currentStatus;
  }

  return statusFlow[currentIndex + 1];
};

/* -----------------------------
 * ✅ LIST OPERATIONS
 * ----------------------------- */

/**
 * Filter repairs by status
 */
export const filterRepairsByStatus = <T extends { status: RepairStatus }>(
  repairs: T[],
  status: RepairStatus
): T[] => repairs.filter((repair) => repair.status === status);

/**
 * Sort repairs by priority:
 *  - Urgent first
 *  - Then by promised date
 */
export const sortRepairsByPriority = <
  T extends { promisedDate: Date; status: RepairStatus }
>(
  repairs: T[]
): T[] => {
  return [...repairs].sort((a, b) => {
    const aUrgent = isRepairUrgent(a.promisedDate);
    const bUrgent = isRepairUrgent(b.promisedDate);

    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    return (
      new Date(a.promisedDate).getTime() - new Date(b.promisedDate).getTime()
    );
  });
};

/* -----------------------------
 * ✅ STATS GENERATION
 * ----------------------------- */

/**
 * Generate repair summary statistics
 */
export const generateRepairStats = (
  repairs: Array<{
    status: RepairStatus;
    totalCost: number;
    payments?: Array<{ amount: number }>;
  }>
) => {
  const stats = {
    total: repairs.length,
    completed: repairs.filter(
      (r) => r.status === "Completed" || r.status === "Delivered"
    ).length,
    inProgress: repairs.filter((r) => r.status === "In Progress").length,
    pending: repairs.filter((r) => r.status === "Pending").length,
    totalRevenue: repairs
      .filter((r) => r.status === "Completed" || r.status === "Delivered")
      .reduce((sum, r) => sum + (r.totalCost || 0), 0),
    outstandingBalance: repairs.reduce(
      (sum, r) => sum + repairCalculateBalance(r.totalCost, r.payments || []),
      0
    ),
  };

  return {
    ...stats,
    completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
  };
};
