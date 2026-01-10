'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function Footer() {
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
    { icon: <Facebook />, label: 'Facebook', url: 'https://facebook.com' },
    { icon: <Twitter />, label: 'Twitter', url: 'https://twitter.com' },
    { icon: <Instagram />, label: 'Instagram', url: 'https://instagram.com' },
    { icon: <Linkedin />, label: 'LinkedIn', url: 'https://linkedin.com' }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <Globe className="footer-logo-icon" />
              <span className="footer-logo-text">
                Travel<span className="logo-highlight">Explorer</span>
              </span>
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
              <div key={category} className="footer-links-column">
                <h3 className="footer-links-title">{category}</h3>
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
            © {currentYear} TravelExplorer. All rights reserved.
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
};