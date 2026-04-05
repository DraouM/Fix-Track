import { toast } from "sonner";
import { InventoryItem } from "@/types/inventory";

export const exportInventoryToCSV = (items: InventoryItem[]) => {
  try {
    if (!items || items.length === 0) {
      toast.error("No items to export");
      return;
    }

    // Columns
    const headers = [
      "Item ID",
      "Item Name",
      "Brand",
      "Type",
      "Cost",
      "Selling Price",
      "Stock",
      "Alert Threshold",
      "Barcode",
      "Supplier Info"
    ];

    // Helper to escape CSV fields
    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '""';
      const stringField = String(field);
      if (stringField.search(/("|,|\n)/g) >= 0) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const rows = items.map((item) => [
      item.id,
      item.itemName,
      item.phoneBrand,
      item.itemType,
      item.buyingPrice,
      item.sellingPrice,
      item.quantityInStock ?? 0,
      item.lowStockThreshold ?? "",
      item.barcode ?? "",
      item.supplierInfo ?? ""
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const date = new Date().toISOString().split("T")[0];
    
    link.style.display = "none";
    link.href = url;
    link.download = `inventory_export_${date}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast.success(`${items.length} items exported successfully!`, {
      description: "You can find the CSV file in your downloads folder."
    });
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export inventory");
  }
};
