"use client";

import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRepairFilters, RepairSortConfig } from "@/hooks/useRepairFilters";

import type {
  Repair,
  RepairDb,
  Payment,
  PaymentInput,
  UsedPart,
  UsedPartInput,
  RepairHistory,
  PaymentStatus,
  RepairStatus,
} from "@/types/repair";

// ✅ State shape
interface RepairState {
  repairs: Repair[];
  filteredAndSortedRepairs: Repair[];
  selectedRepair: Repair | null;
  payments: Payment[];
  usedParts: UsedPart[];
  history: RepairHistory[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: RepairStatus | "All";
  paymentStatusFilter: PaymentStatus | "All";
  sortConfig: RepairSortConfig;
}

// ✅ Actions shape
interface RepairActions {
  initialize: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: RepairStatus | "All") => void;
  setPaymentStatusFilter: (paymentStatus: PaymentStatus | "All") => void;
  handleSort: (key: RepairSortConfig["key"]) => void;
  clearFilters: () => void;
  fetchRepairs: () => Promise<void>;
  fetchRepairById: (id: string) => Promise<void>;
  createRepair: (
    data: Omit<RepairDb, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateRepair: (id: string, data: Partial<Repair>) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
  updateRepairStatus: (id: string, status: RepairStatus) => Promise<void>;
  addPayment: (repairId: string, payment: PaymentInput) => Promise<void>;
  addUsedPart: (repairId: string, part: UsedPartInput) => Promise<void>;
  getRepairHistory: (repairId: string) => Promise<void>;
  getItemById: (id: string) => Repair | undefined;
}

// ✅ Combined type
export type RepairContextType = RepairState & RepairActions;

const RepairContext = createContext<RepairContextType | undefined>(undefined);

// ✅ Utility: wrap async calls with error handling
async function withAsync<T>(
  action: () => Promise<T>,
  {
    onSuccess,
    onError,
  }: { onSuccess?: (res: T) => void; onError?: (msg: string) => void } = {}
) {
  try {
    const result = await action();
    onSuccess?.(result);
    return result;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unexpected error";
    onError?.(errorMessage);
    toast.error(errorMessage);
    throw err;
  }
}

// Map DB repair to frontend Repair
function mapRepairFromDB(dbRepair: RepairDb): Repair {
  return {
    id: String(dbRepair.id),
    customerName: dbRepair.customer_name,
    customerPhone: dbRepair.customer_phone,
    deviceBrand: dbRepair.device_brand,
    deviceModel: dbRepair.device_model,
    issueDescription: dbRepair.issue_description,
    estimatedCost: dbRepair.estimated_cost,
    status: dbRepair.status as RepairStatus,
    paymentStatus: dbRepair.payment_status as PaymentStatus,
    usedParts: dbRepair.used_parts || [],
    payments: dbRepair.payments || [],
    history: dbRepair.history || [],
    createdAt: dbRepair.created_at,
    updatedAt: dbRepair.updated_at,
  };
}

// Calculate payment totals for a repair
function calculatePaymentTotals(repair: Repair, allPayments: Payment[]) {
  // Convert both to strings for comparison since we have mixed ID types
  const repairPayments = allPayments.filter(
    (p) => String(p.repair_id) === String(repair.id)
  );
  const totalPaid = repairPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = repair.estimatedCost - totalPaid;

  return {
    ...repair,
    payments: repairPayments,
    totalPaid,
    remainingBalance,
  };
}

export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
  const [history, setHistory] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use the filtering/sorting hook (you'll need to create useRepairFilters)
  const {
    filteredAndSortedRepairs, // Note: different name than expected
    filters, // Contains searchTerm, status, paymentStatus
    sortConfig,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    handleSort,
    clearFilters,
  } = useRepairFilters(repairs);

  const clearError = useCallback(() => setError(null), []);

  // ✅ Fetch all repairs
  const fetchRepairs = useCallback(async () => {
    console.log("🔄 Fetching all repairs from database...");
    setLoading(true);
    clearError();

    await withAsync(() => invoke<RepairDb[]>("get_repairs"), {
      onSuccess: async (repairsData) => {
        console.log("✅ Successfully fetched repairs:", repairsData);
        console.log("📊 Number of repairs fetched:", repairsData.length);

        // // Handle empty repairs case early
        // if (!repairsData || repairsData.length === 0) {
        //   console.log("📭 No repairs found, setting empty array");
        //   setRepairs([]);
        //   return;
        // }

        const mappedRepairs = repairsData.map(mapRepairFromDB);

        // For now, fetch payments for each repair individually
        // TODO: Create get_all_payments backend function for better performance
        try {
          const repairsWithPayments = await Promise.all(
            mappedRepairs.map(async (repair) => {
              try {
                const repairPayments = await invoke<Payment[]>(
                  "get_payments_for_repair",
                  { repairId: repair.id }
                );
                return calculatePaymentTotals(repair, repairPayments);
              } catch (error) {
                console.warn(
                  `Failed to fetch payments for repair ${repair.id}:`,
                  error
                );
                return calculatePaymentTotals(repair, []);
              }
            })
          );

          console.log(
            "🔄 Mapped repairs with payment totals:",
            repairsWithPayments
          );
          setRepairs(repairsWithPayments);
        } catch (error) {
          console.error("❌ Error calculating payment totals:", error);
          // Fallback: set repairs without payment calculations
          setRepairs(mappedRepairs);
        }
      },
      onError: (msg) => {
        console.error("❌ Error fetching repairs:", msg);
        setError(msg);
      },
    });

    setLoading(false);
  }, [clearError]);

  // ✅ Initialize data
  const initialize = useCallback(async () => {
    if (initialized) return;

    setLoading(true);
    clearError();
    setError(null);

    try {
      await fetchRepairs();
      setInitialized(true);
    } catch (err) {
      console.error("Failed to initialize repairs:", err);
      setError(`Failed to initialize repairs: ${err}`);
      toast.error(`Failed to initialize repairs: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [fetchRepairs, initialized, clearError]);

  // ✅ Fetch repair by ID
  const fetchRepairById = useCallback(
    async (id: string) => {
      console.log("🔍 Fetching repair by ID:", id);
      setLoading(true);
      clearError();

      const repair = await withAsync(
        () => invoke<RepairDb>("get_repair_by_id", { repairId: id }),
        {
          onSuccess: (data) => {
            console.log("✅ Successfully fetched repair by ID:", data);
            const mappedRepair = mapRepairFromDB(data);
            console.log("🔄 Mapped repair to frontend format:", mappedRepair);
            setSelectedRepair(mappedRepair);
            setRepairs((prev) =>
              prev.map((r) => (r.id === mappedRepair.id ? mappedRepair : r))
            );
          },
          onError: (msg) => {
            console.error("❌ Error fetching repair by ID:", msg);
            setError(msg);
          },
        }
      );

      if (repair && id) {
        console.log("🔄 Fetching related data for repair:", id);
        // fetch related data
        const [paymentsData, partsData, historyData] = await Promise.all([
          invoke<Payment[]>("get_payments_for_repair", { repairId: id }),
          invoke<UsedPart[]>("get_used_parts_for_repair", { repairId: id }),
          invoke<RepairHistory[]>("get_history_for_repair", { repairId: id }),
        ]);
        console.log("💰 Payments fetched:", paymentsData);
        console.log("🔧 Used parts fetched:", partsData);
        console.log("📜 History fetched:", historyData);
        setPayments(paymentsData);
        setUsedParts(partsData);
        setHistory(historyData);
      }

      setLoading(false);
    },
    [clearError]
  );

  // ✅ Create repair
  const createRepair = useCallback(
    async (data: Omit<RepairDb, "id" | "created_at" | "updated_at">) => {
      console.log("➕ Creating new repair:", data);
      setLoading(true);
      clearError();
      const repairData = {
        ...data,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("📝 Repair data with ID and timestamps:", repairData);

      await withAsync(() => invoke("insert_repair", { repair: repairData }), {
        onSuccess: () => {
          console.log("✅ Repair created successfully");
          toast.success("Repair created successfully");
          fetchRepairs();
        },
        onError: (msg) => {
          console.error("❌ Error creating repair:", msg);
          setError(msg);
        },
      });
      setLoading(false);
    },
    [fetchRepairs, clearError]
  );

  // ✅ Update repair
  const updateRepair = useCallback(
    async (id: string, data: Partial<Repair>) => {
      setLoading(true);
      clearError();

      // Find the existing repair to merge with updates
      const existingRepair = repairs.find((r) => r.id === id);
      if (!existingRepair) {
        setError("Repair not found");
        setLoading(false);
        return;
      }

      // Convert frontend Repair to backend RepairDb format
      const repairData = {
        id: existingRepair.id,
        customer_name: data.customerName ?? existingRepair.customerName,
        customer_phone: data.customerPhone ?? existingRepair.customerPhone,
        device_brand: data.deviceBrand ?? existingRepair.deviceBrand,
        device_model: data.deviceModel ?? existingRepair.deviceModel,
        issue_description:
          data.issueDescription ?? existingRepair.issueDescription,
        estimated_cost: data.estimatedCost ?? existingRepair.estimatedCost,
        status: data.status ?? existingRepair.status,
        payment_status: data.paymentStatus ?? existingRepair.paymentStatus,
        created_at: existingRepair.createdAt,
        updated_at: new Date().toISOString(),
      };

      await withAsync(() => invoke("update_repair", { repair: repairData }), {
        onSuccess: () => {
          toast.success("Repair updated successfully");
          setRepairs((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, ...data, updatedAt: new Date().toISOString() }
                : r
            )
          );
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [repairs, clearError]
  );

  // ✅ Delete repair
  const deleteRepair = useCallback(
    async (id: string) => {
      setLoading(true);
      clearError();
      await withAsync(() => invoke("delete_repair", { id }), {
        onSuccess: () => {
          toast.success("Repair deleted successfully");
          setRepairs((prev) => prev.filter((r) => r.id !== id));
          if (selectedRepair?.id === id) setSelectedRepair(null);
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [selectedRepair, clearError]
  );

  // ✅ Update repair status
  const updateRepairStatus = useCallback(
    async (id: string, status: RepairStatus) => {
      console.log("🔄 Updating repair status:", { id, status });
      setLoading(true);
      clearError();
      await withAsync(
        () => invoke("update_repair_status", { id, newStatus: status }),
        {
          onSuccess: () => {
            console.log("✅ Repair status updated successfully");
            toast.success("Repair status updated");
            setRepairs((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, status, updatedAt: new Date().toISOString() }
                  : r
              )
            );
          },
          onError: (msg) => {
            console.error("❌ Error updating repair status:", msg);
            setError(msg);
          },
        }
      );
      setLoading(false);
    },
    [clearError]
  );

  // Payment status is now automatically determined by the backend based on payments

  // ✅ Add payment
  const addPayment = useCallback(
    async (repairId: string, payment: PaymentInput) => {
      setLoading(true);
      clearError();
      const paymentData = {
        id: uuidv4(),
        repair_id: repairId, // Keep as string for backend compatibility
        amount: payment.amount,
        date: new Date().toISOString(),
        method: payment.method,
        received_by: null, // Optional field
      };

      await withAsync(() => invoke("add_payment", { payment: paymentData }), {
        onSuccess: async () => {
          // Add history entry for the payment
          const historyEntry = {
            id: uuidv4(),
            repair_id: repairId,
            date: new Date().toISOString(),
            event_type: "payment_added",
            details: `Payment of $${payment.amount} via ${payment.method}`,
            changed_by: null,
          };

          try {
            await invoke("insert_repair_history", { event: historyEntry });
          } catch (error) {
            console.warn("Failed to insert payment history:", error);
          }

          toast.success("Payment added successfully");

          // Fetch the updated repair to get the new payment status and totals
          await fetchRepairById(repairId);
          // Also refresh all repairs to update payment totals in the list
          fetchRepairs();
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [fetchRepairs, fetchRepairById, clearError]
  );

  // ✅ Add used part
  const addUsedPart = useCallback(
    async (repairId: string, part: UsedPartInput) => {
      setLoading(true);
      clearError();
      const partData = {
        ...part,
        id: uuidv4(),
      };

      await withAsync(
        () => invoke("add_used_part", { repairId, part: partData }),
        {
          onSuccess: () => {
            toast.success("Part added successfully");
            fetchRepairById(repairId);
          },
          onError: (msg) => setError(msg),
        }
      );
      setLoading(false);
    },
    [fetchRepairById, clearError]
  );

  // ✅ Get repair history
  const getRepairHistory = useCallback(
    async (repairId: string) => {
      setLoading(true);
      clearError();
      await withAsync(
        () =>
          invoke<RepairHistory[]>("get_history_for_repair", {
            repairId: repairId,
          }),
        {
          onSuccess: (data) => setHistory(data),
          onError: (msg) => setError(msg),
        }
      );
      setLoading(false);
    },
    [clearError]
  );

  // ✅ Get repair by ID
  const getItemById = useCallback(
    (id: string) => {
      return repairs.find((repair) => repair.id === id);
    },
    [repairs]
  );

  // ✅ Initialize data on mount
  useEffect(() => {
    const initTimer = setTimeout(() => {
      initialize();
    }, 20);

    return () => clearTimeout(initTimer);
  }, [initialize]);

  // ✅ Memoized value with optimized dependencies
  const stateValue = useMemo<RepairState>(
    () => ({
      repairs,
      filteredAndSortedRepairs,
      selectedRepair,
      payments,
      usedParts,
      history,
      loading,
      initialized,
      error,
      searchTerm: filters.searchTerm,
      statusFilter: filters.status,
      paymentStatusFilter: filters.paymentStatus,
      sortConfig,
    }),
    [
      repairs,
      filteredAndSortedRepairs,
      selectedRepair,
      payments,
      usedParts,
      history,
      loading,
      initialized,
      error,
      filters.searchTerm,
      filters.status,
      filters.paymentStatus,
      sortConfig,
    ]
  );

  const actionsValue = useMemo<RepairActions>(
    () => ({
      initialize,
      setSearchTerm,
      setStatusFilter,
      setPaymentStatusFilter,
      handleSort,
      clearFilters,
      fetchRepairs,
      fetchRepairById,
      createRepair,
      updateRepair,
      deleteRepair,
      updateRepairStatus,
      addPayment,
      addUsedPart,
      getRepairHistory,
      getItemById,
    }),
    [
      initialize,
      setSearchTerm,
      setStatusFilter,
      setPaymentStatusFilter,
      handleSort,
      clearFilters,
      fetchRepairs,
      fetchRepairById,
      createRepair,
      updateRepair,
      deleteRepair,
      updateRepairStatus,
      addPayment,
      addUsedPart,
      getRepairHistory,
      getItemById,
    ]
  );

  const value = useMemo<RepairContextType>(
    () => ({ ...stateValue, ...actionsValue }),
    [stateValue, actionsValue]
  );

  return (
    <RepairContext.Provider value={value}>{children}</RepairContext.Provider>
  );
};

// ✅ Hooks
export function useRepairContext() {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error("useRepairContext must be used within a RepairProvider");
  }
  return context;
}

export function useRepairState(): RepairState {
  const {
    repairs,
    filteredAndSortedRepairs,
    selectedRepair,
    payments,
    usedParts,
    history,
    loading,
    initialized,
    error,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    sortConfig,
  } = useRepairContext();
  return {
    repairs,
    filteredAndSortedRepairs,
    selectedRepair,
    payments,
    usedParts,
    history,
    loading,
    initialized,
    error,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    sortConfig,
  };
}

export function useRepairActions(): RepairActions {
  const {
    initialize,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    handleSort,
    clearFilters,
    fetchRepairs,
    fetchRepairById,
    createRepair,
    updateRepair,
    deleteRepair,
    updateRepairStatus,
    addPayment,
    addUsedPart,
    getRepairHistory,
    getItemById,
  } = useRepairContext();
  return {
    initialize,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    handleSort,
    clearFilters,
    fetchRepairs,
    fetchRepairById,
    createRepair,
    updateRepair,
    deleteRepair,
    updateRepairStatus,
    addPayment,
    addUsedPart,
    getRepairHistory,
    getItemById,
  };
}
