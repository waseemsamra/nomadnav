
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
import { getAirportOptions, type AirportOption } from '@/services/travelpayoutsApi';
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

interface SimpleTravelSearchFormProps {
  className?: string;
}

const SimpleTravelSearchForm: React.FC<SimpleTravelSearchFormProps> = ({ 
  className = ''
}) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [airportOptions, setAirportOptions] = useState<AirportOption[]>([]);
  const [searchInput, setSearchInput] = useState({
    origin: '',
    destination: '',
  });
  const [filteredAirports, setFilteredAirports] = useState<AirportOption[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [formData, setFormData] = useState<SearchFormData>({
    origin: '',
    destination: '',
    departDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load airports on mount
  useEffect(() => {
    const loadAirports = async () => {
      try {
        const options = await getAirportOptions();
        setAirportOptions(options);
      } catch (error) {
        console.error('Error loading airports:', error);
        toast.error('Failed to load airport data');
      }
    };
    
    loadAirports();
  }, []);

  // Filter airports based on search input
  useEffect(() => {
    if (searchInput.origin.trim()) {
      const filtered = airportOptions.filter(option =>
        (option.label && option.label.toLowerCase().includes(searchInput.origin.toLowerCase())) ||
        (option.city && option.city.toLowerCase().includes(searchInput.origin.toLowerCase())) ||
        (option.value && option.value.toLowerCase().includes(searchInput.origin.toLowerCase()))
      ).slice(0, 10);
      setFilteredAirports(filtered);
    } else {
      setFilteredAirports([]);
    }
  }, [searchInput.origin, airportOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    setSearchInput(prev => ({
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const selectAirport = (field: 'origin' | 'destination', airport: AirportOption) => {
    setFormData(prev => ({ ...prev, [field]: airport.value }));
    setSearchInput(prev => ({ ...prev, [field]: airport.label }));
    
    if (field === 'origin') {
      setShowOriginDropdown(false);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  const popularAirports = airportOptions
    .filter(opt => ['JFK', 'LAX', 'LHR', 'CDG', 'HND', 'DXB', 'SIN', 'SYD'].includes(opt.value))
    .slice(0, 8);

  if (!isClient) {
    return null;
  }
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className={`bg-white rounded-2xl shadow-2xl p-6 ${className}`}
    >
      {/* Trip Type Toggle */}
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
      <div className="relative mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Airport */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plane className="w-4 h-4 inline mr-1" />
              From
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput.origin}
                onChange={(e) => {
                  setSearchInput(prev => ({ ...prev, origin: e.target.value }));
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                placeholder="City or airport"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {showOriginDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredAirports.length > 0 ? (
                  filteredAirports.map((airport) => (
                    <button
                      key={airport.value}
                      type="button"
                      onMouseDown={() => selectAirport('origin', airport)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{airport.city || airport.label}</div>
                      <div className="text-sm text-gray-500">
                        {airport.country} ({airport.value})
                      </div>
                    </button>
                  ))
                ) : searchInput.origin.trim() ? (
                  <div className="px-4 py-3 text-gray-500">
                    No airports found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Destination Airport */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plane className="w-4 h-4 inline mr-1" />
              To
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput.destination}
                onChange={(e) => {
                  setSearchInput(prev => ({ ...prev, destination: e.target.value }));
                  setShowDestinationDropdown(true);
                }}
                onFocus={() => setShowDestinationDropdown(true)}
                onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
                placeholder="City or airport"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {showDestinationDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {airportOptions
                  .filter(option => {
                      if (!searchInput.destination.trim()) return false;
                      const searchTerm = searchInput.destination.toLowerCase();
                      return (option.label && option.label.toLowerCase().includes(searchTerm)) ||
                             (option.city && option.city.toLowerCase().includes(searchTerm)) ||
                             (option.value && option.value.toLowerCase().includes(searchTerm))
                    }
                  )
                  .slice(0, 10)
                  .map((airport) => (
                    <button
                      key={airport.value}
                      type="button"
                      onMouseDown={() => selectAirport('destination', airport)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{airport.city || airport.label}</div>
                      <div className="text-sm text-gray-500">
                        {airport.country} ({airport.value})
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwapAirports}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white border-2 border-gray-300 rounded-full p-2 
                    hover:bg-gray-50 hover:border-blue-500 transition-colors
                    shadow-md z-10"
          title="Swap airports"
        >
          <ArrowRightLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Dates and Passengers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Departure Date */}
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
          />
        </div>

        {/* Return Date (only for round trips) */}
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
            />
          </div>
        )}

        {/* Passengers & Class */}
        <div className="grid grid-cols-2 gap-4">
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
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
      </div>

      {/* Popular Airports */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Popular airports:</p>
        <div className="flex flex-wrap gap-2">
          {popularAirports.map((airport) => (
            <button
              key={airport.value}
              type="button"
              onClick={() => {
                if (!formData.origin) {
                  selectAirport('origin', airport);
                } else if (!formData.destination) {
                  selectAirport('destination', airport);
                }
              }}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg 
                       hover:bg-blue-100 transition-colors border border-blue-100"
            >
              {airport.city || airport.value}
            </button>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <div>
        <Button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-blue-600 to-purple-600 
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
    </form>
  );
};

export default SimpleTravelSearchForm;
