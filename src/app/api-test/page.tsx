
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';
import RealApiTest from '@/components/api/RealApiTest';

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
           <TestTube className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Connection Status
          </h1>
          <p className="text-gray-600">
            This page performs a real-time test of your application's connection to the Travelpayouts API.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Live API Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealApiTest />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
