
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { 
  Search, 
  ArrowRightLeft,
  Briefcase,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface AirportOption {
  value: string;
  label: string;
}

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '60px',
    borderRadius: '0.5rem',
    border: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: '0 1rem',
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '0.5rem',
    backgroundColor: 'hsl(var(--card))',
    zIndex: 20
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'hsl(var(--primary))' : state.isFocused ? 'hsl(var(--secondary))' : 'transparent',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    padding: '1rem'
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
    fontWeight: 600,
    fontSize: '1.125rem'
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontWeight: 600,
    fontSize: '1.125rem'
  }),
  input: (provided: any) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: () => ({ display: 'none' }),
};

const RealSearchForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [airportOptions, setAirportOptions] = useState<AirportOption[]>([]);

  const [origin, setOrigin] = useState<AirportOption | null>(null);
  const [destination, setDestination] = useState<AirportOption | null>(null);
  
  const [multiCitySegments, setMultiCitySegments] = useState([
    { from: null as AirportOption | null, to: null as AirportOption | null, date: '2026-01-20' },
    { from: null as AirportOption | null, to: null as AirportOption | null, date: '2026-01-27' },
  ]);

  const [formData, setFormData] = useState({
    departDate: '2026-01-20',
    returnDate: '2026-01-27',
    tripType: 'oneway' as 'oneway' | 'round' | 'multi',
    passengers: 1,
    cabinClass: 'economy',
    directOnly: false,
  });

  useEffect(() => {
    loadData();
  }, [formData.tripType]);

  const loadData = async () => {
    try {
      const airports = await travelpayoutsApi.getAirportOptions();
      setAirportOptions(airports);
    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to load airport options');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tripType !== 'multi') {
      if (!origin || !destination) {
        toast.error('Please select origin and destination airports');
        return;
      }
      if (origin.value === destination.value) {
        toast.error('Origin and destination cannot be the same');
        return;
      }
      if (formData.tripType === 'round' && new Date(formData.departDate) > new Date(formData.returnDate)) {
        toast.error('Return date must be after departure date');
        return;
      }
    } else {
      // Basic validation for multi-city
      for (const segment of multiCitySegments) {
        if (!segment.from || !segment.to) {
          toast.error('Please fill all multi-city segments');
          return;
        }
      }
    }


    setLoading(true);

    try {
      // Note: Multi-city search submission logic would be more complex and might involve
      // multiple API calls or a different API endpoint. This is a simplified example.
      if (formData.tripType === 'multi') {
        toast.error('Multi-city search is not yet implemented.');
        setLoading(false);
        return;
      }
      
      const searchParams = new URLSearchParams({
        origin: origin!.value,
        destination: destination!.value,
        depart_date: formData.departDate,
        passengers: formData.passengers.toString(),
        cabin_class: formData.cabinClass,
        trip_type: formData.tripType,
        currency: 'USD',
      });

      if (formData.tripType === 'round') {
        searchParams.append('return_date', formData.returnDate);
      }

      router.push(`/flights/search?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to process search');
      setLoading(false);
    }
  };

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };
  
  const handleMultiCityChange = (index: number, field: 'from' | 'to' | 'date', value: any) => {
    const newSegments = [...multiCitySegments];
    (newSegments[index] as any)[field] = value;
    setMultiCitySegments(newSegments);
  };

  const renderSelectWithLabel = (label: string, value: AirportOption | null, onChange: (option: AirportOption | null) => void) => (
    <div className="relative flex-1 border border-gray-300 rounded-lg lg:border-none">
      <label className="absolute top-2 left-4 text-xs text-gray-500">{label}</label>
      <Select
        options={airportOptions}
        value={value}
        onChange={onChange}
        placeholder={`Select ${label.toLowerCase()}`}
        isSearchable
        styles={customStyles}
        required
      />
    </div>
  );
  
  const renderDateWithLabel = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: string) => (
    <div className="relative flex-1 border border-gray-300 rounded-lg lg:border-none">
      <label className="absolute top-2 left-4 text-xs text-gray-500">{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        min={min || format(new Date(), 'yyyy-MM-dd')}
        className="w-full h-[60px] pt-5 px-4 bg-transparent font-semibold text-lg border-none rounded-lg focus:ring-0"
        required
      />
    </div>
  );


  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 text-gray-900">
        {/* Trip Type Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant={formData.tripType === 'oneway' ? 'secondary': 'ghost'} onClick={() => setFormData(p => ({...p, tripType: 'oneway'}))} className="rounded-full">One-way</Button>
          <Button variant={formData.tripType === 'round' ? 'secondary': 'ghost'} onClick={() => setFormData(p => ({...p, tripType: 'round'}))} className="rounded-full">Round-trip</Button>
          <Button variant={formData.tripType === 'multi' ? 'secondary': 'ghost'} onClick={() => setFormData(p => ({...p, tripType: 'multi'}))} className="rounded-full">Multi-city</Button>
        </div>

        <form onSubmit={handleSubmit}>
            {formData.tripType !== 'multi' ? (
              <div className="space-y-2 lg:space-y-0 lg:flex lg:items-center lg:border lg:border-gray-300 lg:rounded-lg">
                  {renderSelectWithLabel('From', origin, setOrigin)}
                  
                  <div className="hidden h-10 w-px bg-gray-300 lg:block"></div>

                  <button
                      type="button"
                      onClick={handleSwapAirports}
                      className="my-2 mx-auto lg:mx-2 p-2 rounded-full hover:bg-gray-200 transition-colors"
                      title="Swap airports"
                  >
                      <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {renderSelectWithLabel('To', destination, setDestination)}
                  
                  <div className="hidden h-10 w-px bg-gray-300 lg:block"></div>
                  
                  {renderDateWithLabel('Depart', formData.departDate, e => setFormData(p => ({...p, departDate: e.target.value})))}
                  
                  {formData.tripType === 'round' && (
                    <>
                      <div className="hidden h-10 w-px bg-gray-300 lg:block"></div>
                      {renderDateWithLabel('Return', formData.returnDate, e => setFormData(p => ({...p, returnDate: e.target.value})), formData.departDate)}
                    </>
                  )}
              </div>
            ) : (
                <div className="space-y-2">
                    {multiCitySegments.map((segment, index) => (
                      <div key={index} className="flex flex-col lg:flex-row items-center border border-gray-300 rounded-lg">
                        {renderSelectWithLabel('From', segment.from, (option) => handleMultiCityChange(index, 'from', option))}
                        <div className="h-10 w-px bg-gray-300 hidden lg:block"></div>
                        {renderSelectWithLabel('To', segment.to, (option) => handleMultiCityChange(index, 'to', option))}
                        <div className="h-10 w-px bg-gray-300 hidden lg:block"></div>
                        {renderDateWithLabel('Date', segment.date, (e) => handleMultiCityChange(index, 'date', e.target.value))}
                      </div>
                    ))}
                </div>
            )}


            {/* Secondary options row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                    <Checkbox id="direct-flights" checked={formData.directOnly} onCheckedChange={(checked) => setFormData(p => ({...p, directOnly: !!checked}))} />
                    <label htmlFor="direct-flights" className="text-sm font-medium">Direct flights only</label>
                </div>

                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <select
                      value={formData.passengers}
                      onChange={(e) => setFormData(prev => ({...prev, passengers: parseInt(e.target.value) }))}
                      className="bg-transparent font-medium focus:ring-0 border-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-500" />
                     <select
                        value={formData.cabinClass}
                        onChange={(e) => setFormData(prev => ({...prev, cabinClass: e.target.value as 'economy' | 'business' | 'first'}))}
                        className="bg-transparent font-medium focus:ring-0 border-none"
                    >
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-3"
                  size="lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
            </div>
        </form>
    </div>
  );
};

export default RealSearchForm;
