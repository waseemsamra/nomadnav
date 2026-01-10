
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
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName


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

    