
'use client';
import { BookingHistory } from "@/components/dashboard/booking-history";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mockUser } from "@/lib/placeholder-data";
import placeholderImagesData from '@/lib/placeholder-images.json';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


function UserProfile() {
  const userAvatar = placeholderImagesData.placeholderImages.find((img) => img.id === 'user-avatar');
  const initials = mockUser.name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>My Profile</CardTitle>
            <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Edit Profile</span>
            </Button>
        </div>
        <CardDescription>Your personal information and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={mockUser.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{mockUser.name}</h3>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold text-muted-foreground">Travel Preferences</h4>
          <p className="text-foreground bg-secondary rounded-md p-3">{mockUser.preferences}</p>
        </div>
      </CardContent>
    </Card>
  );
}


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
