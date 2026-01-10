
'use client';
import React from 'react';
import { Star, Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';


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
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Travelers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their travels
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
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/2">
                <div className="p-4 h-full">
                  <Card className='h-full shadow-lg hover:shadow-xl transition-shadow'>
                    <CardContent className='p-6 flex flex-col justify-between h-full'>
                      <div>
                        <Quote className="w-8 h-8 text-primary opacity-20 mb-4" />
                        <p className="text-muted-foreground italic mb-6">
                          "{testimonial.content}"
                        </p>
                        <div className="flex items-center mb-4">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-muted-foreground">{testimonial.rating}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center mt-6">
                        <Avatar>
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          <p className="text-sm text-muted-foreground/80">{testimonial.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>
    </section>
  );
}
