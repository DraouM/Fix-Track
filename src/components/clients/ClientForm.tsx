
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { clientFormSchema, type ClientFormValues, type Client } from '@/types/client';
import { Icons } from '@/components/icons';

interface ClientFormProps {
  onSuccess?: () => void;
  clientToEdit?: Client | null;
  onSubmitForm: (data: ClientFormValues) => void;
}

export function ClientForm({ onSuccess, clientToEdit, onSubmitForm }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientToEdit
      ? {
          name: clientToEdit.name,
          phoneNumber: clientToEdit.phoneNumber || '',
          address: clientToEdit.address || '',
        }
      : {
          name: '',
          phoneNumber: '',
          address: '',
        },
  });

  const handleSubmit = (data: ClientFormValues) => {
    onSubmitForm(data);
    toast.success(`${data.name} has been successfully ${clientToEdit ? 'updated' : 'added'}.`);
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional, e.g., 05XXXXXXXX)</FormLabel>
              <FormControl>
                <Input placeholder="0512345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main Street, City, Country" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4 sticky bottom-0 bg-background pb-1">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : clientToEdit ? (
              <Icons.edit className="mr-2 h-4 w-4" />
            ) : (
              <Icons.plusCircle className="mr-2 h-4 w-4" />
            )}
            {clientToEdit ? 'Update Client' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
