'use client';

import React, {useState} from 'react';
import {useRepairContext} from '@/context/RepairContext';
import {Button} from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {RepairDetail} from './RepairDetail';

export function RepairList() {
  const {repairs} = useRepairContext();
  const [selectedRepair, setSelectedRepair] = useState(null);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Current Repairs</h2>
      <Table>
        <TableCaption>A list of your current repairs.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repairs.map((repair) => (
            <TableRow key={repair.id}>
              <TableCell>{repair.customerName}</TableCell>
              <TableCell>{repair.deviceBrand} {repair.deviceModel}</TableCell>
              <TableCell>{repair.issueDescription}</TableCell>
              <TableCell>
                <StatusBadge status={repair.repairStatus} />
              </TableCell>
              <TableCell>${repair.estimatedCost}</TableCell>
              <TableCell>
                <Button onClick={() => setSelectedRepair(repair)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedRepair && (
        <RepairDetail repair={selectedRepair} onClose={() => setSelectedRepair(null)} />
      )}
    </div>
  );
}

function StatusBadge({status}: { status: string }) {
  let color = 'gray';
  if (status === 'Completed') {
    color = 'green';
  } else if (status === 'In Progress') {
    color = 'orange';
  } else if (status === 'Cancelled') {
    color = 'red';
  }

  return (
    <div className={`rounded-full px-2 py-1 text-xs font-semibold text-white bg-${color}`}>
      {status}
    </div>
  );
}

