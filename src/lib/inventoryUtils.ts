import type { HistoryEventType } from "@/types/inventory";

export const getEventTypeBadgeVariant = (
  eventType: HistoryEventType
): "default" | "secondary" | "destructive" | "outline" => {
  switch (eventType) {
    case "Purchased":
      return "default";
    case "Sold":
      return "destructive";
    case "Used in Repair":
      return "secondary";
    case "Returned":
      return "outline";
    case "Manual Correction":
      return "secondary";
    default:
      return "outline";
  }
};
