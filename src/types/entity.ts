export type EntityType = "client" | "supplier";
export type EntityStatus = "active" | "inactive";

export interface EntityBase {
  id: string;
  name: string;
  status: EntityStatus;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  notes?: string;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt: string;
  history?: any[];
}
