
'use server';

import { personalizedTravelRecommendations } from '@/ai/flows/personalized-travel-recommendations';
import { generateItinerarySuggestions } from '@/ai/flows/generate-itinerary-suggestions';
import { mockUser } from '@/lib/placeholder-data';
import { z } from 'zod';
import { getFlightSearchResults, searchFlightsRealtime, type Flight, type FlightSearchParams } from '@/services/travelpayoutsApi';

export async function getPersonalizedRecommendations() {
  try {
    const recommendations = await personalizedTravelRecommendations({
      pastBookingHistory: 'Booked a flight to London in October. Stayed at The Londoner hotel.',
      preferences: mockUser.preferences,
      currentTravelTrends: 'Eco-tourism and wellness retreats are popular. Increased interest in travel to Japan and Portugal.',
    });
    return { success: true, data: recommendations };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate recommendations.' };
  }
}

const itinerarySchema = z.object({
  destination: z.string().min(2, { message: 'Please enter a valid destination.' }),
  dates: z.string().min(5, { message: 'Please enter valid dates.' }),
  interests: z.string().min(3, { message: 'Please tell us your interests.' }),
}).superRefine((data, ctx) => {
  if (data.destination && data.interests && data.destination.toLowerCase().includes(data.interests.toLowerCase())) {
    // This is a simple example. A more sophisticated check might be needed.
    if (data.destination === data.interests) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination and interests should not be the same.",
        path: ["interests"],
      });
    }
  }
});


type ItineraryState = {
  success: boolean;
  data: { itinerary: string } | null;
  error: string | null;
}

export async function getItinerary(prevState: ItineraryState, formData: FormData) : Promise<ItineraryState> {
  const validatedFields = itinerarySchema.safeParse({
    destination: formData.get('destination'),
    dates: formData.get('dates'),
    interests: formData.get('interests'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      data: null,
      error: validatedFields.error.flatten().fieldErrors.destination?.[0] || validatedFields.error.flatten().fieldErrors.dates?.[0] || validatedFields.error.flatten().fieldErrors.interests?.[0] || "Invalid input."
    };
  }

  try {
    const itinerary = await generateItinerarySuggestions(validatedFields.data);
    return { success: true, data: itinerary, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, data: null, error: 'Failed to generate itinerary.' };
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchFlightsAction(
  params: FlightSearchParams
): Promise<{ success: boolean; data?: Flight[]; error?: string }> {
  try {
    const searchId = await searchFlightsRealtime(params);
    if (!searchId) {
      throw new Error('Failed to initiate flight search.');
    }

    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      const results = await getFlightSearchResults(searchId);
      
      const tickets = results?.tickets || [];
      if (tickets.length > 0) {
        const flights: Flight[] = tickets.map((ticket: any) => ({
          ...ticket,
          value: ticket.price,
          depart_date: ticket.departure_at,
          return_date: ticket.return_at,
          number_of_changes: ticket.transfers,
          link: ticket.link,
        }));
        return { success: true, data: flights };
      }

      // If results are not ready, wait and try again
      attempts++;
      await sleep(2000); // 2-second delay between polling
    }

    // If no results after all attempts, return empty
    return { success: true, data: [] };

  } catch (error: any) {
    console.error('[Flight Search Action Error]', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred during flight search.';
    return { success: false, error: errorMessage };
  }
}
