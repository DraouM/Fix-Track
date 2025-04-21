
'use client';

import React from 'react';
import {useRepairContext} from '@/context/RepairContext';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

export function Analytics() {
  const {repairs} = useRepairContext();

  const totalRepairs = repairs.length;
  const completedRepairs = repairs.filter(repair => repair.repairStatus === 'Completed').length;
  const pendingRepairs = repairs.filter(repair => repair.repairStatus === 'Pending').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          {totalRepairs}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Completed Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          {completedRepairs}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRepairs}
        </CardContent>
      </Card>
    </div>
  );
}

