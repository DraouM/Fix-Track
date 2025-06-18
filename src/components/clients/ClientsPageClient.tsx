
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientForm } from './ClientForm';
import { ClientTable } from './ClientTable';
import { PaymentDialog } from './PaymentDialog'; // Import PaymentDialog
import { useClientContext } from '@/context/ClientContext';
import { Icons } from '@/components/icons';
import type { Client, ClientFormValues } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

function ClientsPageContent() {
  const { clients, addClient, updateClient, deleteClient, getClientById, recordClientPayment, loading } = useClientContext();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phoneNumber && client.phoneNumber.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  const handleEdit = useCallback((client: Client) => {
    const fullClient = getClientById(client.id);
    if (fullClient) {
      setClientToEdit(fullClient);
      setFormInstanceKey(prevKey => prevKey + 1);
      setIsFormOpen(true);
    }
  }, [getClientById]);

  const handleDeleteConfirmation = useCallback((clientId: string) => {
    setClientToDeleteId(clientId);
  }, []);

  const handleDelete = useCallback(() => {
    if (clientToDeleteId) {
      deleteClient(clientToDeleteId);
      toast({ title: 'Client Deleted', description: 'The client has been removed.' });
      setClientToDeleteId(null);
    }
  }, [clientToDeleteId, deleteClient, toast]);

  const handleFormSubmit = (data: ClientFormValues) => {
    if (clientToEdit) {
      updateClient(clientToEdit.id, data);
    } else {
      addClient(data);
    }
    setIsFormOpen(false);
    setClientToEdit(null);
  };

  const openAddNewForm = () => {
    setClientToEdit(null);
    setFormInstanceKey(prevKey => prevKey + 1);
    setIsFormOpen(true);
  };
  
  const handleClientFormDialogOpeChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setClientToEdit(null); 
    }
  }, []);

  const handleOpenPaymentDialog = useCallback((client: Client) => {
    setClientForPayment(client);
    setIsPaymentDialogOpen(true);
  }, []);

  const handleClosePaymentDialog = useCallback(() => {
    setIsPaymentDialogOpen(false);
    setClientForPayment(null);
  }, []);

  const handleProcessPayment = useCallback((amount: number) => {
    if (clientForPayment) {
      recordClientPayment(clientForPayment.id, amount);
      toast({
        title: 'Payment Recorded',
        description: `Payment of $${amount.toFixed(2)} for ${clientForPayment.name} has been recorded.`,
      });
      handleClosePaymentDialog();
    }
  }, [clientForPayment, recordClientPayment, toast, handleClosePaymentDialog]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6"> {/* Removed container, mx-auto, p-4, md:p-6 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
        <Dialog open={isFormOpen} onOpenChange={handleClientFormDialogOpeChange}>
          <DialogTrigger asChild>
            <Button onClick={openAddNewForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>{clientToEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                {clientToEdit ? 'Update the details for this client.' : 'Fill in the details to add a new client.'}
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              key={clientToEdit ? `edit-${clientToEdit.id}-${formInstanceKey}` : `new-${formInstanceKey}`}
              onSuccess={() => {
                setIsFormOpen(false);
                setClientToEdit(null);
              }} 
              clientToEdit={clientToEdit}
              onSubmitForm={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-sm"
          aria-label="Search clients"
        />
      </div>

      <ClientTable 
        clients={filteredClients} 
        onEdit={handleEdit} 
        onDelete={handleDeleteConfirmation}
        onMakePayment={handleOpenPaymentDialog} 
      />

      {clientForPayment && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={handleClosePaymentDialog}
          clientName={clientForPayment.name}
          currentDebt={clientForPayment.debt}
          onSubmitPayment={handleProcessPayment}
        />
      )}

      <AlertDialog open={!!clientToDeleteId} onOpenChange={() => setClientToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ClientsPageClient() {
  return (
    <ClientsPageContent />
  );
}
