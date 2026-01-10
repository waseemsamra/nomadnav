'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonalizedRecommendations } from '@/app/actions';
import type { PersonalizedTravelRecommendationsOutput } from '@/ai/flows/personalized-travel-recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Hotel, Plane } from 'lucide-react';

export function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState<PersonalizedTravelRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      setIsLoading(true);
      setError(null);
      const result = await getPersonalizedRecommendations();
      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
      setIsLoading(false);
    }
    fetchRecommendations();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-sm text-destructive">{error}</p>;
    }

    if (recommendations) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-1">
              <Plane className="h-4 w-4 text-accent" />
              Flight Ideas
            </h4>
            <p className="text-sm text-muted-foreground">{recommendations.flightRecommendations}</p>
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-1">
              <Hotel className="h-4 w-4 text-accent" />
              Hotel Ideas
            </h4>
            <p className="text-sm text-muted-foreground">{recommendations.hotelRecommendations}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>Smart Recommendations</CardTitle>
        </div>
        <CardDescription>AI-powered suggestions based on your profile and travel trends.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
