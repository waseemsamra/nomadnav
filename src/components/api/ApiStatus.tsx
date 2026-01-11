'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
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
    tokenValid: boolean;
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
        tokenValid: false,
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

  return (
    <div className={`rounded-lg p-4 ${className} ${
      status.connected 
        ? 'bg-green-50 border border-green-200 text-green-800' 
        : status.tokenValid
        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {status.connected ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : status.tokenValid ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-current">
              {status.connected ? 'API Connected' : 'API Connection Issue'}
            </div>
            <div className="text-sm opacity-80 mt-1 text-current">
              {status.message}
            </div>
            <div className="text-xs opacity-60 mt-2 text-current">
              {status.airports > 0 ? `${status.airports} airports loaded` : 'No airports data'}
              {!status.tokenValid && ' • Invalid API token'}
            </div>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={checkStatus}
          disabled={checking}
          className="ml-2 text-current hover:bg-black/5"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!status.tokenValid && (
        <div className="mt-4 pt-3 border-t border-current/20">
          <div className="flex items-center gap-2 text-sm text-current">
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