'use server';

/**
 * @fileOverview A personalized travel recommendation AI agent.
 *
 * - personalizedTravelRecommendations - A function that generates personalized travel recommendations.
 * - PersonalizedTravelRecommendationsInput - The input type for the personalizedTravelRecommendations function.
 * - PersonalizedTravelRecommendationsOutput - The return type for the personalizedTravelRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedTravelRecommendationsInputSchema = z.object({
  pastBookingHistory: z.string().describe('The user\'s past booking history.'),
  preferences: z.string().describe('The user\'s travel preferences.'),
  currentTravelTrends: z.string().describe('Current travel trends.'),
});
export type PersonalizedTravelRecommendationsInput = z.infer<typeof PersonalizedTravelRecommendationsInputSchema>;

const PersonalizedTravelRecommendationsOutputSchema = z.object({
  hotelRecommendations: z.string().describe('Personalized hotel recommendations.'),
  flightRecommendations: z.string().describe('Personalized flight recommendations.'),
});
export type PersonalizedTravelRecommendationsOutput = z.infer<typeof PersonalizedTravelRecommendationsOutputSchema>;

export async function personalizedTravelRecommendations(
  input: PersonalizedTravelRecommendationsInput
): Promise<PersonalizedTravelRecommendationsOutput> {
  return personalizedTravelRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTravelRecommendationsPrompt',
  input: {schema: PersonalizedTravelRecommendationsInputSchema},
  output: {schema: PersonalizedTravelRecommendationsOutputSchema},
  prompt: `You are a travel expert providing personalized travel recommendations based on user history, preferences, and current trends.

  Past Booking History: {{{pastBookingHistory}}}
  Preferences: {{{preferences}}}
  Current Travel Trends: {{{currentTravelTrends}}}

  Provide personalized hotel and flight recommendations.
  Format the output as JSON: {"hotelRecommendations": "...", "flightRecommendations": "..."}`,
});

const personalizedTravelRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedTravelRecommendationsFlow',
    inputSchema: PersonalizedTravelRecommendationsInputSchema,
    outputSchema: PersonalizedTravelRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
