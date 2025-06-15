
'use client';

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import type { Repair, RepairStatus, UsedPart, PaymentStatus } from '@/types/repair'; // Import PaymentStatus
import { useInventoryContext } from './InventoryContext';

interface RepairContextType {
  repairs: Repair[];
  addRepair: (repair: Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>) => void;
  updateRepair: (updatedRepairData: Repair) => void;
  deleteRepair: (id: string) => void;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

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
    paymentStatus: 'Unpaid', // Added paymentStatus
    statusHistory: [{ status: 'Pending', timestamp: new Date('2024-07-28T10:30:00Z') }],
    usedParts: [],
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
    paymentStatus: 'Paid', // Added paymentStatus
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2024-07-29T14:00:00Z') },
      { status: 'In Progress', timestamp: new Date('2024-07-30T09:15:00Z') },
    ],
    usedParts: [
      { partId: 'inv_2', name: 'Samsung Galaxy S21 Battery', itemType: 'Battery', phoneBrand: 'Samsung', quantity: 1, unitCost: 25 }
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
    paymentStatus: 'Paid', // Added paymentStatus
    statusHistory: [
        { status: 'Pending', timestamp: new Date('2024-07-30T11:00:00Z') },
        { status: 'In Progress', timestamp: new Date('2024-07-30T15:30:00Z') },
        { status: 'Completed', timestamp: new Date('2024-07-31T10:00:00Z') }
      ],
    usedParts: [
      { partId: 'inv_3', name: 'Google Pixel 6 Charging Port Flex', itemType: 'Charger', phoneBrand: 'Google', quantity: 1, unitCost: 10 }
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
    paymentStatus: 'Unpaid', // Added paymentStatus
     statusHistory: [{ status: 'Pending', timestamp: new Date('2024-07-31T16:45:00Z') }],
     usedParts: [],
  },
];

const getInitialState = (): Repair[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const savedRepairs = localStorage.getItem('repairs');
  if (savedRepairs) {
    try {
      const parsedRepairs = JSON.parse(savedRepairs).map((repair: any) => ({
        ...repair,
        dateReceived: new Date(repair.dateReceived),
        statusHistory: repair.statusHistory?.map((hist: any) => ({
          ...hist,
          timestamp: new Date(hist.timestamp),
        })) || [{ status: repair.repairStatus, timestamp: new Date(repair.dateReceived) }],
        usedParts: repair.usedParts || [],
        paymentStatus: repair.paymentStatus || 'Unpaid', // Ensure paymentStatus exists
      }));
      if (parsedRepairs.length > 0) {
        return parsedRepairs;
      }
    } catch (error) {
      console.error("Failed to parse repairs from localStorage", error);
    }
  }
  return sampleRepairs.map(repair => ({
     ...repair,
     dateReceived: new Date(repair.dateReceived),
     statusHistory: repair.statusHistory?.map(hist => ({
       ...hist,
       timestamp: new Date(hist.timestamp)
     })) || [{ status: repair.repairStatus, timestamp: new Date(repair.dateReceived) }],
     usedParts: repair.usedParts || [],
     paymentStatus: repair.paymentStatus || 'Unpaid', // Ensure paymentStatus for sample data
   }));
};


export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const { updateItemQuantity, getItemById } = useInventoryContext();

  useEffect(() => {
    setRepairs(getInitialState());
  }, []);

  useEffect(() => {
     if (typeof window !== 'undefined' && repairs.length >= 0) {
      localStorage.setItem('repairs', JSON.stringify(repairs));
    }
  }, [repairs]);


  const addRepair = useCallback((newRepairData: Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>) => {
    const now = new Date();
    const repairId = Date.now().toString();
    const usedParts = newRepairData.usedParts || [];
    const initialStatus = newRepairData.repairStatus || 'Pending';
    const initialPaymentStatus = newRepairData.paymentStatus || 'Unpaid'; // Handle paymentStatus

    const repairToAdd: Repair = {
      ...newRepairData,
      usedParts,
      id: repairId,
      dateReceived: now,
      repairStatus: initialStatus,
      paymentStatus: initialPaymentStatus, // Set paymentStatus
      statusHistory: [{ status: initialStatus, timestamp: now }],
    };
    setRepairs(prevRepairs => [repairToAdd, ...prevRepairs]);

    const newStatusIsDeductible = initialStatus === 'In Progress' || initialStatus === 'Completed';
    if (newStatusIsDeductible && usedParts.length > 0) {
      usedParts.forEach(part => {
        const item = getItemById(part.partId);
        if (item) {
             if ((item.quantityInStock ?? 0) < part.quantity) {
                console.warn(`Not enough stock for ${item.itemName} to deduct ${part.quantity}. Available: ${item.quantityInStock}. Deducting available stock.`);
                updateItemQuantity(part.partId, -(item.quantityInStock ?? 0));
             } else {
                updateItemQuantity(part.partId, -part.quantity);
             }
        } else {
            console.warn(`Inventory item with ID ${part.partId} not found for deduction.`);
        }
      });
    }
  }, [updateItemQuantity, getItemById]);

  const updateRepair = useCallback((updatedRepairData: Repair) => {
    const now = new Date();
    const repairToUpdate = repairs.find(r => r.id === updatedRepairData.id);

    if (!repairToUpdate) {
        console.warn(`Repair with ID ${updatedRepairData.id} not found for update.`);
        return;
    }

    const oldRepair = { ...repairToUpdate };
    oldRepair.usedParts = oldRepair.usedParts || [];

    const newStatusHistory = [...(oldRepair.statusHistory || [{ status: oldRepair.repairStatus, timestamp: oldRepair.dateReceived }])];
    if (updatedRepairData.repairStatus !== oldRepair.repairStatus) {
        newStatusHistory.push({ status: updatedRepairData.repairStatus, timestamp: now });
    }

    const fullyUpdatedRepairData: Repair = {
        ...updatedRepairData, // This includes the new paymentStatus from the form
        statusHistory: newStatusHistory,
        usedParts: updatedRepairData.usedParts || [],
    };

    setRepairs(prevRepairs =>
        prevRepairs.map(r => r.id === fullyUpdatedRepairData.id ? fullyUpdatedRepairData : r)
    );

    const oldStatusIsDeductible = oldRepair.repairStatus === 'In Progress' || oldRepair.repairStatus === 'Completed';
    const newStatusIsDeductible = fullyUpdatedRepairData.repairStatus === 'In Progress' || fullyUpdatedRepairData.repairStatus === 'Completed';

    const adjustments = new Map<string, number>();

    const oldPartsArray = oldRepair.usedParts;
    const newPartsArray = fullyUpdatedRepairData.usedParts;

    if (!oldStatusIsDeductible && newStatusIsDeductible) {
      newPartsArray.forEach(part => {
        adjustments.set(part.partId, (adjustments.get(part.partId) || 0) - part.quantity);
      });
    } else if (oldStatusIsDeductible && !newStatusIsDeductible) {
      oldPartsArray.forEach(part => {
        adjustments.set(part.partId, (adjustments.get(part.partId) || 0) + part.quantity);
      });
    } else if (newStatusIsDeductible) {
      const oldPartsMap = new Map(oldPartsArray.map(p => [p.partId, p.quantity]));
      const newPartsMap = new Map(newPartsArray.map(p => [p.partId, p.quantity]));

      const allPartIds = new Set([...oldPartsMap.keys(), ...newPartsMap.keys()]);

      allPartIds.forEach(partId => {
        const oldQty = oldPartsMap.get(partId) || 0;
        const newQty = newPartsMap.get(partId) || 0;
        const diff = newQty - oldQty;

        if (diff !== 0) {
          adjustments.set(partId, (adjustments.get(partId) || 0) - diff);
        }
      });
    }

    adjustments.forEach((quantityChange, partId) => {
      if (quantityChange !== 0) {
          const item = getItemById(partId);
          if(item) {
              if (quantityChange < 0 && (item.quantityInStock ?? 0) < Math.abs(quantityChange)) {
                  console.warn(`Not enough stock for ${item.itemName} to deduct ${Math.abs(quantityChange)}. Available: ${item.quantityInStock}. Deducting available stock.`);
                  updateItemQuantity(partId, -(item.quantityInStock ?? 0));
              } else {
                  updateItemQuantity(partId, quantityChange);
              }
          } else {
               console.warn(`Inventory item with ID ${partId} not found for adjustment.`);
          }
      }
    });

  }, [repairs, updateItemQuantity, getItemById]);


  const deleteRepair = useCallback((id: string) => {
    const repairToDelete = repairs.find(r => r.id === id);
    if (repairToDelete) {
        const statusWasDeductible = repairToDelete.repairStatus === 'In Progress' || repairToDelete.repairStatus === 'Completed';
        if (statusWasDeductible && repairToDelete.usedParts && repairToDelete.usedParts.length > 0) {
            repairToDelete.usedParts.forEach(part => {
                updateItemQuantity(part.partId, part.quantity);
            });
        }
    }
    setRepairs(prevRepairs => prevRepairs.filter(r => r.id !== id));
  }, [repairs, updateItemQuantity]);


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
