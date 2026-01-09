'use client';

import React from 'react';
import { useRepairContext } from '@/context/RepairContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Clock } from 'lucide-react'; // Example icons

export function Analytics() {
  const { repairs } = useRepairContext();

  const totalRepairs = repairs.length;
  const completedRepairs = repairs.filter(repair => repair.repairStatus === 'Completed').length;
  const pendingRepairs = repairs.filter(repair => repair.repairStatus === 'Pending').length;
  const inProgressRepairs = repairs.filter(repair => repair.repairStatus === 'In Progress').length; // Added In Progress count

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Repairs"
        value={totalRepairs}
        icon={<Users className="h-5 w-5 text-muted-foreground" />}
        description="Total number of repair orders logged."
      />
      <StatCard
        title="Completed"
        value={completedRepairs}
        icon={<CheckCircle className="h-5 w-5 text-green-500" />} // Use direct color for emphasis
        description="Repairs marked as completed."
      />
       <StatCard
        title="In Progress"
        value={inProgressRepairs}
        icon={<Clock className="h-5 w-5 text-orange-500" />} // Use direct color for emphasis
        description="Repairs currently being worked on."
      />
      <StatCard
        title="Pending"
        value={pendingRepairs}
        icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        description="New repairs waiting to be started."
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
