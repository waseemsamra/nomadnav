import { ItineraryForm } from "@/components/itinerary/itinerary-form";

export default function ItineraryPlannerPage() {
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">
            AI Itinerary Planner
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Let our AI craft the perfect trip for you. Just provide your destination, dates, and interests.
          </p>
        </div>
        <ItineraryForm />
      </div>
    </div>
  );
}
