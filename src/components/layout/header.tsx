import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { User, Search, Bell, Menu, X } from "lucide-react";

export function Header() {
  // Note: Mobile menu state and functionality would need to be implemented
  // For now, this is a static representation.
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/search?type=flights', label: 'Flights' },
    { href: '/search?type=hotels', label: 'Hotels' },
    { href: '/itinerary-planner', label: 'Itinerary Planner' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
           <Button variant="ghost" size="icon" asChild>
            <Link href="/login">
              <User className="h-4 w-4" />
               <span className="sr-only">Login</span>
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Sign In
            </Link>
          </Button>
           <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
