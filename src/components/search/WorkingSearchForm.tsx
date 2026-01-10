'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  Users, 
  Plane,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import Select from 'react-select/async';
import type { AirportOption } from '@/services/travelpayoutsApi';

interface SearchFormData {
  origin: AirportOption | null;
  destination: AirportOption | null;
  departDate: Date;
  returnDate: Date;
  tripType: 'round' | 'oneway';
  passengers: number;
  cabinClass: 'economy' | 'business' | 'first';
}

const WorkingSearchForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SearchFormData>({
    origin: null,
    destination: null,
    departDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  const loadAirportOptions = async (inputValue: string) => {
    try {
      const options = await travelpayoutsApi.searchAirports(inputValue);
      return options;
    } catch (error) {
      console.error('Error loading airport options:', error);
      toast.error('Failed to load airport data');
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.origin || !formData.destination) {
      toast.error('Please select origin and destination airports');
      return;
    }

    if (formData.origin.value === formData.destination.value) {
      toast.error('Origin and destination cannot be the same');
      return;
    }

    if (formData.tripType === 'round' && formData.departDate > formData.returnDate) {
      toast.error('Return date must be after departure date');
      return;
    }

    setLoading(true);

    try {
      const searchParams = new URLSearchParams({
        origin: formData.origin.value,
        destination: formData.destination.value,
        depart_date: format(formData.departDate, 'yyyy-MM-dd'),
        passengers: formData.passengers.toString(),
        cabin_class: formData.cabinClass,
        trip_type: formData.tripType,
      });

      if (formData.tripType === 'round') {
        searchParams.append('return_date', format(formData.returnDate, 'yyyy-MM-dd'));
      }

      console.log('Navigating with params:', Object.fromEntries(searchParams));
      router.push(`/flights/search?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to process search');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapAirports = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };
  
  const popularAirports: AirportOption[] = [
    { value: 'JFK', label: 'New York (JFK)', city: 'New York', country: 'USA' },
    { value: 'LAX', label: 'Los Angeles (LAX)', city: 'Los Angeles', country: 'USA' },
    { value: 'LHR', label: 'London (LHR)', city: 'London', country: 'UK' },
    { value: 'CDG', label: 'Paris (CDG)', city: 'Paris', country: 'France' },
    { value: 'HND', label: 'Tokyo (HND)', city: 'Tokyo', country: 'Japan' },
    { value: 'DXB', label: 'Dubai (DXB)', city: 'Dubai', country: 'UAE' },
    { value: 'SIN', label: 'Singapore (SIN)', city: 'Singapore', country: 'Singapore' },
    { value: 'SYD', label: 'Sydney (SYD)', city: 'Sydney', country: 'Australia' },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-2xl p-6">
      <form onSubmit={handleSubmit}>
        {/* Trip Type */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'round' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              formData.tripType === 'round'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Round Trip
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'oneway' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              formData.tripType === 'oneway'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            One Way
          </button>
        </div>

        {/* Airport Selection */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Plane className="w-4 h-4 inline mr-1" />
                From
              </label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select origin..."
                value={formData.origin}
                onChange={(option) => setFormData(prev => ({ ...prev, origin: option as AirportOption }))}
                loadOptions={loadAirportOptions}
                defaultOptions
                cacheOptions
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Plane className="w-4 h-4 inline mr-1" />
                To
              </label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select destination..."
                value={formData.destination}
                onChange={(option) => setFormData(prev => ({ ...prev, destination: option as AirportOption }))}
                loadOptions={loadAirportOptions}
                defaultOptions
                cacheOptions
              />
            </div>
          </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-3 hidden md:block">
                 <button
                    type="button"
                    onClick={handleSwapAirports}
                    className="bg-background border-2 border-border rounded-full p-2 
                                hover:bg-muted hover:border-ring transition-colors
                                shadow-md z-10"
                    title="Swap airports"
                >
                    <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Departure
            </label>
            <input
              type="date"
              value={format(formData.departDate, 'yyyy-MM-dd')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                departDate: new Date(e.target.value) 
              }))}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 border border-input bg-background rounded-lg 
                       focus:ring-2 focus:ring-ring focus:border-ring"
              required
            />
          </div>

          {formData.tripType === 'round' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Return
              </label>
              <input
                type="date"
                value={format(formData.returnDate, 'yyyy-MM-dd')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  returnDate: new Date(e.target.value) 
                }))}
                min={format(formData.departDate, 'yyyy-MM-dd')}
                className="w-full px-4 py-3 border border-input bg-background rounded-lg 
                         focus:ring-2 focus:ring-ring focus:border-ring"
                required={formData.tripType === 'round'}
              />
            </div>
          )}
        </div>

        {/* Passengers & Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Passengers
            </label>
            <select
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                passengers: parseInt(e.target.value) 
              }))}
              className="w-full px-4 py-3 border border-input bg-background rounded-lg 
                       focus:ring-2 focus:ring-ring focus:border-ring"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cabin Class
            </label>
            <select
              value={formData.cabinClass}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                cabinClass: e.target.value as 'economy' | 'business' | 'first' 
              }))}
              className="w-full px-4 py-3 border border-input bg-background rounded-lg 
                       focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Quick Airport Selection */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">Popular airports:</p>
          <div className="flex flex-wrap gap-2">
            {popularAirports.map((airport) => (
              <button
                key={airport.value}
                type="button"
                onClick={() => {
                  if (!formData.origin) {
                    setFormData(prev => ({ ...prev, origin: airport }));
                  } else if (!formData.destination) {
                    setFormData(prev => ({ ...prev, destination: airport }));
                  }
                }}
                className="text-sm bg-accent/20 text-accent-foreground px-3 py-2 rounded-lg 
                         hover:bg-accent/30 transition-colors border border-accent/20"
              >
                {airport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-primary to-accent
                   hover:opacity-90
                   transition-all duration-300 transform hover:-translate-y-0.5 
                   shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search Flights
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default WorkingSearchForm;
