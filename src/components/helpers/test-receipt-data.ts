import { Repair } from "@/types/repair";

export const testRepairData: Repair = {
  id: "TEST-001",
  customerName: "John Doe",
  customerPhone: "(555) 123-4567",
  deviceBrand: "Apple",
  deviceModel: "iPhone 13 Pro",
  issueDescription:
    "Screen replacement needed after drop. Device does not turn on.",
  estimatedCost: 299.99,
  status: "Completed",
  paymentStatus: "Paid",
  usedParts: [
    {
      id: 1,
      repairId: 1,
      partName: "OLED Display",
      cost: 189.99,
      quantity: 1,
    },
    {
      id: 2,
      repairId: 1,
      partName: "Battery",
      cost: 49.99,
      quantity: 1,
    },
  ],
  payments: [
    {
      id: "pay-001",
      repair_id: "TEST-001",
      amount: 150.0,
      date: new Date().toISOString(),
      method: "Credit Card",
    },
    {
      id: "pay-002",
      repair_id: "TEST-001",
      amount: 149.99,
      date: new Date().toISOString(),
      method: "Cash",
    },
  ],
  history: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
