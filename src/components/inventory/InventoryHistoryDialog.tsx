"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  InventoryItem,
  InventoryHistoryEvent,
  HistoryEventType,
} from "@/types/inventory";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Props ---
interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null; // full item
  historyEvents: InventoryHistoryEvent[]; // history already fetched in parent
}

// --- Badge UI helper ---
const getEventTypeBadgeVariant = (
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

// --- Component ---
export function InventoryHistoryDialog({
  open,
  onOpenChange,
  item,
  historyEvents,
}: InventoryHistoryDialogProps) {
  if (!item) return null;

  // Sort history (newest first)
  const sortedHistory = [...historyEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Movement History: {item.itemName}</DialogTitle>
          <DialogDescription>
            A log of all stock changes for this item. Current stock:{" "}
            <strong>{item.quantityInStock ?? 0}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable history table */}
        <ScrollArea className="max-h-[60vh] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.length > 0 ? (
                sortedHistory.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs">
                      {format(new Date(event.date), "Pp")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEventTypeBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        event.quantityChange > 0
                          ? "text-green-600"
                          : "text-destructive"
                      )}
                    >
                      {event.quantityChange > 0
                        ? `+${event.quantityChange}`
                        : event.quantityChange}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {event.notes || "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No history recorded for this item.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
