
'use client';
import { BookingHistory } from "@/components/dashboard/booking-history";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { Suspense } from "react";
import { UserProfile } from "@/components/dashboard/user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
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
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold font-headline mb-8">My Dashboard</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Suspense fallback={<RecommendationsSkeleton />}>
            <SmartRecommendations />
          </Suspense>
          <BookingHistory />
        </div>
        <div className="lg:col-span-1">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
