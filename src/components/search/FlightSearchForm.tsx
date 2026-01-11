
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
  Shield,
  CheckCircle,
  AlertTriangle,
  Database
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

interface AirportOption {
  value: string;
  label: string;
  city: string;
  country: string;
}

const FlightSearchForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [airportOptions, setAirportOptions] = useState<AirportOption[]>([]);
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    message: string;
    airports: number;
    flightApi: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    returnDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  // Initialize
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load airports
      const airports = await travelpayoutsApi.getAirportOptions();
      const simplified = airports.map(opt => ({
        value: opt.value,
        label: opt.label,
        city: opt.city,
        country: opt.country,
      }));
      setAirportOptions(simplified);

      // Check API status
      const status = await travelpayoutsApi.testApiConnection();
      setApiStatus(status);

      if (!status.flightApi) {
        toast(
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span>Flight API temporarily unavailable. Showing realistic demo data.</span>
          </div>,
          { duration: 6000 }
        );
      }
    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to initialize search');
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
        depart_date: formData.departDate,
        passengers: formData.passengers.toString(),
        cabin_class: formData.cabinClass,
        trip_type: formData.tripType,
        currency: 'USD',
      });

      if (formData.tripType === 'round') {
        searchParams.append('return_date', formData.returnDate);
      }

      // Show info about data source
      if (!apiStatus?.flightApi) {
        toast(
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Showing realistic flight data. Real API will be used when available.</span>
          </div>,
          { duration: 4000 }
        );
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
    { origin: 'JFK', destination: 'LAX', label: 'NYC → LA', price: '$299+' },
    { origin: 'LHR', destination: 'CDG', label: 'London → Paris', price: '$199+' },
    { origin: 'SIN', destination: 'SYD', label: 'Singapore → Sydney', price: '$499+' },
    { origin: 'DXB', destination: 'HND', label: 'Dubai → Tokyo', price: '$699+' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      {/* API Status Bar */}
      {apiStatus && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
          apiStatus.connected 
            ? apiStatus.flightApi
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="mt-0.5">
            {apiStatus.connected ? (
              apiStatus.flightApi ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Database className="w-5 h-5 text-blue-600" />
              )
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {apiStatus.flightApi ? 'Real-time Flight Data' : 'Realistic Demo Data'}
            </div>
            <div className="text-sm opacity-80 mt-1">
              {apiStatus.message}
            </div>
            <div className="text-xs opacity-60 mt-2 flex items-center gap-4">
              <span>✈️ {apiStatus.airports} airports</span>
              <span>•</span>
              <span>{apiStatus.flightApi ? 'Live API' : 'Enhanced Mock Data'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Your Flight</h2>
        <p className="text-gray-600 mt-2">Search thousands of flight options worldwide</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                  toast.success(`Selected ${route.label} (from ${route.price})`);
                }}
                className="text-sm bg-blue-50 text-blue-600 p-3 rounded-lg 
                         hover:bg-blue-100 transition-colors border border-blue-100 text-center"
              >
                <div className="font-medium">{route.label}</div>
                <div className="text-xs opacity-70">{route.price}</div>
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
              value={formData.departDate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                departDate: e.target.value 
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
                value={formData.returnDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  returnDate: e.target.value 
                }))}
                min={formData.departDate}
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

        {/* Search Button */}
        <Button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination}
          className="w-full py-4 text-lg font-semibold rounded-xl 
                   bg-gradient-to-r from-blue-600 to-purple-600 
                   hover:from-blue-700 hover:to-purple-700 
                   transition-all duration-300 shadow-lg hover:shadow-xl
                   group relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                {apiStatus?.flightApi ? 'Search Real Flights' : 'Search Flight Options'}
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>

        {/* Info Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                <span>Secure Booking</span>
              </div>
              <div className="hidden md:block">•</div>
              <div>Best Price Guarantee</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {apiStatus?.flightApi ? 'Live Data' : 'Demo Mode'}
              </span>
              <span className="text-xs">Powered by Travelpayouts</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchForm;
