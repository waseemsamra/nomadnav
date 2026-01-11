'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Plane,
  Server,
  Cloud,
  Database,
  ExternalLink,
  Key
} from 'lucide-react';
import { travelpayoutsApi, type Flight } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

export default function RealApiTest() {
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    success: boolean;
    message: string;
    endpoints: {
      airports: boolean;
      airlines: boolean;
      cities: boolean;
      flights: boolean;
    };
    tokenValid: boolean;
  } | null>(null);
  const [testFlights, setTestFlights] = useState<Flight[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [envToken, setEnvToken] = useState('');

  useEffect(() => {
    // Client-side access to env var
    setEnvToken(process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '');
    testConnection(); // Auto-test on load
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setApiStatus(null);
    try {
      const status = await travelpayoutsApi.testApiConnection();
      setApiStatus(status);
    } catch (error: any) {
      console.error('Test failed:', error);
      setApiStatus({
        success: false,
        message: 'Test failed: ' + error.message,
        endpoints: { airports: false, airlines: false, cities: false, flights: false },
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
        depart_date: '2025-07-01', // Use a future date
        currency: 'USD',
        limit: 3,
      });
      setTestFlights(flights);
    } catch (error: any) {
      console.error('Flight search failed:', error.message);
      setTestFlights([]);
    } finally {
      setFlightLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Server className="w-6 h-6 mr-3 text-primary" />
          API Status
        </h2>
        <Button
          onClick={testConnection}
          disabled={testing}
          variant="outline"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Config & Endpoints */}
        <div className="space-y-6">
          {/* API Token */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Key className="w-5 h-5 mr-2 text-gray-400" />
              API Token
            </h3>
            <div className={`p-3 rounded-lg flex items-center gap-3 ${
              apiStatus?.tokenValid
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              <StatusIcon status={apiStatus?.tokenValid || false} />
              <span>{apiStatus?.tokenValid ? 'Token format is valid' : 'Token missing or invalid'}</span>
            </div>
             <div className="mt-2 text-xs text-gray-500 p-2 bg-gray-50 rounded font-mono truncate">
                .env: {envToken ? `${envToken.substring(0, 8)}...` : 'Not set'}
              </div>
          </div>

          {/* Endpoints */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Cloud className="w-5 h-5 mr-2 text-gray-400" />
              Service Endpoints
            </h3>
            {testing ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse h-10" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2"><Database className="w-4 h-4 text-gray-500"/>Airports</span>
                  <StatusIcon status={apiStatus?.endpoints.airports || false} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2"><Database className="w-4 h-4 text-gray-500"/>Airlines</span>
                  <StatusIcon status={apiStatus?.endpoints.airlines || false} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2"><Database className="w-4 h-4 text-gray-500"/>Cities</span>
                  <StatusIcon status={apiStatus?.endpoints.cities || false} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2"><Plane className="w-4 h-4 text-gray-500"/>Flights</span>
                  <StatusIcon status={apiStatus?.endpoints.flights || false} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Overall Status & Flight Test */}
        <div className="space-y-6">
           {/* Overall Status */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Overall Status</h3>
            <div className={`p-4 rounded-lg border ${
              apiStatus?.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center mb-2">
                <StatusIcon status={apiStatus?.success || false} />
                <span className="ml-2 font-medium">
                  {testing ? 'Testing...' : apiStatus?.success ? 'API Connected' : 'Connection Failed'}
                </span>
              </div>
              <p className="text-sm">
                {testing ? 'Checking endpoints...' : apiStatus?.message || 'Run a test to see status.'}
              </p>
            </div>
             {!apiStatus?.tokenValid && (
                <a
                  href="https://www.travelpayouts.com/developers/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-3"
                >
                  Get your free API token
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
