// src/utils/supplierUtils.ts
import type {
  Supplier,
  PaymentMethod,
  SupplierHistoryEventType,
  SupplierHistoryEvent,
} from "@/types/supplier";

/* -----------------------------
 * ✅ PAYMENT METHOD MAPPINGS
 * ----------------------------- */
const PAYMENT_METHOD_VARIANTS: Record<PaymentMethod, string> = {
  "Bank Transfer": "default",
  Cash: "success",
  Check: "warning",
  "Credit Card": "secondary",
  Other: "outline",
};

/**
 * Get badge variant for payment method
 */
export const getPaymentMethodBadgeVariant = (method: PaymentMethod): string =>
  PAYMENT_METHOD_VARIANTS[method] || "outline";

/**
 * Get display text for payment method
 */
export const getPaymentMethodDisplayText = (method?: PaymentMethod): string =>
  method || "Not Specified";

/* -----------------------------
 * ✅ STATUS & ACTIVITY HELPERS
 * ----------------------------- */

/**
 * Get status badge variant for supplier
 */
export const getSupplierStatusBadgeVariant = (active: boolean): string =>
  active ? "success" : "destructive";

/**
 * Get display text for supplier status
 */
export const getSupplierStatusDisplayText = (active: boolean): string =>
  active ? "Active" : "Inactive";

/**
 * Check if supplier has outstanding balance
 */
export const hasOutstandingBalance = (supplier: Supplier): boolean =>
  (supplier.creditBalance || 0) > 0;

/**
 * Check if supplier is overdue (balance > 0 for extended period)
 */
export const isSupplierOverdue = (supplier: Supplier): boolean => {
  if (!hasOutstandingBalance(supplier)) return false;

  // Consider overdue if balance exists and last activity was > 30 days ago
  const lastActivity = getLastActivityDate(supplier);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return lastActivity < thirtyDaysAgo;
};

/* -----------------------------
 * ✅ BALANCE & PAYMENT CALCULATIONS
 * ----------------------------- */

/**
 * Calculate total credit balance across all suppliers
 */
export const calculateTotalCreditBalance = (suppliers: Supplier[]): number =>
  suppliers.reduce(
    (total, supplier) => total + (supplier.creditBalance || 0),
    0
  );

/**
 * Add amount to supplier balance and create history event
 */
export const addToSupplierBalance = (
  supplier: Supplier,
  amount: number,
  notes?: string,
  relatedId?: string
): Supplier => {
  const historyEvent: SupplierHistoryEvent = {
    id: generateId(),
    supplierId: supplier.id,
    date: new Date().toISOString(),
    type: amount > 0 ? "Purchase Order Created" : "Payment Made",
    amount: Math.abs(amount),
    notes,
    relatedId,
  };

  return {
    ...supplier,
    creditBalance: (supplier.creditBalance || 0) + amount,
    updatedAt: new Date().toISOString(),
    history: [...(supplier.history || []), historyEvent],
  };
};

/**
 * Make payment to reduce supplier balance
 */
export const makeSupplierPayment = (
  supplier: Supplier,
  amount: number,
  paymentMethod: PaymentMethod,
  notes?: string,
  paymentId?: string
): Supplier => {
  if (amount <= 0) return supplier;

  const paymentAmount = Math.min(amount, supplier.creditBalance || 0);

  return addToSupplierBalance(
    supplier,
    -paymentAmount,
    `Payment via ${paymentMethod}. ${notes || ""}`.trim(),
    paymentId
  );
};

/**
 * Adjust supplier balance (manual correction)
 */
export const adjustSupplierBalance = (
  supplier: Supplier,
  newBalance: number,
  reason: string
): Supplier => {
  const currentBalance = supplier.creditBalance || 0;
  const adjustment = newBalance - currentBalance;

  return addToSupplierBalance(
    supplier,
    adjustment,
    `Manual adjustment: ${reason}`,
    undefined
  );
};

/* -----------------------------
 * ✅ HISTORY & ACTIVITY HELPERS
 * ----------------------------- */

/**
 * Get badge variant for supplier history event type
 */
export const getSupplierHistoryEventBadgeVariant = (
  eventType: SupplierHistoryEventType
): string => {
  switch (eventType) {
    case "Supplier Created":
      return "success";
    case "Supplier Updated":
      return "secondary";
    case "Payment Made":
      return "default";
    case "Credit Balance Adjusted":
      return "warning";
    case "Purchase Order Created":
      return "destructive";
    case "Other":
      return "outline";
    default:
      return "outline";
  }
};

/**
 * Get last activity date from supplier history
 */
export const getLastActivityDate = (supplier: Supplier): Date => {
  if (!supplier.history || supplier.history.length === 0) {
    return new Date(supplier.updatedAt);
  }

  const sortedHistory = [...supplier.history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return new Date(sortedHistory[0].date);
};

/**
 * Filter supplier history by event type
 */
export const filterSupplierHistory = (
  supplier: Supplier,
  eventTypes?: SupplierHistoryEventType[]
): SupplierHistoryEvent[] => {
  if (!supplier.history) return [];

  if (!eventTypes || eventTypes.length === 0) {
    return supplier.history;
  }

  return supplier.history.filter((event) => eventTypes.includes(event.type));
};

/**
 * Get recent activity (last 30 days)
 */
export const getRecentActivity = (
  supplier: Supplier
): SupplierHistoryEvent[] => {
  if (!supplier.history) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return supplier.history.filter(
    (event) => new Date(event.date) >= thirtyDaysAgo
  );
};

/* -----------------------------
 * ✅ LIST OPERATIONS & FILTERING
 * ----------------------------- */

/**
 * Filter suppliers by activity status
 */
export const filterSuppliersByStatus = (
  suppliers: Supplier[],
  active: boolean
): Supplier[] => suppliers.filter((supplier) => supplier.active === active);

/**
 * Filter suppliers with outstanding balance
 */
export const filterSuppliersWithBalance = (suppliers: Supplier[]): Supplier[] =>
  suppliers.filter(hasOutstandingBalance);

/**
 * Filter suppliers by payment method preference
 */
export const filterSuppliersByPaymentMethod = (
  suppliers: Supplier[],
  paymentMethod: PaymentMethod
): Supplier[] =>
  suppliers.filter(
    (supplier) => supplier.preferredPaymentMethod === paymentMethod
  );

/**
 * Sort suppliers by balance (highest first)
 */
export const sortSuppliersByBalance = (suppliers: Supplier[]): Supplier[] =>
  [...suppliers].sort(
    (a, b) => (b.creditBalance || 0) - (a.creditBalance || 0)
  );

/**
 * Sort suppliers by last activity (most recent first)
 */
export const sortSuppliersByActivity = (suppliers: Supplier[]): Supplier[] =>
  [...suppliers].sort(
    (a, b) =>
      new Date(getLastActivityDate(b)).getTime() -
      new Date(getLastActivityDate(a)).getTime()
  );

/**
 * Sort suppliers by name (A-Z)
 */
export const sortSuppliersByName = (suppliers: Supplier[]): Supplier[] =>
  [...suppliers].sort((a, b) => a.name.localeCompare(b.name));

/* -----------------------------
 * ✅ SEARCH & FILTERING
 * ----------------------------- */

/**
 * Search suppliers by name, contact, email, or phone
 */
export const searchSuppliers = (
  suppliers: Supplier[],
  query: string
): Supplier[] => {
  if (!query.trim()) return suppliers;

  const searchTerm = query.toLowerCase();

  return suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.contactName?.toLowerCase().includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.toLowerCase().includes(searchTerm)
  );
};

/**
 * Advanced supplier filtering
 */
export const filterSuppliers = (
  suppliers: Supplier[],
  filters: {
    query?: string;
    active?: boolean;
    hasBalance?: boolean;
    paymentMethod?: PaymentMethod;
  }
): Supplier[] => {
  let filtered = suppliers;

  if (filters.query) {
    filtered = searchSuppliers(filtered, filters.query);
  }

  if (filters.active !== undefined) {
    filtered = filterSuppliersByStatus(filtered, filters.active);
  }

  if (filters.hasBalance) {
    filtered = filterSuppliersWithBalance(filtered);
  }

  if (filters.paymentMethod) {
    filtered = filterSuppliersByPaymentMethod(filtered, filters.paymentMethod);
  }

  return filtered;
};

/* -----------------------------
 * ✅ STATISTICS & ANALYTICS
 * ----------------------------- */

/**
 * Generate supplier statistics
 */
export const generateSupplierStats = (suppliers: Supplier[]) => {
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.active).length,
    withBalance: suppliers.filter(hasOutstandingBalance).length,
    totalCreditBalance: calculateTotalCreditBalance(suppliers),
    byPaymentMethod: {} as Record<PaymentMethod, number>,
  };

  // Count by payment method
  suppliers.forEach((supplier) => {
    const method = supplier.preferredPaymentMethod || "Other";
    stats.byPaymentMethod[method] = (stats.byPaymentMethod[method] || 0) + 1;
  });

  return {
    ...stats,
    inactive: stats.total - stats.active,
    averageBalance:
      stats.total > 0 ? stats.totalCreditBalance / stats.total : 0,
  };
};

/**
 * Get top suppliers by balance (for dashboard)
 */
export const getTopSuppliersByBalance = (
  suppliers: Supplier[],
  limit: number = 5
): Supplier[] => sortSuppliersByBalance(suppliers).slice(0, limit);

/* -----------------------------
 * ✅ VALIDATION HELPERS
 * ----------------------------- */

/**
 * Validate supplier contact information
 */
export const validateSupplierContact = (
  supplier: Supplier
): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (!supplier.contactName && !supplier.email && !supplier.phone) {
    issues.push(
      "At least one contact method (name, email, or phone) is required"
    );
  }

  if (supplier.email && !isValidEmail(supplier.email)) {
    issues.push("Invalid email format");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * Check if supplier can be deactivated (no outstanding balance)
 */
export const canDeactivateSupplier = (supplier: Supplier): boolean =>
  !hasOutstandingBalance(supplier);

/* -----------------------------
 * ✅ UTILITY FUNCTIONS
 * ----------------------------- */

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
