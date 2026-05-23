export interface UnifiedPayment {
  id: string;
  source_id: string;
  source_type: string;
  amount: number;
  date: string;
  method: string;
  received_by?: string;
  notes?: string;
  source_number?: string;
  party_name?: string;
}
