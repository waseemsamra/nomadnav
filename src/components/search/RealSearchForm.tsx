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
  ArrowRightLeft,
  Wifi,
  Shield,
  Check
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { travelpayoutsApi, type AirportOption } from '@/services/travelpayoutsApi';
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

const RealSearchForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [airportOptions, setAirportOptions] = useState<AirportOption[]>([]);
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    message: string;
    hasToken: boolean;
  } | null>(null);

  const [formData, setFormData] = useState<SearchFormData>({
    origin: '',
    destination: '',
    departDate: addDays(new Date(), 7),
    returnDate: addDays(new Date(), 14),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  // Test API connection on mount
  useEffect(() => {
    testApiConnection();
    loadAirports();
  }, []);

  const testApiConnection = async () => {
    setTestingApi(true);
    try {
      const status = await travelpayoutsApi.testApiConnection();
      setApiStatus(status);
      
      if (!status.connected) {
        toast(status.message, {
          icon: '⚠️',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setTestingApi(false);
    }
  };

  const loadAirports = async () => {
    try {
      const options = await travelpayoutsApi.getAirportOptions();
      setAirportOptions(options);
    } catch (error) {
      console.error('Error loading airports:', error);
      toast.error('Failed to load airport data');
    }
  };

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
        currency: 'USD',
      });

      if (formData.tripType === 'round') {
        searchParams.append('return_date', format(formData.returnDate, 'yyyy-MM-dd'));
      }

      console.log('🔍 Real API Search:', Object.fromEntries(searchParams));
      
      // Test the API connection first
      const apiTest = await travelpayoutsApi.testApiConnection();
      if (!apiTest.connected && apiTest.hasToken) {
        toast.error('API Connection Failed. Using demo mode.');
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
  };

  const popularRoutes = [
    { origin: 'JFK', destination: 'LAX', label: 'NYC → LA' },
    { origin: 'LHR', destination: 'CDG', label: 'London → Paris' },
    { origin: 'SIN', destination: 'SYD', label: 'Singapore → Sydney' },
    { origin: 'DXB', destination: 'HND', label: 'Dubai → Tokyo' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 relative">
      {/* API Status Indicator */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className={`px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
          apiStatus?.connected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {testingApi ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Testing API...
            </>
          ) : apiStatus?.connected ? (
            <>
              <Check className="w-3 h-3" />
              API Connected
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3" />
              {apiStatus?.hasToken ? 'API Error' : 'Add API Token'}
            </>
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Search Real Flights</h2>
        <p className="text-gray-600 mt-2">Powered by Travelpayouts API</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative">
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
                <option value="">Select departure airport</option>
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
                <option value="">Select arrival airport</option>
                {airportOptions.map((airport) => (
                  <option key={airport.value} value={airport.value}>
                    {airport.label}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapAirports}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      bg-white border-2 border-gray-300 rounded-full p-2 
                      hover:bg-gray-50 hover:border-blue-500 transition-colors
                      shadow-md"
            title="Swap airports"
          >
            <ArrowRightLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Popular Routes */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Popular routes:</p>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    origin: route.origin,
                    destination: route.destination,
                  }));
                  toast.success(`Selected ${route.label}`);
                }}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg 
                         hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {route.label}
              </button>
            ))}
          </div>
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
                required
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

        {/* API Status Info */}
        {apiStatus && !apiStatus.connected && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-yellow-700 font-medium">
                  {apiStatus.hasToken ? 'API Connection Issue' : 'API Token Required'}
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  {apiStatus.message}
                </p>
                <p className="text-yellow-600 text-sm mt-2">
                  Get your free API token from:{' '}
                  <a 
                    href="https://www.travelpayouts.com/developers/api" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-700"
                  >
                    travelpayouts.com/developers/api
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-blue-600 to-purple-600 
                   hover:from-blue-700 hover:to-purple-700 
                   transition-all duration-300 shadow-lg hover:shadow-xl
                   relative overflow-hidden group"
        >
          <div className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting to API...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Real Flights
              </>
            )}
          </div>
          
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>

        {/* API Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {apiStatus?.connected 
              ? '✅ Connected to Travelpayouts API - Real flight data'
              : '⚠️ Using demo data - Add API token for real flights'}
          </p>
        </div>
      </form>
    </div>
  );
};

export default RealSearchForm;
