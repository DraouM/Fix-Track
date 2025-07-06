
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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Sale } from '@/types/sale';
import { format } from 'date-fns';
import { Icons } from '@/components/icons';

interface PreviousSalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void; // Placeholder for future detail view
}

export function PreviousSalesTable({ sales, onViewDetails }: PreviousSalesTableProps) {
  if (sales.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No sales recorded yet.</p>;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Previous Sales</CardTitle>
        <CardDescription>A history of all completed sales transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] border rounded-md">
          <Table>
            <TableCaption>A list of your past sales.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Sale ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">{sale.id.slice(0, 8)}...</TableCell>
                  <TableCell>{sale.clientName}</TableCell>
                  <TableCell>{format(new Date(sale.saleDate), 'PPp')}</TableCell>
                  <TableCell className="text-right">${sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(sale)} disabled>
                      <Icons.search className="mr-1 h-3 w-3" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Need to import Card components if not already globally available in this scope
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
