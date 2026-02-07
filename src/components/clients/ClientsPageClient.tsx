
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
import { PaymentDialog } from './PaymentDialog'; 
import { useClientContext } from '@/context/ClientContext';
import { Icons } from '@/components/icons';
import type { Client, ClientFormValues } from '@/types/client';
import { toast } from 'sonner';

function ClientsPageContent() {
  const {
    clients,
    createClient,
    updateClient,
    deleteClient,
    fetchClientById,
    addPayment,
    loading,
  } = useClientContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  const handleEdit = useCallback(
    (clientId: string) => {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        setClientToEdit(client);
        setFormInstanceKey((prevKey) => prevKey + 1);
        setIsFormOpen(true);
      }
    },
    [clients]
  );

  const handleDeleteConfirmation = useCallback((clientId: string) => {
    setClientToDeleteId(clientId);
  }, []);

  const handleDelete = useCallback(() => {
    if (clientToDeleteId) {
      const clientName =
        clients.find((c) => c.id === clientToDeleteId)?.name || "The client";
      deleteClient(clientToDeleteId);
      toast.success(`${clientName} has been removed.`);
      setClientToDeleteId(null);
    }
  }, [clientToDeleteId, deleteClient, clients]);

  const openAddNewForm = () => {
    setClientToEdit(null);
    setFormInstanceKey((prevKey) => prevKey + 1);
    setIsFormOpen(true);
  };

  const handleClientFormDialogOpeChange = useCallback((isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setClientToEdit(null);
    }
  }, []);

  const handleOpenPaymentDialog = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientForPayment(client);
      setIsPaymentDialogOpen(true);
    }
  }, [clients]);

  const handleClosePaymentDialog = useCallback(() => {
    setIsPaymentDialogOpen(false);
    setClientForPayment(null);
  }, []);

  const handleProcessPayment = useCallback(
    (amount: number) => {
      if (clientForPayment) {
        addPayment(clientForPayment.id, amount, "Cash");
        toast.success(
          `Payment of $${amount.toFixed(2)} for ${clientForPayment.name} has been recorded.`
        );
        handleClosePaymentDialog();
      }
    },
    [clientForPayment, addPayment, handleClosePaymentDialog]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
        <Dialog
          open={isFormOpen}
          onOpenChange={handleClientFormDialogOpeChange}
        >
          <DialogTrigger asChild>
            <Button onClick={openAddNewForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
            <DialogHeader className="p-8 pb-4 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {clientToEdit ? "Modify Credentials" : "Register Identity"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {clientToEdit
                  ? "Update the details for this architectural entity."
                  : "Populate the fields to establish a new client identity."}
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              key={
                clientToEdit
                  ? `edit-${clientToEdit.id}-${formInstanceKey}`
                  : `new-${formInstanceKey}`
              }
              clientId={clientToEdit?.id}
              onSuccess={() => {
                setIsFormOpen(false);
                setClientToEdit(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setClientToEdit(null);
              }}
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
        loading={loading}
        onEditClient={handleEdit}
        onRecordPayment={handleOpenPaymentDialog}
      />

      {clientForPayment && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={handleClosePaymentDialog}
          clientName={clientForPayment.name}
          currentDebt={clientForPayment.outstandingBalance}
          onSubmitPayment={handleProcessPayment}
        />
      )}

      <AlertDialog
        open={!!clientToDeleteId}
        onOpenChange={() => setClientToDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground/70">
              This action cannot be undone. This will permanently delete the
              client record from the architecture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold text-xs uppercase tracking-widest">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
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
