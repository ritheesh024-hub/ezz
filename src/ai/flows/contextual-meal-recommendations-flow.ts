'use server';
/**
 * @fileOverview A Genkit flow for providing personalized meal recommendations based on current weather, time of day, and user mood.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContextualMealRecommendationsInputSchema = z.object({
  weather: z.string().describe('Current weather conditions.'),
  timeOfDay: z.string().describe('Current time of day.'),
  userMood: z.string().describe('User mood.')
});
export type ContextualMealRecommendationsInput = z.infer<typeof ContextualMealRecommendationsInputSchema>;

const ContextualMealRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string().describe('Name of the recommended meal.'),
      description: z.string().describe('A short description of the meal.'),
      reasoning: z.string().describe('The reasoning.')
    })
  )
});
export type ContextualMealRecommendationsOutput = z.infer<typeof ContextualMealRecommendationsOutputSchema>;

export async function contextualMealRecommendations(
  input: ContextualMealRecommendationsInput
): Promise<ContextualMealRecommendationsOutput> {
  return contextualMealRecommendationsFlow(input);
}

const mealRecommendationPrompt = ai.definePrompt({
  name: 'mealRecommendationPrompt',
  input: { schema: ContextualMealRecommendationsInputSchema },
  output: { schema: ContextualMealRecommendationsOutputSchema },
  prompt: `You are an AI assistant for "Ezzy Bites". Provide 2-3 personalized meal recommendations for:
- Weather: {{{weather}}}
- Time: {{{timeOfDay}}}
- Mood: {{{userMood}}}`
});

const contextualMealRecommendationsFlow = ai.defineFlow(
  {
    name: 'contextualMealRecommendationsFlow',
    inputSchema: ContextualMealRecommendationsInputSchema,
    outputSchema: ContextualMealRecommendationsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await mealRecommendationPrompt(input);
      if (!output) throw new Error('Failed to get recommendations.');
      return output;
    } catch (error: any) {
      return {
        recommendations: [
          {
            name: "Chef's Classic Biryani",
            description: "Our signature Hyderabadi Chicken Biryani with long-grain basmati rice.",
            reasoning: "The weather and time are perfect for a hearty, comforting classic."
          },
          {
            name: "Filter Coffee & Snacks",
            description: "Traditional South Indian decoction coffee with spicy veg maggie.",
            reasoning: "A high-speed snack node to elevate your afternoon vibe."
          }
        ]
      };
    }
  }
);
