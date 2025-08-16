"use client";

import React, { useMemo } from "react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useInventoryContext } from "@/context/InventoryContext";
import type { HistoryEventType } from "@/types/inventory";

interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
}

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

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  itemId,
}: InventoryHistoryDialogProps) {
  const { getItemById } = useInventoryContext();
  const item = itemId ? getItemById(itemId) : null;

  // 🧠 Memoized sorted history
  const sortedHistory = useMemo(() => {
    if (!item?.history) return [];
    return [...item.history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [item]);

  if (!item) return null;

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
            {item.quantityInStock ?? 0}
          </DialogDescription>
        </DialogHeader>
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
