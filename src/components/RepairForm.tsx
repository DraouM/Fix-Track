
'use client';

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useToast} from '@/hooks/use-toast';
import {useRepairContext} from '@/context/RepairContext';
import {analyzeRepairIssue} from '@/ai/flows/analyze-repair-issue';

const repairFormSchema = z.object({
  customerName: z.string().min(2, {
    message: 'Customer Name must be at least 2 characters.',
  }),
  phoneNumber: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
    message: 'Invalid Phone Number',
  }),
  deviceBrand: z.string().min(2, {
    message: 'Device Brand must be at least 2 characters.',
  }),
  deviceModel: z.string().min(2, {
    message: 'Device Model must be at least 2 characters.',
  }),
  issueDescription: z.string().min(10, {
    message: 'Issue Description must be at least 10 characters.',
  }),
  estimatedCost: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: 'Invalid Cost',
  }),
  dateReceived: z.date(),
  repairStatus: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']),
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

export function RepairForm() {
  const {toast} = useToast();
  const {addRepair} = useRepairContext();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      deviceBrand: '',
      deviceModel: '',
      issueDescription: '',
      estimatedCost: '',
      dateReceived: new Date(),
      repairStatus: 'Pending',
    },
  });

  async function onSubmit(values: RepairFormValues) {
    try {
      const analysis = await analyzeRepairIssue({
        deviceBrand: values.deviceBrand,
        deviceModel: values.deviceModel,
        issueDescription: values.issueDescription,
      });
      setAiSuggestions(analysis?.suggestedSolutions || []);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast({
        title: 'AI Analysis Failed',
        description: 'Failed to generate AI suggestions. Please try again.',
        variant: 'destructive',
      });
    }

    addRepair({
      ...values,
      id: Date.now().toString(), // Simple ID generation for demo
    });
    toast({
      title: 'Success',
      description: 'Repair added successfully.',
    });
    form.reset();
    setAiSuggestions([]);
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Add New Repair</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({field}) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({field}) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deviceBrand"
            render={({field}) => (
              <FormItem>
                <FormLabel>Device Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Apple" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deviceModel"
            render={({field}) => (
              <FormItem>
                <FormLabel>Device Model</FormLabel>
                <FormControl>
                  <Input placeholder="iPhone 13" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issueDescription"
            render={({field}) => (
              <FormItem>
                <FormLabel>Issue Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Cracked screen, won't turn on" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedCost"
            render={({field}) => (
              <FormItem>
                <FormLabel>Estimated Cost</FormLabel>
                <FormControl>
                  <Input placeholder="150.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateReceived"
            render={({field}) => (
              <FormItem>
                <FormLabel>Date Received</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>Please enter the date the device was received.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repairStatus"
            render={({field}) => (
              <FormItem>
                <FormLabel>Repair Status</FormLabel>
                <FormControl>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...field}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {aiSuggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">AI Suggested Solutions:</h3>
          <ul className="list-disc pl-5">
            {aiSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

