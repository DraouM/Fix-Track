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
  error: string | null;
  searchTerm: string;
  statusFilter: RepairStatus | "All";
  paymentStatusFilter: PaymentStatus | "All";
  sortConfig: RepairSortConfig;
}

// ✅ Actions shape
interface RepairActions {
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
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
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

export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
  const [history, setHistory] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    clearError();
    await withAsync(() => invoke<RepairDb[]>("get_repairs"), {
      onSuccess: (data) => {
        const mappedRepairs = data.map(mapRepairFromDB);
        setRepairs(mappedRepairs);
      },
      onError: (msg) => setError(msg),
    });
    setLoading(false);
  }, [clearError]);

  // ✅ Fetch repair by ID
  const fetchRepairById = useCallback(
    async (id: string) => {
      setLoading(true);
      clearError();

      const repair = await withAsync(
        () => invoke<RepairDb>("get_repair_by_id", { id }),
        {
          onSuccess: (data) => {
            const mappedRepair = mapRepairFromDB(data);
            setSelectedRepair(mappedRepair);
            setRepairs((prev) =>
              prev.map((r) => (r.id === mappedRepair.id ? mappedRepair : r))
            );
          },
          onError: (msg) => setError(msg),
        }
      );

      if (repair) {
        // fetch related data
        const [paymentsData, partsData, historyData] = await Promise.all([
          invoke<Payment[]>("get_payments_for_repair", { repairId: id }),
          invoke<UsedPart[]>("get_used_parts_for_repair", { repairId: id }),
          invoke<RepairHistory[]>("get_history_for_repair", { repairId: id }),
        ]);
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
      setLoading(true);
      clearError();
      const repairData = {
        ...data,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await withAsync(() => invoke("insert_repair", { repair: repairData }), {
        onSuccess: () => {
          toast.success("Repair created successfully");
          fetchRepairs();
        },
        onError: (msg) => setError(msg),
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
      await withAsync(() => invoke("update_repair", { id, data }), {
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
    [clearError]
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
      setLoading(true);
      clearError();
      await withAsync(() => invoke("update_repair_status", { id, status }), {
        onSuccess: () => {
          toast.success("Repair status updated");
          setRepairs((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, status, updatedAt: new Date().toISOString() }
                : r
            )
          );
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [clearError]
  );

  // ✅ Update payment status
  const updatePaymentStatus = useCallback(
    async (id: string, status: PaymentStatus) => {
      setLoading(true);
      clearError();
      await withAsync(() => invoke("update_payment_status", { id, status }), {
        onSuccess: () => {
          toast.success("Payment status updated");
          setRepairs((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    paymentStatus: status,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            )
          );
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [clearError]
  );

  // ✅ Add payment
  const addPayment = useCallback(
    async (repairId: string, payment: PaymentInput) => {
      setLoading(true);
      clearError();
      const paymentData = {
        ...payment,
        id: uuidv4(),
        date: new Date().toISOString(),
      };

      await withAsync(
        () => invoke("add_payment", { repairId, payment: paymentData }),
        {
          onSuccess: () => {
            toast.success("Payment added successfully");
            fetchRepairById(repairId);
          },
          onError: (msg) => setError(msg),
        }
      );
      setLoading(false);
    },
    [fetchRepairById, clearError]
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
        () => invoke<RepairHistory[]>("get_history_for_repair", { repairId }),
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

  // ✅ Initialize data
  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  // ✅ Memoized value
  const value = useMemo<RepairContextType>(
    () => ({
      // ✅ State
      repairs,
      filteredAndSortedRepairs,
      selectedRepair,
      payments,
      usedParts,
      history,
      loading,
      error,
      searchTerm: filters.searchTerm, // Extract from filters object
      statusFilter: filters.status, // Extract from filters object
      paymentStatusFilter: filters.paymentStatus, // Extract from filters object
      sortConfig,

      // ✅ Actions
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
      updatePaymentStatus,
      addPayment,
      addUsedPart,
      getRepairHistory,
      getItemById,
    }),
    [
      repairs,
      filteredAndSortedRepairs,
      selectedRepair,
      payments,
      usedParts,
      history,
      loading,
      error,
      filters.searchTerm,
      filters.status,
      filters.paymentStatus,
      sortConfig,
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
      updatePaymentStatus,
      addPayment,
      addUsedPart,
      getRepairHistory,
      getItemById,
    ]
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
    error,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    sortConfig,
  };
}

export function useRepairActions(): RepairActions {
  const {
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
    updatePaymentStatus,
    addPayment,
    addUsedPart,
    getRepairHistory,
    getItemById,
  } = useRepairContext();
  return {
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
    updatePaymentStatus,
    addPayment,
    addUsedPart,
    getRepairHistory,
    getItemById,
  };
}
