
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Key,
  Plane,
  Server,
  Cloud,
  Database,
  ExternalLink,
  Globe,
  Users,
  Paperclip,
  Book,
} from 'lucide-react';
import { travelpayoutsApi, type Flight, type Gate } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { OTA_DATA } from '@/lib/ota-data';
import { ALLIANCE_DATA } from '@/lib/alliance-data';

type ApiStatus = {
  success: boolean;
  message: string;
  endpoints: {
    airports: boolean;
    airlines: boolean;
    cities: boolean;
    flights: boolean;
    otas: boolean;
    countries: boolean;
    planes: boolean;
    routes: boolean;
    alliances: boolean;
  };
  tokenValid: boolean;
} | null;

export default function ApiTestPage() {
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>(null);
  const [testFlights, setTestFlights] = useState<Flight[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [envToken, setEnvToken] = useState('');
  const [allOtas] = useState<Gate[]>(OTA_DATA);
  const [alliances] = useState(ALLIANCE_DATA);

  useEffect(() => {
    // Client-side access to env var
    setEnvToken(process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '');
    testConnection(); // Auto-test on page load
  }, []);


  const testConnection = async () => {
    setTesting(true);
    setApiStatus(null);
    try {
      const status = await travelpayoutsApi.testApiConnection();
      
      const workingEndpoints = Object.values(status.endpoints).filter(v => v).length;
      const totalEndpoints = Object.values(status.endpoints).length;
      status.message = `Connected to ${workingEndpoints}/${totalEndpoints} endpoints`;
      status.success = workingEndpoints > 0;

      setApiStatus(status);
    } catch (error: any) {
      console.error('Test failed:', error);
      setApiStatus({
        success: false,
        message: 'Test failed: ' + error.message,
        endpoints: { airports: false, airlines: false, cities: false, flights: false, otas: false, countries: false, planes: false, routes: false, alliances: false },
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
  
  const formatDuration = (minutes: number) => {
    if (typeof minutes !== 'number' || isNaN(minutes)) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  const EndpointStatus = ({ name, icon, status, loading }: { name: string, icon: React.ReactNode, status: boolean, loading?: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="flex items-center gap-2 capitalize"><div className="w-4 h-4 text-gray-500">{icon}</div>{name}</span>
       {loading ? <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /> : <StatusIcon status={status} />}
    </div>
  );

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <EndpointStatus name="Flights" icon={<Plane />} status={apiStatus?.endpoints.flights || false} loading={testing} />
                    <EndpointStatus name="OTAs" icon={<Users />} status={apiStatus?.endpoints.otas || false} loading={testing} />
                    <EndpointStatus name="Airports" icon={<Database />} status={apiStatus?.endpoints.airports || false} loading={testing} />
                    <EndpointStatus name="Airlines" icon={<Database />} status={apiStatus?.endpoints.airlines || false} loading={testing} />
                    <EndpointStatus name="Cities" icon={<Database />} status={apiStatus?.endpoints.cities || false} loading={testing} />
                    <EndpointStatus name="Countries" icon={<Globe />} status={apiStatus?.endpoints.countries || false} loading={testing} />
                    <EndpointStatus name="Planes" icon={<Paperclip />} status={apiStatus?.endpoints.planes || false} loading={testing} />
                    <EndpointStatus name="Routes" icon={<Paperclip />} status={apiStatus?.endpoints.routes || false} loading={testing} />
                    <EndpointStatus name="Alliances" icon={<Book />} status={apiStatus?.endpoints.alliances || false} loading={testing} />
                  </div>
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

              {/* Flight Search */}
              <div>
                 <h3 className="font-semibold text-gray-800 mb-2">Flight Search Test</h3>
                 <div className="bg-blue-50 p-3 rounded-lg text-center font-mono text-sm mb-4">
                    <span className="text-blue-600 font-bold">JFK</span>
                    <span className="mx-2">→</span>
                    <span className="text-blue-600 font-bold">LAX</span>
                  </div>

                 <Button
                    onClick={testFlightSearch}
                    disabled={flightLoading || !apiStatus?.endpoints.flights}
                    className="w-full"
                  >
                    {flightLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plane className="w-4 h-4 mr-2" />
                    )}
                    Test Flight Search
                  </Button>
              </div>

            </div>
          </div>
        </div>

        {/* Local Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* OTA (Gates) Data */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Online Travel Agencies (Gates)
                </h2>
                {allOtas.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-4">
                    <p className="text-sm text-gray-600 mb-4">Successfully loaded {allOtas.length} OTAs from local data.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allOtas.slice(0, 10).map(ota => (
                          <div key={ota.code} className="p-3 border rounded-lg bg-gray-50">
                              <p className="font-bold text-gray-800">{ota.name}</p>
                              <p className="text-sm text-gray-500 font-mono">{ota.code}</p>
                          </div>
                        ))}
                    </div>
                     {allOtas.length > 10 && <p className='text-sm text-center mt-2 text-muted-foreground'>...and {allOtas.length - 10} more.</p>}
                    </div>
                ) : (
                <div className="text-center py-8 text-red-500">
                    Failed to load OTA data. The local data file might be missing or empty.
                </div>
                )}
            </div>
            
            {/* Alliance Data */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  Airline Alliances
                </h2>
                {alliances.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-4">
                      <p className="text-sm text-gray-600 mb-4">Successfully loaded {alliances.length} Alliances from local data.</p>
                      <div className="space-y-4">
                        {alliances.map(alliance => (
                          <div key={alliance.name} className="p-3 border rounded-lg bg-gray-50">
                            <p className="font-bold text-gray-800">{alliance.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                ) : (
                  <div className="text-center py-8 text-red-500">
                    Failed to load Alliance data. The local data file might be missing or empty.
                  </div>
                )}
            </div>
        </div>

        {/* Flight Search Results */}
        {(flightLoading || testFlights.length > 0) && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Plane className="w-5 h-5 mr-2" />
              Flight Search Results
            </h2>
            
            {flightLoading ? (
               <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                  Searching for flights...
               </div>
            ) : testFlights.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Found {testFlights.length} flights:
                </h3>
                {testFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-lg">
                          ${flight.price}
                        </div>
                        <div className="text-sm text-gray-600">
                          {flight.airline} ({flight.airline_code}) • {flight.flight_number}
                        </div>
                         <div className="text-sm text-gray-500 mt-1">
                          Sold by: <span className="font-medium text-gray-700">{flight.gate}</span>
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
                      Duration: {formatDuration(flight.duration)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                The API did not return any flights for this test route.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
