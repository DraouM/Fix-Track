'use client';

import React from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';

export function RepairDetail({repair, onClose}: { repair: any, onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={!!repair} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repair Details</DialogTitle>
          <DialogDescription>
            Full details for repair ID: {repair?.id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="customerName" className="text-right font-medium">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              value={repair?.customerName}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="phoneNumber" className="text-right font-medium">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={repair?.phoneNumber}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="device" className="text-right font-medium">
              Device
            </label>
            <input
              type="text"
              id="device"
              value={`${repair?.deviceBrand} ${repair?.deviceModel}`}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="issue" className="text-right font-medium">
              Issue
            </label>
            <textarea
              id="issue"
              value={repair?.issueDescription}
              className="col-span-3 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="status" className="text-right font-medium">
              Status
            </label>
            <input
              type="text"
              id="status"
              value={repair?.repairStatus}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            />
          </div>
        </div>
        <Button onClick={handlePrint}>Print Receipt</Button>
      </DialogContent>
    </Dialog>
  );
}
