import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItem } from "@/types/inventory";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { toast } from "sonner";
import { Printer, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InventoryBulkActionsProps {
  items: InventoryItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function InventoryBulkActions({
  items,
  selectedIds,
  onSelectionChange,
}: InventoryBulkActionsProps) {
  const { t } = useTranslation();
  const { printStickersBulk } = usePrintUtils();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  const handlePrintSelected = async () => {
    if (selectedItems.length === 0) {
      toast.warning(t('inventory.bulkActions.printError'));
      return;
    }

    setIsProcessing(true);
    try {
      await printStickersBulk(selectedItems);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={
            selectedIds.length > 0 && selectedIds.length === items.length
          }
          onCheckedChange={handleSelectAll}
        />
        <label htmlFor="select-all" className="text-sm font-medium">
          {selectedIds.length === items.length ? t('inventory.bulkActions.deselectAll') : t('inventory.bulkActions.selectAll')}
        </label>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearSelection}
          disabled={selectedIds.length === 0}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('inventory.bulkActions.clear')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintSelected}
          disabled={selectedIds.length === 0 || isProcessing}
        >
          <Printer className="h-4 w-4 mr-2" />
          {t('inventory.bulkActions.printStickers', { 
            count: selectedIds.length, 
            plural: selectedIds.length !== 1 ? 's' : '' 
          })}
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('inventory.bulkActions.selected', { count: selectedIds.length, total: items.length })}
        </div>
      )}
    </div>
  );
}
