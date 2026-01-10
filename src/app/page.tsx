
'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Hotel, Shield, TrendingUp, MapPin, Star, Quote, CalendarIcon, Users, Search, ChevronsUpDown, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import placeholderImagesData from '@/lib/placeholder-images.json';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAirports } from '@/hooks/use-travel-search';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const baseSearchSchema = z.object({
  destination: z.string().min(3, { message: 'Destination must be a 3-letter IATA code.' }),
  dates: z.object({
    from: z.date({ required_error: "A date is required."}),
    to: z.date().optional(),
  }),
  travelers: z.coerce.number().min(1, { message: 'At least one traveler is required.' }).max(9, { message: "Maximum 9 travelers."}),
});

type SearchFormValues = z.infer<typeof baseSearchSchema> & { origin?: string };

const AirportCombobox = ({ field, placeholder }: { field: any, placeholder: string }) => {
  const { data: airports, isLoading } = useAirports();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {field.value
              ? airports?.find((airport) => airport.code === field.value)?.name
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search airport..." />
          <CommandList>
            <CommandEmpty>No airport found.</CommandEmpty>
            <CommandGroup>
              {airports?.map((airport) => (
                <CommandItem
                  key={airport.code}
                  value={airport.code}
                  onSelect={(currentValue) => {
                    field.onChange(currentValue === field.value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === airport.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {airport.name} ({airport.code})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


function SearchForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('flights');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formSchema = baseSearchSchema.extend({
    origin: activeTab !== 'hotels' 
      ? z.string().min(3, { message: 'Origin must be a 3-letter IATA code.' }) 
      : z.string().optional(),
  }).superRefine((data, ctx) => {
    if (activeTab !== 'hotels' && data.origin && data.destination && data.origin === data.destination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Origin and destination cannot be the same.",
        path: ["destination"],
      });
    }
    if (data.dates.from && data.dates.to && data.dates.from > data.dates.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Return date must be after departure date.",
        path: ["dates"],
      });
    }
  });


  const form = useForm<SearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
      destination: '',
      travelers: 1,
    },
  });
  
  useEffect(() => {
    if (isClient) {
        form.reset({
            origin: '',
            destination: '',
            dates: { from: new Date() },
            travelers: 1,
        })
    }
  }, [isClient, form]);

  useEffect(() => {
    form.trigger();
  }, [activeTab, form]);

  function onSubmit(data: SearchFormValues) {
    const params = new URLSearchParams({
      type: activeTab,
      destination: data.destination,
      depart_date: format(data.dates.from, 'yyyy-MM-dd'),
      travelers: String(data.travelers),
    });
    if (data.origin && activeTab !== 'hotels') {
      params.set('origin', data.origin);
    }
    if (data.dates.to) {
      params.set('return_date', format(data.dates.to, 'yyyy-MM-dd'));
    }
    router.push(`/search?${params.toString()}`);
  }
  
  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4 items-end p-4">
        {activeTab !== 'hotels' && (
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>Origin</FormLabel>
                <AirportCombobox
                  field={field}
                  placeholder="Select origin"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem className={cn("lg:col-span-2", activeTab === 'hotels' && "lg:col-span-4")}>
              <FormLabel>Destination</FormLabel>
               <AirportCombobox
                field={field}
                placeholder="Select destination"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dates"
          render={({ field }) => (
            <FormItem className="flex flex-col lg:col-span-2">
              <FormLabel>
                {activeTab === 'hotels' ? 'Check-in & Check-out' : 'Departure & Return'}
              </FormLabel>
               {isClient && <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value?.from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, 'LLL dd, y')} -{' '}
                            {format(field.value.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(field.value.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="travelers"
          render={({ field }) => (
            <FormItem className="lg:col-span-2">
              <FormLabel>{activeTab === 'hotels' ? 'Guests' : 'Travelers'}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" min="1" placeholder="e.g., 2" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full lg:col-span-1">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
    </div>
  );

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-auto rounded-lg">
              <TabsTrigger value="flights">
                <Plane className="mr-2 h-4 w-4" /> Flights
              </TabsTrigger>
              <TabsTrigger value="hotels">
                <Hotel className="mr-2 h-4 w-4" /> Hotels
              </TabsTrigger>
              <TabsTrigger value="combined">
                <Building2 className="mr-2 h-4 w-4" /> Flight + Hotel
              </TabsTrigger>
            </TabsList>
            <TabsContent value="flights">
              {renderFormFields()}
            </TabsContent>
            <TabsContent value="hotels">
              {renderFormFields()}
            </TabsContent>
            <TabsContent value="combined">
              {renderFormFields()}
            </TabsContent>
          </Tabs>
        </form>
      </Form>
  );
}


function HeroSection() {
    const heroImage = placeholderImagesData.placeholderImages.find(img => img.id === 'hero');
    
    return (
        <section className="relative h-[600px] flex items-center justify-center text-white">
            {heroImage && (
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{backgroundImage: `url('${heroImage.imageUrl}')`}}
                    data-ai-hint={heroImage.imageHint}
                >
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            )}
            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    Your Journey, Reimagined
                </h1>
                <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
                    Discover and book flights and hotels with personalized
                    recommendations. Nomad Navigator makes travel planning effortless.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button asChild size="lg" className="px-8">
                        <Link href="/search">Start Your Adventure</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="px-8 bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white/20">
                        <Link href="/dashboard">My Dashboard</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

function DestinationGrid() {
    const popularDestinations = placeholderImagesData.placeholderImages.filter(img => 
        ['paris', 'tokyo', 'new-york', 'bali', 'rome', 'dubai'].includes(img.id)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 justify-center">
                {['All', 'Europe', 'Asia', 'America', 'Beach', 'City'].map((filter) => (
                    <Button
                        key={filter}
                        variant={filter === 'All' ? 'default' : 'secondary'}
                        className="rounded-full"
                    >
                        {filter}
                    </Button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularDestinations.map((destination) => (
                    <div
                        key={destination.id}
                        className="group bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                        <div className="relative h-64 overflow-hidden">
                            <Image
                                src={destination.imageUrl}
                                alt={destination.description}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                data-ai-hint={destination.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-4 right-4">
                                <Button size="icon" variant="ghost" className="bg-white/90 hover:bg-white rounded-full">
                                    <span className="text-red-500 text-xl">♥</span>
                                </Button>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-foreground">
                                    From ${destination.price}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-bold text-foreground">
                                    {destination.description}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm font-semibold">{destination.rating}</span>
                                </div>
                            </div>
                            <div className="flex items-center text-muted-foreground mb-4">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">{destination.country}</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                                {destination.summary}
                            </p>
                            <div className="flex gap-3">
                                <Button asChild className="flex-1">
                                    <Link href={`/search?type=flights&destination=${destination.iata}`}>Explore</Link>
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    Quick View
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Testimonials() {
    const testimonials = [
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
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%G%3D%3D',
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
                    opts={{ align: "start", loop: true }}
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
      <Suspense fallback={<div className="h-[600px] bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />}>
        <HeroSection />
      </Suspense>

      <section className="py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 -mt-24 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Find Your Perfect Trip
              </h2>
              <p className="text-gray-600">
                Compare prices from 1000+ travel sites in one search
              </p>
            </div>
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Nomad Navigator
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make travel planning simple, affordable, and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
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

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trending Destinations
            </h2>
            <p className="text-gray-600">
              Discover the most popular places to visit right now
            </p>
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          }>
            <DestinationGrid />
          </Suspense>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8">
              View All Destinations
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">2M+</div>
              <div className="text-blue-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Countries</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Sign up today and get 10% off your first booking
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 bg-white text-blue-600 hover:bg-gray-100">
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white/10">
              Explore Deals
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

    