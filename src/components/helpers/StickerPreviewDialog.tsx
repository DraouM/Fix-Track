import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StickerTemplate } from "./StickerTemplate";
import { InventoryItem } from "@/types/inventory";
import { Repair } from "@/types/repair";

interface StickerPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | Repair;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function StickerPreviewDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  onCancel,
}: StickerPreviewDialogProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-lg">
        <DialogHeader>
          <DialogTitle>Sticker Preview</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="border rounded bg-gray-50 p-4 flex justify-center">
            <div
              className="bg-white p-2 shadow-sm"
              style={{ width: "2in", height: "1in" }}
            >
              {isMounted && (
                <StickerTemplate
                  data={item}
                  type={"deviceBrand" in item ? "repair" : "inventory"}
                />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-3 text-center">
            This is how your sticker will appear when printed
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Print Sticker</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
