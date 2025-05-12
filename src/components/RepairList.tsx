
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'; // Added Edit and Trash2
import {RepairDetail} from './RepairDetail';
import {cn} from '@/lib/utils';
import type {Repair, RepairStatus} from '@/types/repair';
import { Icons } from '@/components/icons'; // Added import for Icons

interface RepairListProps {
  onEditRepair: (repair: Repair) => void; // Callback to open edit form
}

export function RepairList({ onEditRepair }: RepairListProps) {
  const {repairs, updateRepair, deleteRepair} = useRepairContext(); // Added deleteRepair
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<Repair | null>(null);

  const handleStatusChange = (repairId: string, newStatus: RepairStatus) => {
    const repairToUpdate = repairs.find(r => r.id === repairId);
    if (repairToUpdate) {
      // The updateRepair in context now handles inventory adjustments
      updateRepair({...repairToUpdate, repairStatus: newStatus});
    }
  };
  
  const handleDeleteRepair = (repairId: string) => {
    // Consider adding a confirmation dialog here
    deleteRepair(repairId);
  };

  const getStatusColorClass = (status: RepairStatus): string => {
    switch (status) {
      case 'Completed':
        return 'border-l-green-500';
      case 'In Progress':
        return 'border-l-orange-500';
      case 'Cancelled':
        return 'border-l-destructive';
      case 'Pending':
      default:
        return 'border-l-muted-foreground';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Current Repairs</h2>
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your current repairs.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead className="hidden md:table-cell">Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No repairs found. Click "Add New Repair" to get started.
                    </TableCell>
                </TableRow>
            ) : (
                repairs.map((repair) => (
                <TableRow
                    key={repair.id}
                    className={cn(
                    'border-l-4', 
                    getStatusColorClass(repair.repairStatus)
                    )}
                >
                    <TableCell>{repair.customerName}</TableCell>
                    <TableCell>{repair.deviceBrand} {repair.deviceModel}</TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell">{repair.issueDescription}</TableCell>
                    <TableCell>
                    <Select
                        value={repair.repairStatus}
                        onValueChange={(newStatus: RepairStatus) => handleStatusChange(repair.id, newStatus)}
                    >
                        <SelectTrigger className="w-full md:w-[180px] text-xs md:text-sm h-9 md:h-10">
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
                    <TableCell className="text-right">${repair.estimatedCost}</TableCell>
                    <TableCell className="text-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedRepairDetail(repair)}>
                            <Icons.search className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRepair(repair)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Repair
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteRepair(repair.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Repair
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      {selectedRepairDetail && (
        <RepairDetail repair={selectedRepairDetail} onClose={() => setSelectedRepairDetail(null)} />
      )}
    </div>
  );
}

// Simple Icon component
function Icon({ ...props }) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
        </svg>
    )
}

