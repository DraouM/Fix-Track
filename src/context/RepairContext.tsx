"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type {
  Repair,
  RepairStatus,
  UsedPart,
  PaymentStatus,
  RepairHistoryType,
} from "@/types/repair";
import { useInventoryContext } from "./InventoryContext";

interface RepairContextType {
  repairs: Repair[];
  addRepair: (
    repair: Omit<Repair, "id" | "dateReceived" | "statusHistory">
  ) => void;
  updateRepair: (updatedRepairData: Repair) => void;
  deleteRepair: (id: string) => void;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

const sampleRepairs: Repair[] = [
  {
    id: "1",
    customerName: "Alice Wonderland",
    phoneNumber: "555-123-4567",
    deviceBrand: "Apple",
    deviceModel: "iPhone 12 Pro",
    issueDescription: "Cracked screen after dropping on concrete.",
    estimatedCost: "249.99",
    dateReceived: new Date("2024-07-28T10:30:00Z"),
    repairStatus: "Pending",
    paymentStatus: "Unpaid",
    statusHistory: [
      { status: "Pending", timestamp: new Date("2024-07-28T10:30:00Z") },
    ],
    usedParts: [],
  },
  {
    id: "2",
    customerName: "Bob The Builder",
    phoneNumber: "555-987-6543",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy S21",
    issueDescription: "Battery drains very quickly, phone gets hot.",
    estimatedCost: "120.00",
    dateReceived: new Date("2024-07-29T14:00:00Z"),
    repairStatus: "In Progress",
    paymentStatus: "Paid",
    statusHistory: [
      { status: "Pending", timestamp: new Date("2024-07-29T14:00:00Z") },
      { status: "In Progress", timestamp: new Date("2024-07-30T09:15:00Z") },
    ],
    usedParts: [
      {
        partId: "inv_2",
        name: "Samsung Galaxy S21 Battery",
        itemType: "Battery",
        phoneBrand: "Samsung",
        quantity: 1,
        unitCost: 25,
      },
    ],
  },
  {
    id: "3",
    customerName: "Charlie Chaplin",
    phoneNumber: "555-111-2222",
    deviceBrand: "Google",
    deviceModel: "Pixel 6",
    issueDescription: "Charging port is loose, sometimes does not charge.",
    estimatedCost: "85.50",
    dateReceived: new Date("2024-07-30T11:00:00Z"),
    repairStatus: "Completed",
    paymentStatus: "Paid",
    statusHistory: [
      { status: "Pending", timestamp: new Date("2024-07-30T11:00:00Z") },
      { status: "In Progress", timestamp: new Date("2024-07-30T15:30:00Z") },
      { status: "Completed", timestamp: new Date("2024-07-31T10:00:00Z") },
    ],
    usedParts: [
      {
        partId: "inv_3",
        name: "Google Pixel 6 Charging Port Flex",
        itemType: "Charger",
        phoneBrand: "Google",
        quantity: 1,
        unitCost: 10,
      },
    ],
  },
  {
    id: "4",
    customerName: "Diana Prince",
    phoneNumber: "555-333-4444",
    deviceBrand: "OnePlus",
    deviceModel: "9 Pro",
    issueDescription: "Water damage, phone does not turn on.",
    estimatedCost: "350.00",
    dateReceived: new Date("2024-07-31T16:45:00Z"),
    repairStatus: "Pending",
    paymentStatus: "Unpaid",
    statusHistory: [
      { status: "Pending", timestamp: new Date("2024-07-31T16:45:00Z") },
    ],
    usedParts: [],
  },
];

const getInitialState = (): Repair[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const savedRepairs = localStorage.getItem("repairs");
  if (savedRepairs) {
    try {
      const parsedRepairs = JSON.parse(savedRepairs).map((repair: any) => {
        // Migrate statusHistory to history if history is missing
        let history = repair.history || [];
        if (!history && repair.statusHistory) {
          history = repair.statusHistory.map((hist: any) => ({
            type: "status" as RepairHistoryType,
            timestamp: hist.timestamp,
            details: `Status changed to ${hist.status}`,
          }));
        }
        return {
          ...repair,
          dateReceived: new Date(repair.dateReceived),
          statusHistory: repair.statusHistory?.map((hist: any) => ({
            ...hist,
            timestamp: new Date(hist.timestamp),
          })) || [
            {
              status: repair.repairStatus,
              timestamp: new Date(repair.dateReceived),
            },
          ],
          usedParts: repair.usedParts || [],
          paymentStatus: repair.paymentStatus || "Unpaid",
          history,
        };
      });
      if (parsedRepairs.length > 0) {
        return parsedRepairs;
      }
    } catch (error) {
      console.error("Failed to parse repairs from localStorage", error);
    }
  }
  return sampleRepairs.map((repair) => {
    // Migrate statusHistory to history for sample repairs
    let history = repair.history || [];
    if (!history && repair.statusHistory) {
      history = repair.statusHistory.map((hist) => ({
        type: "status" as RepairHistoryType,
        timestamp: hist.timestamp,
        details: `Status changed to ${hist.status}`,
      }));
    }
    return {
      ...repair,
      dateReceived: new Date(repair.dateReceived),
      statusHistory: repair.statusHistory?.map((hist) => ({
        ...hist,
        timestamp: new Date(hist.timestamp),
      })) || [
        {
          status: repair.repairStatus,
          timestamp: new Date(repair.dateReceived),
        },
      ],
      usedParts: repair.usedParts || [],
      paymentStatus: repair.paymentStatus || "Unpaid",
      history,
    };
  });
};

export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const { updateItemQuantity } = useInventoryContext();

  useEffect(() => {
    setRepairs(getInitialState());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && repairs.length >= 0) {
      localStorage.setItem("repairs", JSON.stringify(repairs));
    }
  }, [repairs]);

  const addRepair = useCallback(
    (newRepairData: Omit<Repair, "id" | "dateReceived" | "statusHistory">) => {
      const now = new Date();
      const repairId = Date.now().toString();

      const history = [
        {
          type: "status" as RepairHistoryType,
          timestamp: now,
          details: `Status set to ${newRepairData.repairStatus}`,
        },
      ];
      if (newRepairData.usedParts && newRepairData.usedParts.length > 0) {
        history.push({
          type: "parts" as RepairHistoryType,
          timestamp: now,
          details: `Parts added: ${newRepairData.usedParts
            .map((p) => `${p.name} x${p.quantity}`)
            .join(", ")}`,
        });
      }
      history.push({
        type: "payment" as RepairHistoryType,
        timestamp: now,
        details: `Payment status set to ${newRepairData.paymentStatus}`,
      });

      const repairToAdd: Repair = {
        ...newRepairData,
        id: repairId,
        dateReceived: now,
        statusHistory: [{ status: newRepairData.repairStatus, timestamp: now }],
        history,
      };
      setRepairs((prevRepairs) => [repairToAdd, ...prevRepairs]);

      const newStatusIsDeductible =
        repairToAdd.repairStatus === "In Progress" ||
        repairToAdd.repairStatus === "Completed";
      if (
        newStatusIsDeductible &&
        repairToAdd.usedParts &&
        repairToAdd.usedParts.length > 0
      ) {
        repairToAdd.usedParts.forEach((part) => {
          updateItemQuantity(
            part.partId,
            -part.quantity,
            "Used in Repair",
            `For repair #${repairToAdd.id}`,
            repairToAdd.id
          );
        });
      }
    },
    [updateItemQuantity]
  );

  const updateRepair = useCallback(
    (updatedRepairData: Repair) => {
      const now = new Date();
      const oldRepair = repairs.find((r) => r.id === updatedRepairData.id);

      if (!oldRepair) {
        console.warn(
          `Repair with ID ${updatedRepairData.id} not found for update.`
        );
        return;
      }

      const newStatusHistory = [...(oldRepair.statusHistory || [])];
      const newHistory = [...(oldRepair.history || [])];

      // Status change
      if (updatedRepairData.repairStatus !== oldRepair.repairStatus) {
        newStatusHistory.push({
          status: updatedRepairData.repairStatus,
          timestamp: now,
        });
        newHistory.push({
          type: "status" as RepairHistoryType,
          timestamp: now,
          details: `Status changed to ${updatedRepairData.repairStatus}`,
        });
      }

      // Payment status change
      if (updatedRepairData.paymentStatus !== oldRepair.paymentStatus) {
        newHistory.push({
          type: "payment" as RepairHistoryType,
          timestamp: now,
          details: `Payment status changed to ${updatedRepairData.paymentStatus}`,
        });
      }

      // Parts change
      const oldPartsMap = new Map(
        (oldRepair.usedParts || []).map((p) => [p.partId, p.quantity])
      );
      const newPartsMap = new Map(
        (updatedRepairData.usedParts || []).map((p) => [p.partId, p.quantity])
      );
      const allPartIds = new Set([
        ...oldPartsMap.keys(),
        ...newPartsMap.keys(),
      ]);
      let partsChanged = false;
      let partsChangeDetails: string[] = [];
      allPartIds.forEach((partId) => {
        const oldQty = oldPartsMap.get(partId) || 0;
        const newQty = newPartsMap.get(partId) || 0;
        if (oldQty !== newQty) {
          partsChanged = true;
          const partName =
            (updatedRepairData.usedParts || []).find((p) => p.partId === partId)
              ?.name ||
            (oldRepair.usedParts || []).find((p) => p.partId === partId)
              ?.name ||
            partId;
          if (newQty > oldQty) {
            partsChangeDetails.push(`Added ${partName} x${newQty - oldQty}`);
          } else {
            partsChangeDetails.push(`Removed ${partName} x${oldQty - newQty}`);
          }
        }
      });
      if (partsChanged) {
        newHistory.push({
          type: "parts" as RepairHistoryType,
          timestamp: now,
          details: partsChangeDetails.join(", "),
        });
      }

      const fullyUpdatedRepairData: Repair = {
        ...updatedRepairData,
        statusHistory: newStatusHistory,
        usedParts: updatedRepairData.usedParts || [],
        history: newHistory,
      };

      setRepairs((prevRepairs) =>
        prevRepairs.map((r) =>
          r.id === fullyUpdatedRepairData.id ? fullyUpdatedRepairData : r
        )
      );

      const oldStatusIsDeductible =
        oldRepair.repairStatus === "In Progress" ||
        oldRepair.repairStatus === "Completed";
      const newStatusIsDeductible =
        fullyUpdatedRepairData.repairStatus === "In Progress" ||
        fullyUpdatedRepairData.repairStatus === "Completed";

      allPartIds.forEach((partId) => {
        const oldQty = oldStatusIsDeductible ? oldPartsMap.get(partId) || 0 : 0;
        const newQty = newStatusIsDeductible ? newPartsMap.get(partId) || 0 : 0;
        const quantityChange = oldQty - newQty; // If positive, we are returning stock. If negative, we are using more stock.

        if (quantityChange !== 0) {
          const notes = `Stock change for repair #${fullyUpdatedRepairData.id}`;
          const type = quantityChange > 0 ? "Returned" : "Used in Repair";
          updateItemQuantity(
            partId,
            quantityChange,
            type,
            notes,
            fullyUpdatedRepairData.id
          );
        }
      });
    },
    [repairs, updateItemQuantity]
  );

  const deleteRepair = useCallback(
    (id: string) => {
      const repairToDelete = repairs.find((r) => r.id === id);
      if (repairToDelete) {
        const statusWasDeductible =
          repairToDelete.repairStatus === "In Progress" ||
          repairToDelete.repairStatus === "Completed";
        if (
          statusWasDeductible &&
          repairToDelete.usedParts &&
          repairToDelete.usedParts.length > 0
        ) {
          repairToDelete.usedParts.forEach((part) => {
            updateItemQuantity(
              part.partId,
              part.quantity,
              "Returned",
              `From deleted repair #${id}`,
              id
            );
          });
        }
      }
      setRepairs((prevRepairs) => prevRepairs.filter((r) => r.id !== id));
    },
    [repairs, updateItemQuantity]
  );

  const value: RepairContextType = {
    repairs,
    addRepair,
    updateRepair,
    deleteRepair,
  };

  return (
    <RepairContext.Provider value={value}>{children}</RepairContext.Provider>
  );
};

export const useRepairContext = () => {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error("useRepairContext must be used within a RepairProvider");
  }
  return context;
};
