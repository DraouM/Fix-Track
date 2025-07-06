
import type { Metadata } from 'next';
import StatisticsPageClient from '@/components/statistics/StatisticsPageClient';

export const metadata: Metadata = {
  title: 'Statistics - FixTrack',
  description: 'View repair and financial statistics for your shop.',
};

export default function StatisticsPage() {
  return (
    <StatisticsPageClient />
  );
}
