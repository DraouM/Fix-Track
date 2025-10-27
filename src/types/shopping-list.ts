export type OrderStatus = "Draft" | "Pending" | "Ordered" | "Received" | "Cancelled";

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  estimatedCost?: number;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  urgency: "Low" | "Medium" | "High";
  status: OrderStatus;
  orderedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewShoppingListItem = Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt">;