
'use client';

import React, {createContext, useContext, useState} from 'react';

interface Repair {
  id: string;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: string;
  dateReceived: Date;
  repairStatus: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface RepairContextType {
  repairs: Repair[];
  addRepair: (repair: Repair) => void;
  updateRepair: (repair: Repair) => void;
  deleteRepair: (id: string) => void;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  const addRepair = (repair: Repair) => {
    setRepairs([...repairs, repair]);
  };

  const updateRepair = (repair: Repair) => {
    setRepairs(repairs.map(r => r.id === repair.id ? repair : r));
  };

  const deleteRepair = (id: string) => {
    setRepairs(repairs.filter(r => r.id !== id));
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

