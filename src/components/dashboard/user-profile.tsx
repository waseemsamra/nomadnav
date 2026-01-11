
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUser } from "@/lib/placeholder-data";
import placeholderImages from "@/lib/placeholder-images.json";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const userAvatar = placeholderImages.placeholderImages.find((img) => img.id === 'user-avatar');

export function UserProfile() {
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
