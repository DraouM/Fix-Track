
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { Client } from '@/types/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No clients found. Click "Add New Client" to get started.</p>;
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of your clients.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead className="hidden lg:table-cell">Address</TableHead>
            <TableHead className="hidden md:table-cell">Debt</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}><TableCell className="font-medium">{client.name}</TableCell><TableCell>{client.phoneNumber || 'N/A'}</TableCell><TableCell className="hidden lg:table-cell max-w-xs truncate">{client.address || 'N/A'}</TableCell><TableCell className="hidden md:table-cell">{'N/A'}</TableCell><TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Icons.edit className="mr-2 h-4 w-4" /> Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(client.id)} className="text-destructive focus:text-destructive">
                      <Icons.trash className="mr-2 h-4 w-4" /> Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
