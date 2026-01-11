
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertCircle,
  Key
} from 'lucide-react';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

interface ApiStatusProps {
  className?: string;
}

const ApiStatus: React.FC<ApiStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
    flightApi: boolean;
    airports: number;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const apiStatus = await travelpayoutsApi.testApiConnection();
      setStatus(apiStatus);
    } catch (error) {
      console.error('Status check failed:', error);
      setStatus({
        connected: false,
        message: 'Failed to check API status',
        flightApi: false,
        airports: 0,
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (!status) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.flightApi) return 'green';
    if (status.connected) return 'yellow';
    return 'red';
  }

  const color = getStatusColor();

  return (
    <div className={`rounded-lg p-4 ${className} ${
      color === 'green' ? 'bg-green-50 border border-green-200' :
      color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
      'bg-red-50 border border-red-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${
            color === 'green' ? 'text-green-600' :
            color === 'yellow' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {status.flightApi ? (
              <CheckCircle className="w-5 h-5" />
            ) : status.connected ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className={`font-medium ${
              color === 'green' ? 'text-green-800' :
              color === 'yellow' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {status.flightApi ? 'API Connected' : 'API Connection Issue'}
            </div>
            <div className={`text-sm opacity-80 mt-1 ${
              color === 'green' ? 'text-green-700' :
              color === 'yellow' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {status.message}
            </div>
            <div className={`text-xs opacity-60 mt-2 ${
               color === 'green' ? 'text-green-600' :
               color === 'yellow' ? 'text-yellow-600' :
               'text-red-600'
            }`}>
              {status.airports > 0 ? `${status.airports} airports loaded` : 'No airports data'}
              {!status.flightApi && ' • Real flights may fail'}
            </div>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={checkStatus}
          disabled={checking}
          className={`ml-2 ${
            color === 'green' ? 'text-green-600 hover:bg-green-100' :
            color === 'yellow' ? 'text-yellow-600 hover:bg-yellow-100' :
            'text-red-600 hover:bg-red-100'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!status.flightApi && (
        <div className={`mt-4 pt-3 border-t ${
          color === 'yellow' ? 'border-yellow-200' : 'border-red-200'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${
             color === 'yellow' ? 'text-yellow-800' : 'text-red-800'
          }`}>
            <Key className="w-4 h-4" />
            <span>Get your free API token:</span>
            <a 
              href="https://www.travelpayouts.com/developers/api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              travelpayouts.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;
