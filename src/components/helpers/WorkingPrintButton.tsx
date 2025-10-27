// components/helpers/WorkingPrintButton.tsx
"use client";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export const WorkingPrintButton: React.FC<{ repair: any }> = ({ repair }) => {
  const handlePrint = async () => {
    try {
      // Generate proper ESC/POS commands
      const escposData = generateSimpleEscpos(repair);

      // Use the simple printer function
      const result = await invoke<string>("print_to_thermal_printer", {
        commands: Array.from(escposData),
      });

      toast.success(result);
    } catch (error) {
      toast.error(`Print failed: ${error}`);
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      🖨️ Print Receipt
    </button>
  );
};

// Simple ESC/POS generator that works with real printers
function generateSimpleEscpos(repair: any): Uint8Array {
  const lines = [
    "\x1B@", // Initialize printer
    "\x1B\x61\x01", // Center align
    "PHONE REPAIR SHOP",
    "----------------",
    "\x1B\x61\x00", // Left align
    `Invoice: ${repair.id}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Time: ${new Date().toLocaleTimeString()}`,
    "",
    `Customer: ${repair.customerName}`,
    `Phone: ${repair.customerPhone}`,
    `Device: ${repair.deviceBrand} ${repair.deviceModel}`,
    "",
    "Thank you for your business!",
    "",
    "\x1D\x56\x41", // Cut paper
  ];

  const text = lines.join("\n");
  const encoder = new TextEncoder();
  return encoder.encode(text);
}
