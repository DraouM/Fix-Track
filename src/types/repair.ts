export type RepairStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Repair {
  id: string;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: string; // Keep as string as per original schema
  dateReceived: Date;
  repairStatus: RepairStatus;
  statusHistory?: { status: RepairStatus; timestamp: Date }[]; // Add optional status history
}
