'use server';
/**
 * @fileOverview A Genkit flow for generating a concise summary of customer reviews for a specific dish.
 *
 * - reviewSummaryGenerator - A function that generates a summary of reviews.
 * - ReviewSummaryGeneratorInput - The input type for the reviewSummaryGenerator function.
 * - ReviewSummaryGeneratorOutput - The return type for the reviewSummaryGenerator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReviewSummaryGeneratorInputSchema = z.object({
  reviews: z.array(z.string()).describe('An array of customer reviews for a food item.'),
});
export type ReviewSummaryGeneratorInput = z.infer<typeof ReviewSummaryGeneratorInputSchema>;

const ReviewSummaryGeneratorOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the customer reviews, highlighting popularity and common feedback.'),
});
export type ReviewSummaryGeneratorOutput = z.infer<typeof ReviewSummaryGeneratorOutputSchema>;

export async function reviewSummaryGenerator(input: ReviewSummaryGeneratorInput): Promise<ReviewSummaryGeneratorOutput> {
  return reviewSummaryGeneratorFlow(input);
}

const reviewSummaryGeneratorPrompt = ai.definePrompt({
  name: 'reviewSummaryGeneratorPrompt',
  input: { schema: ReviewSummaryGeneratorInputSchema },
  output: { schema: ReviewSummaryGeneratorOutputSchema },
  prompt: `You are an AI assistant tasked with summarizing customer reviews for a food item.
Read the following reviews and provide a concise summary that highlights common feedback, overall sentiment, and popularity.

Reviews:
{{#each reviews}}
- {{{this}}}
{{/each}}`,
});

const reviewSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'reviewSummaryGeneratorFlow',
    inputSchema: ReviewSummaryGeneratorInputSchema,
    outputSchema: ReviewSummaryGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await reviewSummaryGeneratorPrompt(input);
    return output!;
  }
);
