"use client";

import { invoke } from "@tauri-apps/api/core";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useEvents } from "@/context/EventContext";
import { getCurrentSession } from "@/lib/api/session";
import type { Client, ClientFormValues, ClientHistoryEvent, ClientStatus } from "@/types/client";

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  searchTerm: string;
}

interface ClientActions {
  initialize: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  fetchClients: () => Promise<void>;
  fetchClientById: (id: string) => Promise<void>;
  createClient: (data: ClientFormValues) => Promise<void>;
  updateClient: (id: string, data: Partial<ClientFormValues>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addPayment: (clientId: string, amount: number, method: string, notes?: string) => Promise<void>;
  adjustBalance: (clientId: string, amount: number, notes?: string) => Promise<void>;
  getClientHistory: (clientId: string) => Promise<void>;
}

export type ClientContextType = ClientState & ClientActions;

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { emit } = useEvents();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<any[]>("get_clients");
      const mapped = data.map(mapClientFromDB);
      setClients(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients");
      toast.error(err.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    if (initialized) return;
    await fetchClients();
    setInitialized(true);
  }, [fetchClients, initialized]);

  const fetchClientById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await invoke<any>("get_client_by_id", { clientId: id });
      if (data) {
        const mapped = mapClientFromDB(data);
        setSelectedClient(mapped);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch client");
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data: ClientFormValues) => {
    setLoading(true);
    const id = uuidv4();
    const clientData = {
      id,
      name: data.name,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      outstanding_balance: data.outstandingBalance || 0,
      status: data.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await invoke("insert_client", { client: clientData });
      toast.success("Client created successfully");
      await fetchClients();
      // Emit event to notify dashboard
      emit('financial-data-change');
    } catch (err: any) {
      toast.error(err.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: string, data: Partial<ClientFormValues>) => {
    setLoading(true);
    try {
      const existing = clients.find(c => c.id === id);
      if (!existing) throw new Error("Client not found");

      const updated = {
        ...existing,
        name: data.name || existing.name,
        contactName: data.contactName || existing.contactName,
        email: data.email || existing.email,
        phone: data.phone || existing.phone,
        address: data.address || existing.address,
        notes: data.notes || existing.notes,
        status: data.status || (existing.status as any),
        updatedAt: new Date().toISOString(),
      };

      await invoke("update_client", { client: mapClientToDB(updated) });
      toast.success("Client updated successfully");
      await fetchClients();
      // Emit event to notify dashboard
      emit('financial-data-change');
    } catch (err: any) {
      toast.error(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  }, [clients, fetchClients]);

  const deleteClient = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await invoke("delete_client", { clientId: id });
      toast.success("Client deleted successfully");
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete client");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = useCallback(async (clientId: string, amount: number, method: string, notes?: string) => {
    setLoading(true);
    try {
      const session = await getCurrentSession();
      await invoke("add_client_payment", { id: uuidv4(), clientId, amount, method, notes, sessionId: session?.id || null });
      await invoke("adjust_client_balance", { clientId, amount: -amount, notes: `Payment via ${method}` });
      toast.success("Payment recorded successfully");
      emit('financial-data-change');
      await fetchClients();
      if (selectedClient?.id === clientId) await fetchClientById(clientId);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchClientById, selectedClient]);

  const adjustBalance = useCallback(async (clientId: string, amount: number, notes?: string) => {
    setLoading(true);
    try {
      await invoke("adjust_client_balance", { clientId, amount, notes });
      toast.success("Balance adjusted successfully");
      emit('financial-data-change');
      await fetchClients();
      if (selectedClient?.id === clientId) await fetchClientById(clientId);
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust balance");
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchClientById, selectedClient]);

  const getClientHistory = useCallback(async (clientId: string) => {
    try {
      const data = await invoke<any[]>("get_client_history", { clientId });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, history: data } : c));
      if (selectedClient?.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, history: data } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch history");
    }
  }, [selectedClient]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const value = useMemo(() => ({
    clients,
    selectedClient,
    loading,
    initialized,
    error,
    searchTerm,
    setSearchTerm,
    initialize,
    fetchClients,
    fetchClientById,
    createClient,
    updateClient,
    deleteClient,
    addPayment,
    adjustBalance,
    getClientHistory,
  }), [clients, selectedClient, loading, initialized, error, searchTerm, initialize, fetchClients, fetchClientById, createClient, updateClient, deleteClient, addPayment, adjustBalance, getClientHistory]);

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClientContext must be used within ClientProvider");
  return context;
};

// Helpers
function mapClientFromDB(db: any): Client {
  return {
    id: db.id,
    name: db.name,
    contactName: db.contact_name,
    email: db.email,
    phone: db.phone,
    address: db.address,
    notes: db.notes,
    outstandingBalance: db.outstanding_balance,
    status: db.status as ClientStatus,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapClientToDB(c: Client): any {
  return {
    id: c.id,
    name: c.name,
    contact_name: c.contactName,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    outstanding_balance: c.outstandingBalance,
    status: c.status,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}
