
'use client';

import React, { useState } from 'react';
import { 
  Plane,
  RefreshCw,
} from 'lucide-react';
import { travelpayoutsApi, type Flight } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import ApiStatus from '@/components/api/ApiStatus';

export default function ApiTestPage() {
  const [testFlights, setTestFlights] = useState<Flight[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);

  const testFlightSearch = async () => {
    setFlightLoading(true);
    setTestFlights([]);
    try {
      const flights = await travelpayoutsApi.searchFlights({
        origin: 'JFK',
        destination: 'LAX',
        depart_date: '2024-08-01',
        currency: 'USD',
        limit: 3,
      });
      setTestFlights(flights);
    } catch (error) {
      console.error('Flight search failed:', error);
    } finally {
      setFlightLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Travelpayouts API Test
          </h1>
          <p className="text-gray-600">
            Test your API connection and flight search functionality
          </p>
        </div>

        {/* API Status */}
        <div className="mb-8">
            <ApiStatus />
        </div>


        {/* Flight Search Test */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plane className="w-5 h-5 mr-2" />
            Flight Search Test
          </h2>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Test flight search functionality with sample route:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-mono text-center">
                <span className="text-blue-600 font-bold">JFK</span>
                <span className="mx-2">→</span>
                <span className="text-blue-600 font-bold">LAX</span>
                <span className="mx-4">|</span>
                <span className="text-gray-700">August 1, 2024</span>
              </div>
            </div>
          </div>

          <Button
            onClick={testFlightSearch}
            disabled={flightLoading}
            className="w-full mb-6"
          >
            {flightLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Searching Flights...
              </>
            ) : (
              'Test Flight Search'
            )}
          </Button>

          {testFlights.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Found {testFlights.length} flights:
              </h3>
              {testFlights.map((flight, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">
                        ${flight.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.airline} • {flight.flight_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {flight.origin} → {flight.destination}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.transfers === 0 ? 'Non-stop' : `${flight.transfers} stop(s)`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Duration: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                  </div>
                </div>
              ))}
            </div>
          )}

          {testFlights.length === 0 && flightLoading === false && (
            <div className="text-center py-8 text-gray-500">
              Click "Test Flight Search" to see flight data. If none appears, the API may not have returned results for this route.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
