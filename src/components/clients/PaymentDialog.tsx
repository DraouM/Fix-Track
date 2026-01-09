
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  currentDebt: number;
  onSubmitPayment: (amount: number) => void;
}

export function PaymentDialog({ isOpen, onClose, clientName, currentDebt, onSubmitPayment }: PaymentDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset amount when dialog opens for a new client or reopens
    if (isOpen) {
      setAmount('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    // Optional: Check if payment exceeds debt if you don't want to allow overpayment/credit
    // if (paymentAmount > currentDebt && currentDebt > 0) {
    //   setError(`Payment cannot exceed the current debt of $${currentDebt.toFixed(2)}.`);
    //   return;
    // }
    setError(null);
    onSubmitPayment(paymentAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment for {clientName}</DialogTitle>
          <DialogDescription>
            Current debt: <span className={currentDebt > 0 ? 'text-destructive' : 'text-green-600'}>${currentDebt.toFixed(2)}</span>. Enter the amount paid by the client.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-amount" className="text-right col-span-1">
              Amount
            </Label>
            <Input
              id="payment-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50.00"
              className="col-span-3"
              min="0.01"
              step="0.01"
            />
          </div>
          {error && <p className="col-span-4 text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Icons.check className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
