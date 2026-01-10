'use server';

/**
 * @fileOverview Generates itinerary suggestions based on destination, dates, and interests.
 *
 * - generateItinerarySuggestions - A function that generates itinerary suggestions.
 * - GenerateItinerarySuggestionsInput - The input type for the generateItinerarySuggestions function.
 * - GenerateItinerarySuggestionsOutput - The return type for the generateItinerarySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItinerarySuggestionsInputSchema = z.object({
  destination: z.string().describe('The desired destination for the itinerary.'),
  dates: z.string().describe('The travel dates for the itinerary.'),
  interests: z.string().describe('The interests of the user for the itinerary.'),
});
export type GenerateItinerarySuggestionsInput = z.infer<
  typeof GenerateItinerarySuggestionsInputSchema
>;

const GenerateItinerarySuggestionsOutputSchema = z.object({
  itinerary: z.string().describe('The generated itinerary suggestions.'),
});
export type GenerateItinerarySuggestionsOutput = z.infer<
  typeof GenerateItinerarySuggestionsOutputSchema
>;

export async function generateItinerarySuggestions(
  input: GenerateItinerarySuggestionsInput
): Promise<GenerateItinerarySuggestionsOutput> {
  return generateItinerarySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItinerarySuggestionsPrompt',
  input: {schema: GenerateItinerarySuggestionsInputSchema},
  output: {schema: GenerateItinerarySuggestionsOutputSchema},
  prompt: `You are a travel expert. Generate an itinerary suggestion based on the following information:

Destination: {{{destination}}}
Dates: {{{dates}}}
Interests: {{{interests}}}

Itinerary:`,
});

const generateItinerarySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateItinerarySuggestionsFlow',
    inputSchema: GenerateItinerarySuggestionsInputSchema,
    outputSchema: GenerateItinerarySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
