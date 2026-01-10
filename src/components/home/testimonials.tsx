'use client';

import React from 'react';
import { Quote, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  location: string;
}

const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Frequent Traveler',
      content: 'Nomad Navigator helped me save over $500 on my trip to Japan. The hotel recommendations were spot on and the flight prices were unbeatable!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      location: 'New York, USA'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Business Traveler',
      content: 'As someone who travels weekly for work, I rely on Nomad Navigator for the best deals. The price tracking feature is a game-changer!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      location: 'San Francisco, USA'
    },
    {
      id: 3,
      name: 'Emma Wilson',
      role: 'Travel Blogger',
      content: 'I\'ve used dozens of travel sites, but none compare to Nomad Navigator. The interface is beautiful and finding deals is so easy.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      location: 'London, UK'
    },
    {
      id: 4,
      name: 'David Rodriguez',
      role: 'Family Traveler',
      content: 'Planning a family vacation has never been easier. We saved 30% on our Hawaii trip thanks to the bundle deals.',
      rating: 4,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      location: 'Miami, USA'
    }
];

export function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What Our Travelers Say</h2>
          <p className="section-subtitle">
            Join thousands of satisfied customers who trust us with their travels
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="testimonials-container"
        >
          <CarouselContent className="testimonials-slider">
            
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="testimonial-card">
                  <Quote className="testimonial-quote" />
                  <p className="testimonial-content">{testimonial.content}</p>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                    <span className="rating-text">{testimonial.rating}/5</span>
                  </div>
                  <div className="testimonial-author">
                    <Avatar className="testimonial-avatar">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="testimonial-info">
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
              </CarouselItem>
            ))}
            
          </CarouselContent>
          <CarouselPrevious className="testimonial-nav prev" />
          <CarouselNext className="testimonial-nav next" />
        </Carousel>
      </div>
    </section