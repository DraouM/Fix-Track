
import type { Metadata } from 'next';
import InventoryPageClient from '@/components/inventory/InventoryPageClient';

export const metadata: Metadata = {
  title: 'Inventory Management - FixTrack',
  description: 'Manage repair parts and inventory items.',
};

export default function InventoryPage() {
  return (
    // The InventoryPageClient itself doesn't need p-4 if AppLayout handles padding.
    // If AppLayout's SidebarInset adds padding, this component is fine.
    // If not, <div className="p-4 md:p-6"> could wrap InventoryPageClient.
    // Current AppLayout adds p-4/p-6 in SidebarInset, so this should be okay.
    <InventoryPageClient />
  );
}
