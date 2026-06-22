import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Centralized Genkit configuration for Ezzy Bites.
 * Standardizes the AI logic node using the stable Gemini 1.5 Flash model.
 * Automatically detects GOOGLE_GENAI_API_KEY from environment variables.
 */

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Standardized stable model identifier for Genkit 1.x
  model: 'googleai/gemini-1.5-flash',
});
