'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Search, Bell, Globe } from 'lucide-react';
import { Logo } from "@/components/shared/logo";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/search?type=flights', label: 'Flights' },
    { href: '/search?type=hotels', label: 'Hotels' },
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
                className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
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
                  className={`mobile-menu-link ${pathname === link.href ? 'active' : ''}`}
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
                Sign