'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  Users, 
  Plane,
  MapPin,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

interface SearchFormData {
  origin: string;
  destination: string;
  departDate: Date;
  returnDate: Date;
  tripType: 'round' | 'oneway';
  passengers: number;
  cabinClass: 'economy' | 'business' | 'first';
}

const WorkingSearchForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [airportOptions, setAirportOptions] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState<SearchFormData>({
    origin: '',
    destination: '',
    departDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  // Load airports on mount
  useEffect(() => {
    const loadAirports = async () => {
      try {
        const options = await travelpayoutsApi.getAirportOptions();
        const simplifiedOptions = options.map(opt => ({
          value: opt.value,
          label: `${opt.city} (${opt.value})`,
        }));
        setAirportOptions(simplifiedOptions.slice(0, 50));
      } catch (error) {
        console.error('Error loading airports:', error);
        toast.error('Failed to load airport data');
      }
    };
    
    loadAirports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.origin || !formData.destination) {
      toast.error('Please select origin and destination airports');
      return;
    }

    if (formData.origin === formData.destination) {
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
        origin: formData.origin,
        destination: formData.destination,
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

  // Popular airports for quick selection
  const popularAirports = [
    { code: 'JFK', city: 'New York' },
    { code: 'LAX', city: 'Los Angeles' },
    { code: 'LHR', city: 'London' },
    { code: 'CDG', city: 'Paris' },
    { code: 'HND', city: 'Tokyo' },
    { code: 'DXB', city: 'Dubai' },
    { code: 'SIN', city: 'Singapore' },
    { code: 'SYD', city: 'Sydney' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Your Flight</h2>
        <p className="text-gray-600 mt-2">Search flights from 500+ airlines worldwide</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Trip Type */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'round' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              formData.tripType === 'round'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Round Trip
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'oneway' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              formData.tripType === 'oneway'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            One Way
          </button>
        </div>

        {/* Airport Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plane className="w-4 h-4 inline mr-1" />
              From
            </label>
            <div className="relative">
              <select
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                required
              >
                <option value="">Select airport</option>
                {airportOptions.map((airport) => (
                  <option key={airport.value} value={airport.value}>
                    {airport.label}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plane className="w-4 h-4 inline mr-1" />
              To
            </label>
            <div className="relative">
              <select
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                required
              >
                <option value="">Select airport</option>
                {airportOptions.map((airport) => (
                  <option key={airport.value} value={airport.value}>
                    {airport.label}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={handleSwapAirports}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
            title="Swap airports"
          >
            <ArrowRightLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {formData.tripType === 'round' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={formData.tripType === 'round'}
              />
            </div>
          )}
        </div>

        {/* Passengers & Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Passengers
            </label>
            <select
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                passengers: parseInt(e.target.value) 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabin Class
            </label>
            <select
              value={formData.cabinClass}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                cabinClass: e.target.value as 'economy' | 'business' | 'first' 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Quick Airport Selection */}
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-3">Popular airports:</p>
          <div className="flex flex-wrap gap-2">
            {popularAirports.map((airport) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => {
                  if (!formData.origin) {
                    setFormData(prev => ({ ...prev, origin: airport.code }));
                  } else if (!formData.destination) {
                    setFormData(prev => ({ ...prev, destination: airport.code }));
                  }
                }}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg 
                         hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {airport.city} ({airport.code})
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-blue-600 to-purple-600 
                   hover:from-blue-700 hover:to-purple-700 
                   transition-all duration-300 shadow-lg hover:shadow-xl"
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
