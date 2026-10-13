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
import type { Technician, TechnicianDb } from "@/types/technician";
import { mapTechnicianFromDB } from "@/types/technician";

interface TechnicianState {
  technicians: Technician[];
  activeTechnicians: Technician[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface TechnicianActions {
  initialize: () => Promise<void>;
  fetchTechnicians: () => Promise<void>;
  createTechnician: (data: {
    name: string;
    phone?: string | null;
    specialties?: string | null;
  }) => Promise<Technician | undefined>;
  updateTechnician: (technician: Technician) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  unassignTechnicianRepairs: (id: string) => Promise<void>;
  getTechnicianById: (id?: string | null) => Technician | undefined;
}

export type TechnicianContextType = TechnicianState & TechnicianActions;

const TechnicianContext = createContext<TechnicianContextType | undefined>(
  undefined,
);

async function withAsync<T>(
  action: () => Promise<T>,
  {
    onSuccess,
    onError,
  }: { onSuccess?: (res: T) => void; onError?: (msg: string) => void } = {},
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

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    clearError();
    await withAsync(() => invoke<TechnicianDb[]>("get_technicians"), {
      onSuccess: (data) => setTechnicians(data.map(mapTechnicianFromDB)),
      onError: (msg) => setError(msg),
    });
    setLoading(false);
  }, [clearError]);

  const initialize = useCallback(async () => {
    if (initialized) return;
    try {
      await fetchTechnicians();
      setInitialized(true);
    } catch (err) {
      setError(`Failed to initialize technicians: ${err}`);
    }
  }, [fetchTechnicians, initialized]);

  const createTechnician = useCallback(
    async (data: { name: string; phone?: string | null; specialties?: string | null }) => {
      setLoading(true);
      clearError();
      const technician: TechnicianDb = {
        id: uuidv4(),
        name: data.name,
        phone: data.phone ?? null,
        specialties: data.specialties ?? null,
        active: true,
        created_at: "",
        updated_at: "",
      };

      let created: Technician | undefined;
      await withAsync(() => invoke("insert_technician", { technician }), {
        onSuccess: () => {
          created = mapTechnicianFromDB(technician);
          setTechnicians((prev) =>
            [...prev, created!].sort((a, b) => a.name.localeCompare(b.name)),
          );
          toast.success("Technician added");
        },
        onError: (msg) => setError(msg),
      });
      setLoading(false);
      return created;
    },
    [clearError],
  );

  const updateTechnician = useCallback(
    async (technician: Technician) => {
      setLoading(true);
      clearError();
      const payload: TechnicianDb = {
        id: technician.id,
        name: technician.name,
        phone: technician.phone ?? null,
        specialties: technician.specialties ?? null,
        active: technician.active,
        created_at: technician.createdAt,
        updated_at: technician.updatedAt,
      };

      await withAsync(
        () => invoke("update_technician", { technician: payload }),
        {
          onSuccess: () => {
            setTechnicians((prev) =>
              prev.map((t) => (t.id === technician.id ? technician : t)),
            );
            toast.success("Technician updated");
          },
          onError: (msg) => setError(msg),
        },
      );
      setLoading(false);
    },
    [clearError],
  );

  const deleteTechnician = useCallback(
    async (id: string) => {
      setLoading(true);
      clearError();
      await withAsync(() => invoke("delete_technician", { id }), {
        onSuccess: () => {
          // Backend soft-deactivates when repairs still reference it
          setTechnicians((prev) =>
            prev.map((t) => (t.id === id ? { ...t, active: false } : t)),
          );
          toast.success("Technician removed or deactivated");
        },
        onError: (msg) => setError(msg),
      });
      // Refresh so hard-deleted records disappear
      await fetchTechnicians();
      setLoading(false);
    },
    [clearError, fetchTechnicians],
  );

  const unassignTechnicianRepairs = useCallback(
    async (id: string) => {
      setLoading(true);
      clearError();
      await withAsync(() => invoke("unassign_technician_repairs", { id }), {
        onSuccess: () => toast.success("Repairs unassigned"),
        onError: (msg) => setError(msg),
      });
      setLoading(false);
    },
    [clearError],
  );

  const getTechnicianById = useCallback(
    (id?: string | null) => {
      if (!id) return undefined;
      return technicians.find((t) => t.id === id);
    },
    [technicians],
  );

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const activeTechnicians = useMemo(
    () => technicians.filter((t) => t.active),
    [technicians],
  );

  const stateValue = useMemo<TechnicianState>(
    () => ({ technicians, activeTechnicians, loading, initialized, error }),
    [technicians, activeTechnicians, loading, initialized, error],
  );

  const actionsValue = useMemo<TechnicianActions>(
    () => ({
      initialize,
      fetchTechnicians,
      createTechnician,
      updateTechnician,
      deleteTechnician,
      unassignTechnicianRepairs,
      getTechnicianById,
    }),
    [
      initialize,
      fetchTechnicians,
      createTechnician,
      updateTechnician,
      deleteTechnician,
      unassignTechnicianRepairs,
      getTechnicianById,
    ],
  );

  const value = useMemo<TechnicianContextType>(
    () => ({ ...stateValue, ...actionsValue }),
    [stateValue, actionsValue],
  );

  return (
    <TechnicianContext.Provider value={value}>
      {children}
    </TechnicianContext.Provider>
  );
};

export function useTechnicianContext() {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error(
      "useTechnicianContext must be used within a TechnicianProvider",
    );
  }
  return context;
}
