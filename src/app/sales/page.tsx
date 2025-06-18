
import type { Metadata } from 'next';
import SalesPageClient from '@/components/sales/SalesPageClient';

export const metadata: Metadata = {
  title: 'Create Sale - FixTrack',
  description: 'Create new sales transactions for clients.',
};

export default function SalesPage() {
  return <SalesPageClient />;
}
