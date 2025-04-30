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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {RepairDetail} from './RepairDetail';
import {cn} from '@/lib/utils';
import type {Repair, RepairStatus} from '@/types/repair'; // Assuming types are defined here

export function RepairList() {
  const {repairs, updateRepair} = useRepairContext();
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  const handleStatusChange = (repairId: string, newStatus: RepairStatus) => {
    const repairToUpdate = repairs.find(r => r.id === repairId);
    if (repairToUpdate) {
      updateRepair({...repairToUpdate, repairStatus: newStatus});
    }
  };

  const getStatusColorClass = (status: RepairStatus): string => {
    switch (status) {
      case 'Completed':
        return 'border-l-green-500'; // Direct color for emphasis
      case 'In Progress':
        return 'border-l-orange-500'; // Direct color for emphasis
      case 'Cancelled':
        return 'border-l-destructive'; // Theme color
      case 'Pending':
      default:
        return 'border-l-muted-foreground'; // Theme color
    }
  };

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
            <TableRow
              key={repair.id}
              className={cn(
                'border-l-4', // Base border style
                getStatusColorClass(repair.repairStatus) // Apply status color
              )}
            >
              <TableCell>{repair.customerName}</TableCell>
              <TableCell>{repair.deviceBrand} {repair.deviceModel}</TableCell>
              <TableCell className="max-w-xs truncate">{repair.issueDescription}</TableCell>
              <TableCell>
                <Select
                  value={repair.repairStatus}
                  onValueChange={(newStatus: RepairStatus) => handleStatusChange(repair.id, newStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>${repair.estimatedCost}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelectedRepair(repair)}>View</Button>
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

// StatusBadge component removed as Select is used directly in the table now.
// If needed elsewhere, it can remain, but it's not used in this list component anymore.
