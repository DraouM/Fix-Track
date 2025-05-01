
'use client';

import React, {useState, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {useToast} from '@/hooks/use-toast';
import {useRepairContext} from '@/context/RepairContext';
import {analyzeRepairIssue, AnalyzeRepairIssueOutput} from '@/ai/flows/analyze-repair-issue';
import type { RepairStatus } from '@/types/repair'; // Import shared type
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card for AI suggestions
import { Icons } from '@/components/icons'; // Assuming icons are available

// Define the possible statuses explicitly for the schema and dropdown
const repairStatuses: [RepairStatus, ...RepairStatus[]] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const repairFormSchema = z.object({
  customerName: z.string().min(2, {
    message: 'Customer Name must be at least 2 characters.',
  }),
  phoneNumber: z.string().regex(/^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
    message: 'Invalid Phone Number format.',
  }),
  deviceBrand: z.string().min(2, {
    message: 'Device Brand must be at least 2 characters.',
  }),
  deviceModel: z.string().min(1, { // Allow single character model names
    message: 'Device Model must be at least 1 character.',
  }),
  issueDescription: z.string().min(10, {
    message: 'Issue Description must be at least 10 characters.',
  }),
  estimatedCost: z.string().regex(/^\d+(\.\d{1,2})?$/, { // Ensure it's a valid currency format
    message: 'Invalid Cost format (e.g., 150.00).',
  }),
  repairStatus: z.enum(repairStatuses), // Use the defined statuses
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairFormProps {
  onSuccess?: () => void; // Optional callback for successful submission
}


export function RepairForm({ onSuccess }: RepairFormProps) {
  const {toast} = useToast();
  const {addRepair} = useRepairContext();
  const [aiSuggestions, setAiSuggestions] = useState<AnalyzeRepairIssueOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      deviceBrand: '',
      deviceModel: '',
      issueDescription: '',
      estimatedCost: '',
      repairStatus: 'Pending', // Default status
    },
    mode: 'onChange', // Validate on change for better UX
  });

  const issueDescription = form.watch('issueDescription');
  const deviceBrand = form.watch('deviceBrand');
  const deviceModel = form.watch('deviceModel');

  // Debounced AI analysis trigger
  useEffect(() => {
    if (issueDescription && issueDescription.length >= 10 && deviceBrand && deviceModel) {
      const handler = setTimeout(async () => {
        setIsAiLoading(true);
        try {
          const analysis = await analyzeRepairIssue({
            deviceBrand: deviceBrand,
            deviceModel: deviceModel,
            issueDescription: issueDescription,
          });
          setAiSuggestions(analysis);
        } catch (error) {
          console.error('AI Analysis Error:', error);
           toast({
             title: 'AI Analysis Failed',
             description: 'Could not fetch AI suggestions.',
             variant: 'destructive',
           });
          setAiSuggestions(null); // Clear suggestions on error
        } finally {
          setIsAiLoading(false);
        }
      }, 1000); // Debounce for 1 second

      return () => {
        clearTimeout(handler); // Clear timeout if inputs change
         // setIsAiLoading(false); // Optionally reset loading state immediately
      };
    } else {
        setAiSuggestions(null); // Clear suggestions if criteria not met
    }
  }, [issueDescription, deviceBrand, deviceModel, toast]);


  function onSubmit(values: RepairFormValues) {
    addRepair({
      ...values,
    });
    toast({
      title: 'Success',
      description: 'Repair added successfully.',
    });
    form.reset(); // Reset form fields to default values
    setAiSuggestions(null); // Clear AI suggestions after submission
    onSuccess?.(); // Call the success callback to close the dialog
  }

  return (
    // Removed the outer Card component, form is now directly in DialogContent
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input placeholder="e.g., 123-456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deviceBrand"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Device Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apple" {...field} />
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
                    <Input placeholder="e.g., iPhone 13" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="issueDescription"
            render={({field}) => (
              <FormItem>
                <FormLabel>Issue Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the issue (min 10 chars)..." {...field} />
                </FormControl>
                <FormMessage />
                 {/* AI Suggestions Section */}
                {isAiLoading && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing issue...
                  </div>
                )}
                {aiSuggestions && !isAiLoading && (
                  <Card className="mt-4 bg-secondary/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base">AI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {aiSuggestions.possibleCauses?.length > 0 && (
                        <div>
                          <h4 className="font-semibold">Possible Causes:</h4>
                          <ul className="list-disc pl-5 text-muted-foreground">
                            {aiSuggestions.possibleCauses.map((cause, index) => (
                              <li key={`cause-${index}`}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                       {aiSuggestions.suggestedSolutions?.length > 0 && (
                         <div>
                           <h4 className="font-semibold">Suggested Solutions:</h4>
                           <ul className="list-disc pl-5 text-muted-foreground">
                             {aiSuggestions.suggestedSolutions.map((solution, index) => (
                               <li key={`solution-${index}`}>{solution}</li>
                             ))}
                           </ul>
                         </div>
                       )}
                      {aiSuggestions.partsNeeded?.length > 0 && (
                        <div>
                          <h4 className="font-semibold">Potential Parts Needed:</h4>
                          <ul className="list-disc pl-5 text-muted-foreground">
                            {aiSuggestions.partsNeeded.map((part, index) => (
                              <li key={`part-${index}`}>{part}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(aiSuggestions.possibleCauses?.length === 0 &&
                        aiSuggestions.suggestedSolutions?.length === 0 &&
                         aiSuggestions.partsNeeded?.length === 0) && (
                           <p className="text-muted-foreground">No specific suggestions found based on the description.</p>
                         )}
                    </CardContent>
                  </Card>
                )}
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimatedCost"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Estimated Cost ($)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g., 150.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="repairStatus"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Initial Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select initial status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {repairStatuses.map(status => (
                         <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting || isAiLoading}>
            {form.formState.isSubmitting || isAiLoading ? (
               <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.plusCircle className="mr-2 h-4 w-4" /> /* Keep icon for consistency */
            )}
            Add Repair
            </Button>
        </form>
      </Form>
  );
}
