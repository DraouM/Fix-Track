
'use client';

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import type { Repair, RepairStatus, UsedPart } from '@/types/repair';
import { useInventoryContext } from './InventoryContext'; // Import useInventoryContext

interface RepairContextType {
  repairs: Repair[];
  addRepair: (repair: Omit<Repair, 'id' | 'dateReceived' | 'statusHistory'>) => void;
  updateRepair: (updatedRepairData: Repair) => void; // Parameter changed for clarity
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

    const repairToAdd: Repair = {
      ...newRepairData,
      usedParts,
      id: repairId,
      dateReceived: now,
      repairStatus: initialStatus,
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

    // Capture the state of the repair *before* it's updated in the list
    const oldRepair = { ...repairToUpdate }; 
    oldRepair.usedParts = oldRepair.usedParts || []; // Ensure oldParts has an array

    // Prepare the fully updated repair data, including new status history
    const newStatusHistory = [...(oldRepair.statusHistory || [{ status: oldRepair.repairStatus, timestamp: oldRepair.dateReceived }])];
    if (updatedRepairData.repairStatus !== oldRepair.repairStatus) {
        newStatusHistory.push({ status: updatedRepairData.repairStatus, timestamp: now });
    }
    
    const fullyUpdatedRepairData: Repair = {
        ...updatedRepairData,
        statusHistory: newStatusHistory,
        usedParts: updatedRepairData.usedParts || [], // Ensure usedParts is an array
    };

    // Update the repairs list state
    setRepairs(prevRepairs => 
        prevRepairs.map(r => r.id === fullyUpdatedRepairData.id ? fullyUpdatedRepairData : r)
    );

    // Perform inventory adjustments *after* the repairs state has been updated
    const oldStatusIsDeductible = oldRepair.repairStatus === 'In Progress' || oldRepair.repairStatus === 'Completed';
    const newStatusIsDeductible = fullyUpdatedRepairData.repairStatus === 'In Progress' || fullyUpdatedRepairData.repairStatus === 'Completed';
    
    const adjustments = new Map<string, number>(); // partId -> quantityChange (negative to deduct, positive to add back)

    const oldPartsArray = oldRepair.usedParts;
    const newPartsArray = fullyUpdatedRepairData.usedParts;

    if (!oldStatusIsDeductible && newStatusIsDeductible) {
      // Status changed to deductible: deduct all new parts
      newPartsArray.forEach(part => {
        adjustments.set(part.partId, (adjustments.get(part.partId) || 0) - part.quantity);
      });
    } else if (oldStatusIsDeductible && !newStatusIsDeductible) {
      // Status changed to non-deductible: restock all old parts
      oldPartsArray.forEach(part => {
        adjustments.set(part.partId, (adjustments.get(part.partId) || 0) + part.quantity);
      });
    } else if (newStatusIsDeductible) { 
      // Both old and new status are deductible: compare parts lists for differences
      const oldPartsMap = new Map(oldPartsArray.map(p => [p.partId, p.quantity]));
      const newPartsMap = new Map(newPartsArray.map(p => [p.partId, p.quantity]));

      const allPartIds = new Set([...oldPartsMap.keys(), ...newPartsMap.keys()]);

      allPartIds.forEach(partId => {
        const oldQty = oldPartsMap.get(partId) || 0;
        const newQty = newPartsMap.get(partId) || 0;
        const diff = newQty - oldQty; // Positive if quantity increased/added, negative if decreased/removed

        if (diff !== 0) {
          // If diff is positive, newQty > oldQty, meaning more parts are used, so deduct from stock (-diff)
          // If diff is negative, newQty < oldQty, meaning fewer parts are used, so add back to stock (-diff will be positive)
          adjustments.set(partId, (adjustments.get(partId) || 0) - diff); 
        }
      });
    }

    adjustments.forEach((quantityChange, partId) => {
      if (quantityChange !== 0) {
          const item = getItemById(partId);
          if(item) {
              // If quantityChange is negative (deducting)
              if (quantityChange < 0 && (item.quantityInStock ?? 0) < Math.abs(quantityChange)) {
                  console.warn(`Not enough stock for ${item.itemName} to deduct ${Math.abs(quantityChange)}. Available: ${item.quantityInStock}. Deducting available stock.`);
                  updateItemQuantity(partId, -(item.quantityInStock ?? 0)); // Deduct only what's available
              } else {
                  updateItemQuantity(partId, quantityChange); // Apply the calculated change
              }
          } else {
               console.warn(`Inventory item with ID ${partId} not found for adjustment.`);
          }
      }
    });

  }, [repairs, updateItemQuantity, getItemById]); // Added 'repairs' to dependency array


  const deleteRepair = useCallback((id: string) => {
    const repairToDelete = repairs.find(r => r.id === id);
    if (repairToDelete) {
        const statusWasDeductible = repairToDelete.repairStatus === 'In Progress' || repairToDelete.repairStatus === 'Completed';
        if (statusWasDeductible && repairToDelete.usedParts && repairToDelete.usedParts.length > 0) {
            repairToDelete.usedParts.forEach(part => {
                updateItemQuantity(part.partId, part.quantity); // Restock: quantity is positive
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

