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
import {
  useSupplierFilters,
  SupplierSortConfig,
} from "@/hooks/useSupplierFilters";
import { useEvents } from "@/context/EventContext";
import { getCurrentSession } from "@/lib/api/session";

import type {
  Supplier,
  SupplierFormValues,
  SupplierHistoryEvent,
  PaymentMethod,
  SupplierHistoryEventType,
} from "@/types/supplier";

// ✅ Interface for backend SupplierFrontend struct
interface SupplierFrontend {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  preferred_payment_method?: string;
  outstanding_balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// ✅ State shape
interface SupplierState {
  suppliers: Supplier[];
  filteredAndSortedSuppliers: Supplier[];
  selectedSupplier: Supplier | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  searchTerm: string;
  activeFilter: boolean | "All";
  sortConfig: SupplierSortConfig;
}

// ✅ Actions shape
interface SupplierActions {
  initialize: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setActiveFilter: (active: boolean | "All") => void;
  handleSort: (key: SupplierSortConfig["key"]) => void;
  clearFilters: () => void;
  fetchSuppliers: () => Promise<void>;
  fetchSupplierById: (id: string) => Promise<void>;
  createSupplier: (data: SupplierFormValues) => Promise<void>;
  updateSupplier: (
    id: string,
    data: Partial<SupplierFormValues>
  ) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addPayment: (
    supplierId: string,
    amount: number,
    method: PaymentMethod,
    notes?: string
  ) => Promise<void>;
  adjustCredit: (
    supplierId: string,
    amount: number,
    notes?: string
  ) => Promise<void>;
  getSupplierHistory: (supplierId: string) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
}

// ✅ Combined type
export type SupplierContextType = SupplierState & SupplierActions;

const SupplierContext = createContext<SupplierContextType | undefined>(
  undefined
);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use the filtering/sorting hook
  const {
    filteredAndSortedSuppliers,
    filters,
    sortConfig,
    setSearchTerm,
    setActiveFilter,
    handleSort,
    clearFilters,
  } = useSupplierFilters(suppliers);

  const { emit } = useEvents();

  const clearError = useCallback(() => setError(null), []);

  // ✅ Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    console.log("🔄 Fetching all suppliers from database...");
    setLoading(true);
    clearError();

    await withAsync(() => invoke<SupplierFrontend[]>("get_suppliers"), {
      onSuccess: (suppliersData) => {
        console.log("✅ Successfully fetched suppliers:", suppliersData);
        console.log("📊 Number of suppliers fetched:", suppliersData.length);
        // Map the SupplierFrontend data to Supplier interface
        const mappedSuppliers = suppliersData.map(mapSupplierFromDB);
        console.log("🔄 Mapped suppliers to frontend format:", mappedSuppliers);
        setSuppliers(mappedSuppliers);
      },
      onError: (msg) => {
        console.error("❌ Error fetching suppliers:", msg);
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
      await fetchSuppliers();
      setInitialized(true);
    } catch (err) {
      console.error("Failed to initialize suppliers:", err);
      setError(`Failed to initialize suppliers: ${err}`);
      toast.error(`Failed to initialize suppliers: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers, initialized, clearError]);

  // ✅ Fetch supplier by ID
  const fetchSupplierById = useCallback(
    async (id: string) => {
      console.log("🔍 Fetching supplier by ID:", id);
      setLoading(true);
      clearError();

      await withAsync(
        () =>
          invoke<SupplierFrontend>("get_supplier_by_id", { supplierId: id }),
        {
          onSuccess: (data) => {
            console.log("✅ Successfully fetched supplier by ID:", data);
            // Map the SupplierFrontend data to Supplier interface
            const mappedSupplier = mapSupplierFromDB(data);
            console.log(
              "🔄 Mapped supplier to frontend format:",
              mappedSupplier
            );
            setSelectedSupplier(mappedSupplier);
            setSuppliers((prev) =>
              prev.map((s) => (s.id === mappedSupplier.id ? mappedSupplier : s))
            );
          },
          onError: (msg) => {
            console.error("❌ Error fetching supplier by ID:", msg);
            setError(msg);
          },
        }
      );

      setLoading(false);
    },
    [clearError]
  );

  // ✅ Create supplier
  const createSupplier = useCallback(
    async (data: SupplierFormValues) => {
      console.log("➕ Creating new supplier:", data);
      setLoading(true);
      clearError();

      const supplierData: SupplierFrontend = {
        id: uuidv4(),
        name: data.name,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        preferred_payment_method: data.preferredPaymentMethod,
        status: data.status,
        outstanding_balance: data.outstandingBalance || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await withAsync(
        () => invoke("insert_supplier", { supplier: supplierData }),
        {
          onSuccess: async () => {
            console.log("✅ Supplier created successfully");

            // Add history entry for supplier creation
            const historyEntry: SupplierHistoryEvent = {
              id: uuidv4(),
              supplierId: supplierData.id,
              date: new Date().toISOString(),
              type: "Supplier Created",
              notes: "Supplier account created",
              amount: 0,
            };

            try {
              await invoke("insert_supplier_history", { event: historyEntry });
            } catch (error) {
              console.warn(
                "Failed to insert supplier creation history:",
                error
              );
            }

            toast.success("Supplier created successfully");
            fetchSuppliers();
            // Emit event to notify dashboard
            emit("financial-data-change");
          },
          onError: (msg) => {
            console.error("❌ Error creating supplier:", msg);
            setError(msg);
          },
        }
      );
      setLoading(false);
    },
    [fetchSuppliers, clearError]
  );

  // ✅ Update supplier
  const updateSupplier = useCallback(
    async (id: string, data: Partial<SupplierFormValues>) => {
      setLoading(true);
      clearError();

      // Find the existing supplier to merge with updates
      const existingSupplier = suppliers.find((s) => s.id === id);
      if (!existingSupplier) {
        const errorMessage = "Supplier not found";
        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage);
        return;
      }

      // Create updated supplier object with snake_case fields for backend
      const updatedSupplier: SupplierFrontend = {
        id: existingSupplier.id,
        name: data.name || existingSupplier.name,
        contact_name: data.contactName || existingSupplier.contactName,
        email: data.email || existingSupplier.email,
        phone: data.phone || existingSupplier.phone,
        address: data.address || existingSupplier.address,
        notes: data.notes || existingSupplier.notes,
        preferred_payment_method:
          data.preferredPaymentMethod ||
          existingSupplier.preferredPaymentMethod,
        status: data.status || existingSupplier.status,
        outstanding_balance:
          data.outstandingBalance !== undefined
            ? data.outstandingBalance
            : existingSupplier.outstandingBalance,
        created_at: existingSupplier.createdAt,
        updated_at: new Date().toISOString(),
      };

      await withAsync(
        () => invoke("update_supplier", { supplier: updatedSupplier }),
        {
          onSuccess: async () => {
            // Add history entry for supplier update
            const historyEntry: SupplierHistoryEvent = {
              id: uuidv4(),
              supplierId: id,
              date: new Date().toISOString(),
              type: "Supplier Updated",
              notes: "Supplier information updated",
              amount: 0,
            };

            try {
              await invoke("insert_supplier_history", { event: historyEntry });
            } catch (error) {
              console.warn("Failed to insert supplier update history:", error);
            }

            toast.success("Supplier updated successfully");
            // Emit event to notify dashboard
            emit("financial-data-change");
            // Map the updated supplier back to camelCase for frontend
            const mappedSupplier = mapSupplierFromDB(updatedSupplier);
            setSuppliers((prev) =>
              prev.map((s) => (s.id === id ? mappedSupplier : s))
            );
            if (selectedSupplier?.id === id) {
              setSelectedSupplier(mappedSupplier);
            }
          },
          onError: (msg) => {
            setError(msg);
          },
        }
      );
      setLoading(false);
    },
    [suppliers, selectedSupplier, clearError, fetchSuppliers]
  );

  // ✅ Delete supplier
  const deleteSupplier = useCallback(
    async (id: string) => {
      setLoading(true);
      clearError();

      await withAsync(() => invoke("delete_supplier", { id }), {
        onSuccess: () => {
          toast.success("Supplier deleted successfully");
          setSuppliers((prev) => prev.filter((s) => s.id !== id));
          if (selectedSupplier?.id === id) setSelectedSupplier(null);
        },
        onError: (msg) => {
          setError(msg);
          toast.error(msg);
        },
      });
      setLoading(false);
    },
    [selectedSupplier, clearError]
  );

  // ✅ Add payment to supplier
  const addPayment = useCallback(
    async (
      supplierId: string,
      amount: number,
      method: PaymentMethod,
      notes?: string
    ) => {
      setLoading(true);
      clearError();

      await withAsync(
        async () => {
          // 1. Add payment record
          const session = await getCurrentSession();
          await invoke("add_supplier_payment", {
            id: uuidv4(),
            supplierId,
            amount,
            method,
            notes: notes || null,
            sessionId: session?.id || null,
          });

          // 2. Adjust credit balance (Negative amount because payment reduces debt)
          await invoke("adjust_supplier_credit", {
            supplierId,
            amount: -amount,
          });
        },
        {
          onSuccess: async () => {
             // Add history entry for the payment
            const historyEntry: SupplierHistoryEvent = {
              id: uuidv4(),
              supplierId: supplierId,
              date: new Date().toISOString(),
              type: "Payment Made", 
              notes: `Payment of $${amount} via ${method}${
                notes ? `: ${notes}` : ""
              }`,
              amount: amount,
            };

            try {
              await invoke("insert_supplier_history", { event: historyEntry });
            } catch (error) {
              console.warn("Failed to insert payment history:", error);
            }

            toast.success("Payment added successfully");

            // Emit event to notify dashboard of financial change
            emit("financial-data-change");

            // Fetch the updated supplier to get the new credit balance
            await fetchSupplierById(supplierId);
            // Also refresh all suppliers to update credit balances in the list
            fetchSuppliers();
          },
          onError: (msg) => {
            setError(msg);
            toast.error(msg);
          },
        }
      );
      setLoading(false);
    },
    [fetchSuppliers, fetchSupplierById, clearError]
  );

  // ✅ Adjust supplier credit balance
  const adjustCredit = useCallback(
    async (supplierId: string, amount: number, notes?: string) => {
      setLoading(true);
      clearError();

      await withAsync(
        () => invoke("adjust_supplier_credit", { supplierId, amount }),
        {
          onSuccess: async () => {
            // Add history entry for credit adjustment
            const historyEntry: SupplierHistoryEvent = {
              id: uuidv4(),
              supplierId: supplierId,
              date: new Date().toISOString(),
              type: "Credit Balance Adjusted",
              notes: notes || `Credit balance adjusted by $${amount}`,
              amount: amount,
            };

            try {
              await invoke("insert_supplier_history", { event: historyEntry });
            } catch (error) {
              console.warn(
                "Failed to insert credit adjustment history:",
                error
              );
            }

            toast.success("Credit balance adjusted successfully");

            // Emit event to notify dashboard of financial change
            emit("financial-data-change");

            // Fetch the updated supplier
            await fetchSupplierById(supplierId);
            fetchSuppliers();
          },
          onError: (msg) => {
            setError(msg);
            toast.error(msg);
          },
        }
      );
      setLoading(false);
    },
    [fetchSuppliers, fetchSupplierById, clearError]
  );

  // ✅ Get supplier history
  const getSupplierHistory = useCallback(
    async (supplierId: string) => {
      // Don't set global loading here to avoid unmounting the UI
      clearError();

      await withAsync(
        () =>
          invoke<SupplierHistoryEvent[]>("get_supplier_history", {
            supplierId: supplierId,
          }),
        {
          onSuccess: (data) => {
            // Update the selected supplier with history
            setSelectedSupplier((prev) =>
              prev ? { ...prev, history: data } : null
            );
            // Also update in the suppliers list
            setSuppliers((prev) =>
              prev.map((s) =>
                s.id === supplierId ? { ...s, history: data } : s
              )
            );
          },
          onError: (msg) => {
            setError(msg);
            toast.error(msg);
          },
        }
      );
    },
    [clearError]
  );

  // ✅ Get supplier by ID from local state
  const getSupplierById = useCallback(
    (id: string) => {
      return suppliers.find((supplier) => supplier.id === id);
    },
    [suppliers]
  );

  // ✅ Initialize data on mount
  useEffect(() => {
    const initTimer = setTimeout(() => {
      initialize();
    }, 30);

    return () => clearTimeout(initTimer);
  }, [initialize]);

  // ✅ Memoized value with optimized dependencies
  const stateValue = useMemo<SupplierState>(
    () => ({
      suppliers,
      filteredAndSortedSuppliers,
      selectedSupplier,
      loading,
      initialized,
      error,
      searchTerm: filters.searchTerm,
      activeFilter: filters.active,
      sortConfig,
    }),
    [
      suppliers,
      filteredAndSortedSuppliers,
      selectedSupplier,
      loading,
      initialized,
      error,
      filters.searchTerm,
      filters.active,
      sortConfig,
    ]
  );

  const actionsValue = useMemo<SupplierActions>(
    () => ({
      initialize,
      setSearchTerm,
      setActiveFilter,
      handleSort,
      clearFilters,
      fetchSuppliers,
      fetchSupplierById,
      createSupplier,
      updateSupplier,
      deleteSupplier,
      addPayment,
      adjustCredit,
      getSupplierHistory,
      getSupplierById,
    }),
    [
      initialize,
      setSearchTerm,
      setActiveFilter,
      handleSort,
      clearFilters,
      fetchSuppliers,
      fetchSupplierById,
      createSupplier,
      updateSupplier,
      deleteSupplier,
      addPayment,
      adjustCredit,
      getSupplierHistory,
      getSupplierById,
    ]
  );

  const value = useMemo<SupplierContextType>(
    () => ({ ...stateValue, ...actionsValue }),
    [stateValue, actionsValue]
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
};

// ✅ Hooks
export function useSupplierContext() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error(
      "useSupplierContext must be used within a SupplierProvider"
    );
  }
  return context;
}

export function useSupplierState(): SupplierState {
  const {
    suppliers,
    filteredAndSortedSuppliers,
    selectedSupplier,
    loading,
    initialized,
    error,
    searchTerm,
    activeFilter,
    sortConfig,
  } = useSupplierContext();
  return {
    suppliers,
    filteredAndSortedSuppliers,
    selectedSupplier,
    loading,
    initialized,
    error,
    searchTerm,
    activeFilter,
    sortConfig,
  };
}

export function useSupplierActions(): SupplierActions {
  const {
    initialize,
    setSearchTerm,
    setActiveFilter,
    handleSort,
    clearFilters,
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addPayment,
    adjustCredit,
    getSupplierHistory,
    getSupplierById,
  } = useSupplierContext();
  return {
    initialize,
    setSearchTerm,
    setActiveFilter,
    handleSort,
    clearFilters,
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addPayment,
    adjustCredit,
    getSupplierHistory,
    getSupplierById,
  };
}

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

// ✅ Map DB supplier to frontend Supplier
function mapSupplierFromDB(dbSupplier: any): Supplier {
  return {
    id: String(dbSupplier.id),
    name: dbSupplier.name,
    contactName: dbSupplier.contact_name,
    email: dbSupplier.email,
    phone: dbSupplier.phone,
    address: dbSupplier.address,
    notes: dbSupplier.notes,
    preferredPaymentMethod: dbSupplier.preferred_payment_method,
    // Map outstanding_balance to outstandingBalance
    outstandingBalance: dbSupplier.outstanding_balance ?? 0,
    // Map status string to status enum
    status: dbSupplier.status,
    createdAt: dbSupplier.created_at,
    updatedAt: dbSupplier.updated_at,
    history: dbSupplier.history || [],
  };
}
