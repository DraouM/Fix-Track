'use client';

import React, {createContext, useContext, useState, useEffect} from 'react';
import type { Repair, RepairStatus } from '@/types/repair';

interface RepairContextType {
  repairs: Repair[];
  addRepair: (repair: Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>) => void; // Adjust addRepair signature if needed
  updateRepair: (repair: Repair) => void;
  deleteRepair: (id: string) => void;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

// Helper to get initial state from localStorage
const getInitialState = (): Repair[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const savedRepairs = localStorage.getItem('repairs');
  if (savedRepairs) {
    try {
      // Need to properly parse dates stored as strings
      const parsedRepairs = JSON.parse(savedRepairs).map((repair: any) => ({
        ...repair,
        dateReceived: new Date(repair.dateReceived),
        statusHistory: repair.statusHistory?.map((hist: any) => ({
          ...hist,
          timestamp: new Date(hist.timestamp),
        })),
      }));
      return parsedRepairs;
    } catch (error) {
      console.error("Failed to parse repairs from localStorage", error);
      return [];
    }
  }
  return [];
};


export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [repairs, setRepairs] = useState<Repair[]>(() => getInitialState());

   // Effect to save repairs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // Need to handle Date objects for JSON serialization
      localStorage.setItem('repairs', JSON.stringify(repairs));
    }
  }, [repairs]);


  const addRepair = (newRepairData: Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>) => {
    const now = new Date();
    const repairToAdd: Repair = {
      ...newRepairData,
      id: Date.now().toString(), // Simple ID generation
      dateReceived: now,
      repairStatus: newRepairData.repairStatus || 'Pending', // Ensure status is set
      statusHistory: [{ status: newRepairData.repairStatus || 'Pending', timestamp: now }],
    };
    setRepairs(prevRepairs => [...prevRepairs, repairToAdd]);
  };

  const updateRepair = (updatedRepair: Repair) => {
     const now = new Date();
    setRepairs(prevRepairs =>
      prevRepairs.map(r => {
        if (r.id === updatedRepair.id) {
          // Add to status history if status changed
          const previousStatus = r.statusHistory?.[r.statusHistory.length - 1]?.status ?? r.repairStatus;
          const newStatusHistory = [...(r.statusHistory || [{ status: r.repairStatus, timestamp: r.dateReceived }])]; // Initialize if needed

          if (updatedRepair.repairStatus !== previousStatus) {
            newStatusHistory.push({ status: updatedRepair.repairStatus, timestamp: now });
          }

          return { ...updatedRepair, statusHistory: newStatusHistory };
        }
        return r;
      })
    );
  };

  const deleteRepair = (id: string) => {
    setRepairs(prevRepairs => prevRepairs.filter(r => r.id !== id));
  };

  const value: RepairContextType = {
    repairs,
    addRepair,
    updateRepair,
    deleteRepair,
  };

  return (
    <RepairContext.Provider value={value}>
      {children}
    </RepairContext.Provider>
  );
};

export const useRepairContext = () => {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error('useRepairContext must be used within a RepairProvider');
  }
  return context;
};
