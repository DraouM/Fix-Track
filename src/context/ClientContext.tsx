
'use client';

import type { Client, ClientFormValues } from '@/types/client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface ClientContextType {
  clients: Client[];
  addClient: (clientData: ClientFormValues) => void;
  updateClient: (id: string, clientData: ClientFormValues) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  loading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const sampleClients: Client[] = [
  {
    id: 'client_1',
    name: 'Ahmed Zaid',
    phoneNumber: '0550123456',
    address: '123 Rue Didouche Mourad, Alger',
  },
  {
    id: 'client_2',
    name: 'Fatima Cherif',
    phoneNumber: '0661987654',
    address: '456 Avenue de l\'Indépendance, Oran',
  },
];

const getInitialClientsState = (): Client[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const savedClients = localStorage.getItem('clients');
  if (savedClients) {
    try {
      const parsedClients = JSON.parse(savedClients) as Client[];
      if (parsedClients.length > 0) {
        return parsedClients;
      }
    } catch (error) {
      console.error("Failed to parse clients from localStorage", error);
    }
  }
  return sampleClients;
};

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setClients(getInitialClientsState());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }, [clients, loading]);

  const addClient = useCallback((clientData: ClientFormValues) => {
    setClients((prevClients) => [
      { ...clientData, id: `client_${Date.now().toString()}` },
      ...prevClients,
    ]);
  }, []);

  const updateClient = useCallback((id: string, clientData: ClientFormValues) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === id ? { ...client, ...clientData } : client
      )
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prevClients) => prevClients.filter((client) => client.id !== id));
  }, []);

  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  }, [clients]);

  const value = useMemo(() => ({
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    loading,
  }), [clients, addClient, updateClient, deleteClient, getClientById, loading]);

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
