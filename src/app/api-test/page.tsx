
'use client';

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Key, 
  Check, 
  X, 
  Plane,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import type { Flight } from '@/services/travelpayoutsApi';

export default function ApiTestPage() {
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    message: string;
    airports: number;
    tokenValid: boolean;
  } | null>(null);
  const [testFlights, setTestFlights] = useState<Flight[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setApiStatus(null);
    try {
      const status = await travelpayoutsApi.testApiConnection();
      setApiStatus(status);
    } catch (error: any) {
      console.error('Test failed:', error);
      setApiStatus({
        connected: false,
        message: 'Test failed: ' + error.message,
        airports: 0,
        tokenValid: false,
      });
    } finally {
      setTesting(false);
    }
  };

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

  const envToken = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN;

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

        {/* Current Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Token Status
                  </label>
                  <div className={`px-3 py-2 rounded-lg flex items-center ${
                    envToken && envToken !== 'your_api_token_here'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {envToken && envToken !== 'your_api_token_here' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Token Configured
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Token Not Configured
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment Variable
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                    NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN={
                      envToken ? '••••••••••••••••' : 'Not set'
                    }
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="https://www.travelpayouts.com/developers/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  Get your free API token
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                Connection Test
              </h2>
              
              <div className="space-y-4">
                <Button
                  onClick={testConnection}
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-2" />
                      Test API Connection
                    </>
                  )}
                </Button>

                {apiStatus && (
                  <div className={`p-4 rounded-lg border ${
                    apiStatus.connected
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="flex items-center mb-2">
                      {apiStatus.connected ? (
                        <Check className="w-5 h-5 mr-2" />
                      ) : (
                        <WifiOff className="w-5 h-5 mr-2" />
                      )}
                      <span className="font-medium">
                        {apiStatus.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-sm">{apiStatus.message}</p>
                    <p className="text-sm mt-1">Airports loaded: {apiStatus.airports}</p>
                    <p className="text-sm mt-1">Token valid for flights: {apiStatus.tokenValid ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
            disabled={flightLoading || !apiStatus?.tokenValid}
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

          {testFlights.length === 0 && flightLoading === false && apiStatus?.tokenValid && (
            <div className="text-center py-8 text-gray-500">
              Click "Test Flight Search" to see flight data. If none appears, the API may not have returned results for this route.
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Get API Access:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Go to <a href="https://www.travelpayouts.com/developers/api" className="underline">travelpayouts.com/developers/api</a></li>
            <li>Register for a free account</li>
            <li>Go to "My Profile" → "API" section</li>
            <li>Copy your API Token</li>
            <li>Add it to your .env file as NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN</li>
            <li>Restart your development server</li>
            <li>Test the connection above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

    