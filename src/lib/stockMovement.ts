import type { StockMovement, HistoryEventType } from "@/types/inventory";

// Raw row returned by the Rust `get_all_stock_movements` command (snake_case)
export interface StockMovementDB {
  id: string;
  item_id: string;
  item_name: string | null;
  phone_brand: string | null;
  item_type: string | null;
  buying_price: number | null;
  selling_price: number | null;
  date: string;
  event_type: string;
  quantity_change: number;
  notes: string | null;
  related_id: string | null;
  movement_price: number | null;
  movement_party: string | null;
  movement_reference: string | null;
}

export function mapMovementFromDB(row: StockMovementDB): StockMovement {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name ?? undefined,
    phoneBrand: row.phone_brand ?? undefined,
    itemType: row.item_type ?? undefined,
    buyingPrice: row.buying_price ?? undefined,
    sellingPrice: row.selling_price ?? undefined,
    date: row.date,
    type: row.event_type as HistoryEventType,
    quantityChange: row.quantity_change,
    notes: row.notes ?? undefined,
    relatedId: row.related_id ?? undefined,
    movementPrice: row.movement_price ?? undefined,
    movementParty: row.movement_party ?? undefined,
    movementReference: row.movement_reference ?? undefined,
  };
}
