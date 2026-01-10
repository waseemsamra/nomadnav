'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Hotel, Building2, CalendarIcon, Users, MapPin, Search } from 'lucide-react';

const searchSchema = z.object({
  destination: z.string().min(2, { message: 'Destination must be at least 2 characters.' }),
  dates: z.object({
    from: z.date({ required_error: "A date is required."}),
    to: z.date().optional(),
  }),
  travelers: z.coerce.number().min(1, { message: 'At least one traveler is required.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function SearchForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('flights');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      destination: '',
      travelers: 1,
    },
  });

  useEffect(() => {
    if (isClient) {
        form.reset({
            destination: '',
            dates: { from: new Date() },
            travelers: 1,
        })
    }
  }, [isClient, form]);

  function onSubmit(data: SearchFormValues) {
    const params = new URLSearchParams({
      type: activeTab,
      destination: data.destination,
      checkin: format(data.dates.from, 'yyyy-MM-dd'),
      travelers: String(data.travelers),
    });
    if (data.dates.to) {
      params.set('checkout', format(data.dates.to, 'yyyy-MM-dd'));
    }
    router.push(`/search?${params.toString()}`);
  }
  
  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end p-4">
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem className="lg:col-span-2">
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="e.g., Paris, New York" className="pl-10" {...field} />
                </div>
              </FormControl>
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
    <Card className="shadow-2xl">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:w-auto md:rounded-b-none md:rounded-t-lg md:border-b">
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
      </CardContent>
    </Card>
  );
}
