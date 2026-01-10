
'use client';
import React, { useState, useEffect } from 'react';
import './globals.css';
import { Toaster as RadixToaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from 'react-hot-toast';
import { TravelProvider } from '@/context/TravelContext';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Heart, Menu, X, User, Search, Bell, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                staleTime: 5 * 60 * 1000, // 5 minutes
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

function Logo() {
  return (
    <>
      <Globe className="logo-icon" />
      <span className="logo-text">
        Nomad<span className="logo-highlight">Navigator</span>
      </span>
    </>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/flights/search', label: 'Flights' },
    { href: '/itinerary-planner', label: 'Itinerary Planner' },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <Link href="/" className="navbar-logo">
            <Logo />
          </Link>

          <nav className="navbar-links">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link ${pathname.startsWith(link.href) && link.href !== '/' ? 'active' : (pathname === '/' && link.href === '/') ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <button
              className="navbar-action-icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search />
            </button>
            <button className="navbar-action-icon" aria-label="Notifications">
              <Bell />
              <span className="notification-badge">3</span>
            </button>
            <Link href="/dashboard" className="navbar-action-icon" aria-label="Profile">
              <User />
            </Link>
            <Link href="/login" className="navbar-auth-btn">
              Sign In
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isSearchOpen && (
            <div
              className="search-overlay"
              onClick={() => setIsSearchOpen(false)}
            >
              <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-header">
                  <h3 className="search-title">Search Flights & Hotels</h3>
                  <button
                    className="search-close"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Close search"
                  >
                    <X />
                  </button>
                </div>
                <div className="search-input-container">
                  <Search className="search-input-icon" />
                  <input
                    type="text"
                    placeholder="Where do you want to go?"
                    className="search-input"
                    autoFocus
                  />
                </div>
              </div>
            </div>
        )}
      </header>

      {isMenuOpen && (
          <div
            className="mobile-menu"
          >
            <div className="mobile-menu-links">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-menu-link ${pathname.startsWith(link.href) && link.href !== '/' ? 'active' : (pathname === '/' && link.href === '/') ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mobile-menu-actions">
              <Link href="/login" className="mobile-auth-btn">
                Sign In
              </Link>
              <Link href="/signup" className="mobile-auth-btn secondary">
                Sign up
              </Link>
            </div>
          </div>
      )}
    </>
  );
}


function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Blog', path: '/blog' }
    ],
    Support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Safety Information', path: '/safety' },
      { label: 'Cancellation Options', path: '/cancellations' },
      { label: 'Report Issue', path: '/report' }
    ],
    Legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Accessibility', path: '/accessibility' }
    ],
    Partners: [
      { label: 'Airlines', path: '/partners/airlines' },
      { label: 'Hotels', path: '/partners/hotels' },
      { label: 'Travel Agencies', path: '/partners/agencies' },
      { label: 'Become a Partner', path: '/partners/become' }
    ]
  };

  const socialLinks = [
    { icon: <Facebook size={20} />, label: 'Facebook', url: 'https://facebook.com' },
    { icon: <Twitter size={20} />, label: 'Twitter', url: 'https://twitter.com' },
    { icon: <Instagram size={20} />, label: 'Instagram', url: 'https://instagram.com' },
    { icon: <Linkedin size={20} />, label: 'LinkedIn', url: 'https://linkedin.com' }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <Logo />
            </div>
            <p className="footer-tagline">
              Your gateway to unforgettable journeys around the world.
            </p>
            <div className="footer-social">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.url}
                  className="footer-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-links-grid">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className='footer-links-title'>{category}</h3>
                <ul className="footer-links-list">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link href={link.path} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-newsletter">
          <h3 className="footer-newsletter-title">
            Get Exclusive Travel Deals
          </h3>
          <p className="footer-newsletter-subtitle">
            Subscribe to our newsletter for the latest offers and destination guides.
          </p>
          <form className="footer-newsletter-form">
            <Input
              type="email"
              placeholder="Enter your email"
              className="footer-newsletter-input"
            />
            <Button type="submit" className="footer-newsletter-button">
              Subscribe
            </Button>
          </form>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {currentYear} Nomad Navigator. All rights reserved.
          </div>
          <div className="footer-meta">
            <div className="footer-made-with">
              Made with <Heart className="heart-icon" /> by The Studio Team
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <title>Nomad Navigator</title>
        <meta name="description" content="Your portal to seamless travel booking." />
      </head>
      <body className="font-body antialiased">
        <Providers>
          <TravelProvider>
            <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            </div>
            <RadixToaster />
            <HotToaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
              }}
            />
          </TravelProvider>
        </Providers>
      </body>
    </html>
  );
}
