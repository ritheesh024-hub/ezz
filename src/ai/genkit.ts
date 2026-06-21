import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Centralized Genkit configuration for Ezzy Bites.
 * Standardizes the AI logic node using the stable Gemini 1.5 Flash model.
 */

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ [Ezzy AI] Warning: GEMINI_API_KEY is missing from environment variables.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Standardized stable model identifier for Genkit 1.x to prevent 404 URL mapping errors
  model: 'googleai/gemini-1.5-flash',
});
