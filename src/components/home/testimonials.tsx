
'use client';

import React from 'react';
import { Quote, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    <section className="testimonials-section py-16 bg-background">
      <div className="container">
        <div className="section-header text-center mb-12">
          <h2 className="section-title text-3xl md:text-4xl font-bold font-headline mb-4">What Our Travelers Say</h2>
          <p className="section-subtitle text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their travels.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2">
                <div className="p-1 h-full">
                  <Card className="testimonial-card h-full flex flex-col">
                    <CardContent className="flex flex-col flex-grow items-start justify-between p-6 space-y-6">
                        <Quote className="testimonial-quote h-8 w-8 text-primary" />
                        <p className="testimonial-content text-muted-foreground text-base flex-grow">
                            {testimonial.content}
                        </p>
                        <div className="testimonial-author flex items-center gap-4 w-full pt-4 border-t">
                            <Avatar className='testimonial-avatar'>
                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="testimonial-info flex-grow">
                                <h4 className="testimonial-name font-semibold">{testimonial.name}</h4>
                                <p className="testimonial-role text-sm text-muted-foreground">{testimonial.role} - {testimonial.location}</p>
                            </div>
                            <div className="testimonial-rating flex items-center gap-1 shrink-0">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                                {[...Array(5 - testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-muted-foreground/50" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="testimonial-nav prev" />
          <CarouselNext className="testimonial-nav next" />
        </Carousel>
      </div>
    </section>
  );
};
