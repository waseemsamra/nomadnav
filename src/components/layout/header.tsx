
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { User, LogIn } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/search?type=flights" className="transition-colors hover:text-primary">Flights</Link>
          <Link href="/search?type=hotels" className="transition-colors hover:text-primary">Hotels</Link>
          <Link href="/itinerary-planner" className="transition-colors hover:text-primary">Itinerary Planner</Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <User className="mr-2 h-4 w-4" />
              My Account
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
