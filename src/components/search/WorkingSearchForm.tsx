
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
import { travelpayoutsApi, type AirportOption } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import Select from 'react-select/async';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchFormData {
  origin: AirportOption | null;
  destination: AirportOption | null;
  departDate: Date | null;
  returnDate: Date | null;
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
    departDate: null,
    returnDate: null,
    tripType: 'round',
    passengers: 1,
    cabinClass: 'economy',
  });

  useEffect(() => {
    setFormData(prev => ({
        ...prev,
        departDate: new Date(),
        returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }))
  }, []);

  const loadAirportOptions = async (
    inputValue: string,
    callback: (options: AirportOption[]) => void
  ) => {
    if (inputValue.length < 2) {
      callback([]);
      return;
    }

    try {
      const options = await travelpayoutsApi.searchAirports(inputValue);
      callback(options);
    } catch (error) {
      console.error('Error loading airport options:', error);
      toast.error('Failed to load airport data');
      callback([]);
    }
  };
  
  const debouncedLoadOptions = useDebounce(loadAirportOptions, 300);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin || !formData.destination || !formData.departDate) {
      toast.error('Please fill all flight details.');
      return;
    }

    if (formData.origin.value === formData.destination.value) {
      toast.error('Origin and destination cannot be the same');
      return;
    }

    if (formData.tripType === 'round' && (!formData.returnDate || formData.departDate > formData.returnDate)) {
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

      if (formData.tripType === 'round' && formData.returnDate) {
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
  };

  const popularAirports: AirportOption[] = [
    { value: 'JFK', label: 'New York (JFK)', city: 'New York', country: 'United States' },
    { value: 'LAX', label: 'Los Angeles (LAX)', city: 'Los Angeles', country: 'United States' },
    { value: 'LHR', label: 'London (LHR)', city: 'London', country: 'United Kingdom' },
    { value: 'CDG', label: 'Paris (CDG)', city: 'Paris', country: 'France' },
    { value: 'HND', label: 'Tokyo (HND)', city: 'Tokyo', country: 'Japan' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Your Flight</h2>
        <p className="text-gray-600 mt-2">Search flights from 500+ airlines worldwide</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 mb-6">
            {/* Trip Type Buttons */}
            {(['round', 'oneway'] as const).map(type => (
                <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tripType: type }))}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                        formData.tripType === type
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {type === 'round' ? 'Round Trip' : 'One Way'}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Airport Selectors */}
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder={<div><Plane className="inline-block mr-2 -mt-1 h-4 w-4" /> From</div>}
            value={formData.origin}
            onChange={option => setFormData(prev => ({...prev, origin: option as AirportOption | null}))}
            loadOptions={debouncedLoadOptions}
            defaultOptions={popularAirports}
            isClearable
          />
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder={<div><Plane className="inline-block mr-2 -mt-1 h-4 w-4" /> To</div>}
            value={formData.destination}
            onChange={option => setFormData(prev => ({...prev, destination: option as AirportOption | null}))}
            loadOptions={debouncedLoadOptions}
            defaultOptions={popularAirports}
            isClearable
          />
        </div>

        <div className="flex justify-center mb-4">
            <button
                type="button"
                onClick={handleSwapAirports}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                title="Swap airports"
            >
                <ArrowRightLeft className="w-5 h-5 text-gray-600" />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Date Pickers */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Departure
                </label>
                <input
                    type="date"
                    value={formData.departDate ? format(formData.departDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        departDate: e.target.value ? new Date(e.target.value) : null
                    }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        value={formData.returnDate ? format(formData.returnDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            returnDate: e.target.value ? new Date(e.target.value) : null
                        }))}
                        min={formData.departDate ? format(formData.departDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={formData.tripType === 'round'}
                    />
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Passengers & Class Selectors */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Passengers
                </label>
                <select
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>
                            {num} {num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cabin Class</label>
                <select
                    value={formData.cabinClass}
                    onChange={(e) => setFormData(prev => ({ ...prev, cabinClass: e.target.value as 'economy' | 'business' | 'first' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                </select>
            </div>
        </div>

        <Button
            type="submit"
            disabled={loading || !formData.origin || !formData.destination}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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
