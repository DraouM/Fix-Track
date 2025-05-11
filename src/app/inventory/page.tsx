
import type { Metadata } from 'next';
import InventoryPageClient from '@/components/inventory/InventoryPageClient';

export const metadata: Metadata = {
  title: 'Inventory Management - FixTrack',
  description: 'Manage repair parts and inventory items.',
};

export default function InventoryPage() {
  return (
    <InventoryPageClient />
  );
}
