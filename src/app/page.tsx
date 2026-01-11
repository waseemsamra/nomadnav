
'use client';

import React from 'react';
import { Plane, Hotel, Shield, TrendingUp, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import Testimonials from '@/components/home/Testimonials';

const WorkingSearchForm = dynamic(
  () => import('@/components/search/WorkingSearchForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <div className="text-center mb-6">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-[50px] w-full" />
            <Skeleton className="h-[50px] w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-14 w-full" />
    </div>
    )
  }
);


export default function HomePage() {
  const features = [
    {
      icon: <Plane className="h-10 w-10" />,
      title: "Best Flight Deals",
      description: "Find the cheapest flights from top airlines worldwide",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: <Hotel className="h-10 w-10" />,
      title: "500k+ Hotels",
      description: "Luxury stays to budget rooms with best price guarantee",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Secure Booking",
      description: "Your data is protected with bank-level security",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: "Price Tracking",
      description: "Get alerts when prices drop for your favorite routes",
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="block text-blue-200">Flight</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Compare prices from 1000+ airlines. Book with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="px-4 -mt-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <WorkingSearchForm />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make travel planning simple, affordable, and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`inline-flex p-3 rounded-full ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">2M+</div>
              <div className="text-blue-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Countries</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">Rating</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Sign up today and get 10% off your first booking
          </p>
          <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Create Free Account
          </button>
        </div>
      </section>
    </main>
  );
}
