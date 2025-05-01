
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

// Sample Data for testing
const sampleRepairs: Repair[] = [
  {
    id: '1',
    customerName: 'Alice Wonderland',
    phoneNumber: '555-123-4567',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 12 Pro',
    issueDescription: 'Cracked screen after dropping on concrete.',
    estimatedCost: '249.99',
    dateReceived: new Date('2024-07-28T10:30:00Z'),
    repairStatus: 'Pending',
    statusHistory: [{ status: 'Pending', timestamp: new Date('2024-07-28T10:30:00Z') }],
  },
  {
    id: '2',
    customerName: 'Bob The Builder',
    phoneNumber: '555-987-6543',
    deviceBrand: 'Samsung',
    deviceModel: 'Galaxy S21',
    issueDescription: 'Battery drains very quickly, phone gets hot.',
    estimatedCost: '120.00',
    dateReceived: new Date('2024-07-29T14:00:00Z'),
    repairStatus: 'In Progress',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2024-07-29T14:00:00Z') },
      { status: 'In Progress', timestamp: new Date('2024-07-30T09:15:00Z') },
    ],
  },
    {
    id: '3',
    customerName: 'Charlie Chaplin',
    phoneNumber: '555-111-2222',
    deviceBrand: 'Google',
    deviceModel: 'Pixel 6',
    issueDescription: 'Charging port is loose, sometimes does not charge.',
    estimatedCost: '85.50',
    dateReceived: new Date('2024-07-30T11:00:00Z'),
    repairStatus: 'Completed',
    statusHistory: [
        { status: 'Pending', timestamp: new Date('2024-07-30T11:00:00Z') },
        { status: 'In Progress', timestamp: new Date('2024-07-30T15:30:00Z') },
        { status: 'Completed', timestamp: new Date('2024-07-31T10:00:00Z') }
      ],
  },
   {
    id: '4',
    customerName: 'Diana Prince',
    phoneNumber: '555-333-4444',
    deviceBrand: 'OnePlus',
    deviceModel: '9 Pro',
    issueDescription: 'Water damage, phone does not turn on.',
    estimatedCost: '350.00',
    dateReceived: new Date('2024-07-31T16:45:00Z'),
    repairStatus: 'Pending',
     statusHistory: [{ status: 'Pending', timestamp: new Date('2024-07-31T16:45:00Z') }],
  },
];


// Helper to get initial state from localStorage or use sample data
const getInitialState = (): Repair[] => {
  if (typeof window === 'undefined') {
    return []; // Return empty array on server-side
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
        })) || [{ status: repair.repairStatus, timestamp: new Date(repair.dateReceived) }], // Ensure statusHistory exists
      }));
       // Only return if there are saved repairs, otherwise fall back to sample
      if (parsedRepairs.length > 0) {
        return parsedRepairs;
      }
    } catch (error) {
      console.error("Failed to parse repairs from localStorage", error);
      // Fall through to return sample data on error
    }
  }
  // If no saved data or parsing failed, return sample data
  return sampleRepairs.map(repair => ({ // Ensure sample data dates are Date objects
     ...repair,
     dateReceived: new Date(repair.dateReceived),
     statusHistory: repair.statusHistory?.map(hist => ({
       ...hist,
       timestamp: new Date(hist.timestamp)
     })) || [{ status: repair.repairStatus, timestamp: new Date(repair.dateReceived) }]
   }));
};


export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  // Use useEffect to load initial state only on the client-side
  useEffect(() => {
    setRepairs(getInitialState());
  }, []);


   // Effect to save repairs to localStorage whenever they change
  useEffect(() => {
    // Only save to localStorage if repairs state is not the initial empty array
    // This prevents overwriting potentially loaded sample data before hydration completes
     if (typeof window !== 'undefined' && repairs.length > 0) {
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
    setRepairs(prevRepairs => [repairToAdd, ...prevRepairs]); // Add to the beginning of the list
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
