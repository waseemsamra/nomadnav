'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getItinerary } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wand2, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  success: false,
  data: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Itinerary
        </>
      )}
    </Button>
  );
}

export function ItineraryForm() {
  const [state, formAction] = useFormState(getItinerary, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success === false && state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      })
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form action={formAction} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" name="destination" placeholder="e.g., Tokyo, Japan" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dates">Travel Dates</Label>
              <Input id="dates" name="dates" placeholder="e.g., October 10-17, 2024" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interests">Interests & Preferences</Label>
              <Textarea id="interests" name="interests" placeholder="e.g., Food, history, anime, temples, budget-friendly options" required />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      
      {state.success && state.data && (
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground whitespace-pre-wrap">
              {state.data.itinerary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
