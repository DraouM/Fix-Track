
import type { Metadata } from 'next';
import ClientsPageClient from '@/components/clients/ClientsPageClient';

export const metadata: Metadata = {
  title: 'Client Management - FixTrack',
  description: 'Manage your clients and their information.',
};

export default function ClientsPage() {
  return (
    <ClientsPageClient />
  );
}
