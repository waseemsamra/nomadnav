
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  Users, 
  ChevronDown, 
  Plane,
  MapPin,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import AsyncSelect from 'react-select/async';
import { type SingleValue } from 'react-select';
import { type AirportOption, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

interface SearchFormData {
  origin: AirportOption | null;
  destination: AirportOption | null;
  departDate: Date;
  returnDate: Date;
  tripType: 'round' | 'oneway';
  passengers: number;
  cabinClass: 'economy' | 'business' | 'first';
}

interface TravelSearchFormProps {
  className?: string;
  compact?: boolean;
}

const TravelSearchForm: React.FC<TravelSearchFormProps> = ({ 
  className = '',
  compact = false 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [airportOptions, setAirportOptions] = useState<AirportOption[]>([]);
  const [formData, setFormData] = useState<SearchFormData>({
    origin: null,
    destination: null,
    departDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  // Load popular airports on mount
  useEffect(() => {
    const loadPopularAirports = async () => {
      try {
        const options = await travelpayoutsApi.getAirportOptions();
        // Filter for popular airports
        const popularCodes = ['JFK', 'LAX', 'LHR', 'CDG', 'HND', 'DXB', 'SYD', 'SIN'];
        const popular = options.filter(opt => 
          popularCodes.includes(opt.value)
        );
        setAirportOptions(popular);
      } catch (error) {
        console.error('Error loading airports:', error);
        toast.error('Failed to load airport data');
      }
    };
    
    loadPopularAirports();
  }, []);

  // Load airport options for search
  const loadOptions = useCallback(async (inputValue: string): Promise<AirportOption[]> => {
    if (!inputValue) {
      return airportOptions;
    }
    
    try {
      const options = await travelpayoutsApi.searchAirports(inputValue);
      return options;
    } catch (error) {
      console.error('Error searching airports:', error);
      toast.error('Failed to search airports');
      return airportOptions;
    }
  }, [airportOptions]);

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
      // Build search parameters
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

      // Navigate to search results page
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

  const CustomOption = ({ innerProps, data, isFocused }: any) => (
    <div
      {...innerProps}
      className={`p-3 cursor-pointer transition-colors ${
        isFocused ? 'bg-secondary' : 'bg-background'
      } hover:bg-secondary/80`}
    >
      <div className="flex items-center">
        <MapPin className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground truncate">
              {data.city}
            </span>
            <span className="text-sm font-mono bg-secondary px-2 py-1 rounded ml-2">
              {data.value}
            </span>
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {data.country}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`bg-card rounded-2xl shadow-2xl p-6 ${className}`}
    >
      {/* Trip Type Toggle */}
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

      {/* Search Grid */}
      <div className="space-y-4">
        {/* Airport Selection Row */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Airport */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Plane className="w-4 h-4 inline mr-1" />
                From
              </label>
              <AsyncSelect<AirportOption>
                cacheOptions
                defaultOptions={airportOptions}
                loadOptions={loadOptions}
                value={formData.origin}
                onChange={(option: SingleValue<AirportOption>) => 
                  setFormData(prev => ({ ...prev, origin: option }))
                }
                placeholder="City or airport"
                className="react-select-container"
                classNamePrefix="react-select"
                components={{ Option: CustomOption }}
                isClearable
                noOptionsMessage={({ inputValue }) => 
                  inputValue ? 'No airports found' : 'Type to search airports'
                }
                loadingMessage={() => 'Loading airports...'}
                formatOptionLabel={(option) => (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                    <div>
                      <div className="font-medium">{option.city}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.country} ({option.value})
                      </div>
                    </div>
                  </div>
                )}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.25rem',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'hsl(var(--primary))',
                    },
                  }),
                  option: (base) => ({
                    ...base,
                    padding: 0,
                  }),
                }}
              />
            </div>

            {/* Destination Airport */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Plane className="w-4 h-4 inline mr-1" />
                To
              </label>
              <AsyncSelect<AirportOption>
                cacheOptions
                defaultOptions={airportOptions}
                loadOptions={loadOptions}
                value={formData.destination}
                onChange={(option: SingleValue<AirportOption>) => 
                  setFormData(prev => ({ ...prev, destination: option }))
                }
                placeholder="City or airport"
                className="react-select-container"
                classNamePrefix="react-select"
                components={{ Option: CustomOption }}
                isClearable
                noOptionsMessage={({ inputValue }) => 
                  inputValue ? 'No airports found' : 'Type to search airports'
                }
                loadingMessage={() => 'Loading airports...'}
                formatOptionLabel={(option) => (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                    <div>
                      <div className="font-medium">{option.city}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.country} ({option.value})
                      </div>
                    </div>
                  </div>
                )}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.25rem',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'hsl(var(--primary))',
                    },
                  }),
                  option: (base) => ({
                    ...base,
                    padding: 0,
                  }),
                }}
              />
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapAirports}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      bg-background border-2 border-border rounded-full p-2 
                      hover:bg-secondary hover:border-primary transition-colors
                      shadow-md z-10"
            title="Swap airports"
          >
            <svg 
              className="w-5 h-5 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
              />
            </svg>
          </button>
        </div>

        {/* Dates and Passengers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Departure Date */}
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
              className="w-full px-4 py-3 border border-border rounded-lg 
                       focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>

          {/* Return Date (only for round trips) */}
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
                className="w-full px-4 py-3 border border-border rounded-lg 
                         focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          )}

          {/* Passengers & Class */}
          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-4 py-3 border border-border rounded-lg 
                         focus:ring-2 focus:ring-ring focus:border-primary"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Class
              </label>
              <select
                value={formData.cabinClass}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  cabinClass: e.target.value as 'economy' | 'business' | 'first' 
                }))}
                className="w-full px-4 py-3 border border-border rounded-lg 
                         focus:ring-2 focus:ring-ring focus:border-primary"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Popular Routes */}
        {!compact && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Popular routes:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { origin: 'JFK', destination: 'LHR', label: 'NYC → London' },
                { origin: 'LAX', destination: 'CDG', label: 'LA → Paris' },
                { origin: 'SFO', destination: 'HND', label: 'SF → Tokyo' },
                { origin: 'MIA', destination: 'FCO', label: 'Miami → Rome' },
              ].map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      origin: { 
                        value: route.origin, 
                        label: route.origin, 
                        city: route.origin, 
                        country: '' 
                      },
                      destination: { 
                        value: route.destination, 
                        label: route.destination, 
                        city: route.destination, 
                        country: '' 
                      },
                    }));
                  }}
                  className="text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg 
                           hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  {route.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Button */}
      <div className="mt-8">
        <Button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-primary to-accent 
                   hover:from-blue-700 hover:to-purple-700 
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
      </div>

      {/* Additional Info */}
      {!compact && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Searching flights from 500+ airlines • Best price guarantee • No booking fees</p>
        </div>
      )}
    </form>
  );
};

export default TravelSearchForm;
