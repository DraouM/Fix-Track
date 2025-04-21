// analyze-repair-issue.ts
'use server';

/**
 * @fileOverview Analyzes a repair issue description and suggests possible causes and solutions.
 *
 * - analyzeRepairIssue - A function that handles the repair issue analysis process.
 * - AnalyzeRepairIssueInput - The input type for the analyzeRepairIssue function.
 * - AnalyzeRepairIssueOutput - The return type for the analyzeRepairIssue function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeRepairIssueInputSchema = z.object({
  issueDescription: z.string().describe('The description of the repair issue provided by the customer.'),
  deviceModel: z.string().describe('The model of the device that needs repair.'),
  deviceBrand: z.string().describe('The brand of the device that needs repair.')
});
export type AnalyzeRepairIssueInput = z.infer<typeof AnalyzeRepairIssueInputSchema>;

const AnalyzeRepairIssueOutputSchema = z.object({
  possibleCauses: z.array(z.string()).describe('Possible causes of the described issue.'),
  suggestedSolutions: z.array(z.string()).describe('Suggested solutions or troubleshooting steps for the issue.'),
  partsNeeded: z.array(z.string()).describe('Likely parts needed for the repair, if applicable.')
});
export type AnalyzeRepairIssueOutput = z.infer<typeof AnalyzeRepairIssueOutputSchema>;

export async function analyzeRepairIssue(input: AnalyzeRepairIssueInput): Promise<AnalyzeRepairIssueOutput> {
  return analyzeRepairIssueFlow(input);
}

const analyzeRepairIssuePrompt = ai.definePrompt({
  name: 'analyzeRepairIssuePrompt',
  input: {
    schema: z.object({
      issueDescription: z.string().describe('The description of the repair issue provided by the customer.'),
      deviceModel: z.string().describe('The model of the device that needs repair.'),
      deviceBrand: z.string().describe('The brand of the device that needs repair.')
    }),
  },
  output: {
    schema: z.object({
      possibleCauses: z.array(z.string()).describe('Possible causes of the described issue.'),
      suggestedSolutions: z.array(z.string()).describe('Suggested solutions or troubleshooting steps for the issue.'),
      partsNeeded: z.array(z.string()).describe('Likely parts needed for the repair, if applicable.')
    }),
  },
  prompt: `You are an expert technician specializing in phone and electronics repair. A customer has described an issue with their device.

  Device Brand: {{{deviceBrand}}}
  Device Model: {{{deviceModel}}}
  Issue Description: {{{issueDescription}}}

  Based on the issue description, suggest possible causes, solutions, and any parts that might be needed for the repair.  Be specific with part names if possible.  The device brand and model are important context for your diagnosis.

  Format your response as a JSON object.
`,
});

const analyzeRepairIssueFlow = ai.defineFlow<
  typeof AnalyzeRepairIssueInputSchema,
  typeof AnalyzeRepairIssueOutputSchema
>({
  name: 'analyzeRepairIssueFlow',
  inputSchema: AnalyzeRepairIssueInputSchema,
  outputSchema: AnalyzeRepairIssueOutputSchema,
}, async input => {
  const {output} = await analyzeRepairIssuePrompt(input);
  return output!;
});
