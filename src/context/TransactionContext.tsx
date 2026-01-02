"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Transaction,
  TransactionItem,
  TransactionType,
  TransactionWithDetails,
} from "@/types/transaction";
import { useEvents } from "@/context/EventContext";

interface TransactionWorkspace {
  id: string;
  name: string;
  type: TransactionType;
  party_id: string;
  party_type: "Client" | "Supplier";
  items: TransactionItem[];
  paid_amount: number;
  payment_method: string;
  notes: string;
  status: "Draft" | "Completed";
  is_existing?: boolean;
}

interface TransactionContextType {
  workspaces: TransactionWorkspace[];
  activeWorkspaceId: string;
  activeWorkspace: TransactionWorkspace | undefined;
  addWorkspace: (type?: TransactionType) => void;
  removeWorkspace: (id: string) => void;
  setActiveWorkspaceId: (id: string) => void;
  updateActiveWorkspace: (updates: Partial<TransactionWorkspace>) => void;
  editTransaction: (txDetails: TransactionWithDetails) => void;
  clearWorkspaces: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<TransactionWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const { emit } = useEvents();

  // Initialize first workspace if empty
  useEffect(() => {
    if (workspaces.length === 0) {
      addWorkspace("Sale");
    }
  }, []);

  const addWorkspace = (type: TransactionType = "Sale") => {
    const id = uuidv4();
    // We cannot reliably use workspaces.length inside the functional update for naming,
    // so we just use a safe fallback or calculate it differently.
    // Ideally we should use the ref or just keep it simple.
    // For now, let's just append.

    setWorkspaces((prev) => {
      const newWorkspace: TransactionWorkspace = {
        id,
        name: `New ${type} #${prev.length + 1}`,
        type,
        party_id: "",
        party_type: type === "Sale" ? "Client" : "Supplier",
        items: [],
        paid_amount: 0,
        payment_method: "Cash",
        notes: "",
        status: "Draft",
      };
      return [...prev, newWorkspace];
    });
    setActiveWorkspaceId(id);
  };

  const removeWorkspace = (id: string) => {
    const newWorkspaces = workspaces.filter((w) => w.id !== id);
    if (newWorkspaces.length === 0) {
      // Logic from addWorkspace but ensuring it's the *only* workspace
      const newId = uuidv4();
      const type = "Sale";
      const newWorkspace: TransactionWorkspace = {
        id: newId,
        name: `New ${type} #1`,
        type,
        party_id: "",
        party_type: "Client",
        items: [],
        paid_amount: 0,
        payment_method: "Cash",
        notes: "",
        status: "Draft",
      };
      setWorkspaces([newWorkspace]);
      setActiveWorkspaceId(newId);
    } else {
      setWorkspaces(newWorkspaces);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(newWorkspaces[newWorkspaces.length - 1].id);
      }
    }
    // Emit event when workspace is removed
    emit("financial-data-change");
  };

  const updateActiveWorkspace = (updates: Partial<TransactionWorkspace>) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === activeWorkspaceId ? { ...w, ...updates } : w))
    );
    // Emit event if financial data changed
    if (updates.paid_amount !== undefined || updates.status !== undefined) {
      emit("financial-data-change");
    }
  };

  const editTransaction = (txDetails: TransactionWithDetails) => {
    const existing = workspaces.find((w) => w.id === txDetails.transaction.id);
    if (existing) {
      setActiveWorkspaceId(existing.id);
      return;
    }

    const { transaction, items, payments } = txDetails;
    const newWorkspace: TransactionWorkspace = {
      id: transaction.id,
      name:
        transaction.transaction_number ||
        `Edit ${transaction.transaction_type}`,
      type: transaction.transaction_type as TransactionType,
      party_id: transaction.party_id,
      party_type: transaction.party_type as "Client" | "Supplier",
      items,
      paid_amount: transaction.paid_amount,
      payment_method: payments.length > 0 ? payments[0].method : "Cash",
      notes: transaction.notes || "",
      status: transaction.status as "Draft" | "Completed",
      is_existing: true,
    };

    setWorkspaces((prev) => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);

    // Emit event when transaction is edited
    emit("financial-data-change");
  };

  const clearWorkspaces = () => {
    setWorkspaces([]);
    addWorkspace("Sale");
    // Emit event when workspaces are cleared
    emit("financial-data-change");
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <TransactionContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        addWorkspace,
        removeWorkspace,
        setActiveWorkspaceId,
        updateActiveWorkspace,
        editTransaction,
        clearWorkspaces,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      "useTransactions must be used within a TransactionProvider"
    );
  }
  return context;
}
