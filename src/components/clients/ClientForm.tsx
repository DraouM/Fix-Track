
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
import { useToast } from '@/hooks/use-toast';
import { clientFormSchema, type ClientFormValues, type Client } from '@/types/client';
import { Icons } from '@/components/icons';

interface ClientFormProps {
  onSuccess?: () => void;
  clientToEdit?: Client | null;
  onSubmitForm: (data: ClientFormValues) => void;
}

export function ClientForm({ onSuccess, clientToEdit, onSubmitForm }: ClientFormProps) {
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientToEdit
      ? {
          name: clientToEdit.name,
          phoneNumber: clientToEdit.phoneNumber || '',
          email: clientToEdit.email || '',
          address: clientToEdit.address || '',
        }
      : {
          name: '',
          phoneNumber: '',
          email: '',
          address: '',
        },
  });

  const handleSubmit = (data: ClientFormValues) => {
    onSubmitForm(data);
    toast({
      title: clientToEdit ? 'Client Updated' : 'Client Added',
      description: `${data.name} has been successfully ${clientToEdit ? 'updated' : 'added'}.`,
    });
    // Form reset is handled by key change in parent on success
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
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
