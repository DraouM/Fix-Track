import type { EntityBase, EntityStatus } from "@/types/entity";
export { formatCurrency, formatCurrencySmart, formatDate, formatNumber } from "@/lib/formatters";

/**
 * Returns badge variant for active/inactive status
 */
export const getEntityStatusBadgeVariant = (status: EntityStatus): "success" | "destructive" =>
  status === "active" ? "success" : "destructive";

/**
 * Returns user-facing text for active/inactive status
 */
export const getEntityStatusDisplayText = (status: EntityStatus): string =>
  status === "active" ? "Active" : "Inactive";

/**
 * Checks whether an entity has a non-zero outstanding balance
 */
export const hasOutstandingBalance = (entity: EntityBase): boolean =>
  (entity.outstandingBalance || 0) > 0;
