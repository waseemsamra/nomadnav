
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Terminal, TestTube } from 'lucide-react';

export default function ApiTestPage() {
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);

  // This is the user's provided diagnostic script, adapted for React state
  async function testAPIBasics() {
    if (!token) {
      toast.error('Please enter your Travelpayouts API token.');
      return;
    }
    setTesting(true);
    console.clear();
    console.log('🧪 Testing API basics...');
    toast('Testing API... Check the browser console (F12) for results.');
    
    try {
      // Test 1: Popular route (SHOULD work)
      console.log('\n--- TEST 1: MOW -> LED (CHEAP) ---');
      const test1 = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?origin=MOW&destination=LED&token=${token}&currency=usd`);
      const data1 = await test1.json();
      console.log('MOW-LED (Moscow to St Petersburg):', data1.data?.['LED'] ? Object.keys(data1.data['LED']).length : 0, 'flights');
      
      // Test 2: Another popular route
      console.log('\n--- TEST 2: JFK -> LAX (LATEST) ---');
      const test2 = await fetch(`https://api.travelpayouts.com/v2/prices/latest?currency=usd&origin=JFK&destination=LAX&token=${token}&show_to_affiliates=true&limit=2`);
      const data2 = await test2.json();
      console.log('JFK-LAX (NY to LA):', data2.data?.length || 0, 'flights');
      
      // Test 3: Any route from KHI?
      console.log('\n--- TEST 3: KHI -> ANY (LATEST) ---');
      const test3 = await fetch(`https://api.travelpayouts.com/v2/prices/latest?currency=usd&origin=KHI&token=${token}&show_to_affiliates=true&limit=5`);
      const data3 = await test3.json();
      console.log('Any from KHI:', data3.data?.length || 0, 'flights');
      if (data3.data && data3.data.length > 0) {
        console.log('Found Destinations:', [...new Set(data3.data.map((f: any) => f.destination))]);
        toast.success(`Success! Found flights from KHI. See console.`);
      } else if (data1.success || data2.success) {
        toast.success('Basic tests passed, but no flights found from KHI.');
      } else {
         toast.error('All API tests failed. Check your token and console logs.');
      }
    } catch (error: any) {
        console.error("An error occurred during the test:", error);
        toast.error('An error occurred. Check console.');
    } finally {
        console.log('\n✅ Testing complete.');
        setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Connection Test
          </h1>
          <p className="text-gray-600">
            Use this page to test your Travelpayouts API token and basic connectivity.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube />
              Basic API Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="token-input" className="font-medium">
                Your Travelpayouts Token
              </label>
              <Input
                id="token-input"
                type="text"
                placeholder="Enter your 32-character token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
               <p className="text-sm text-muted-foreground">
                Get your free token from{' '}
                <a href="https://www.travelpayouts.com/developers/api" target="_blank" rel="noopener noreferrer" className="underline">
                    Travelpayouts
                </a>.
              </p>
            </div>
            
            <Button onClick={testAPIBasics} disabled={testing || !token} className="w-full">
              {testing ? 'Testing...' : 'Run Basic API Test'}
            </Button>

            <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
                <div className='flex items-center gap-2 mb-2'>
                    <Terminal className='w-5 h-5'/>
                    <h3 className='font-semibold'>Instructions</h3>
                </div>
              <p>
                1. Paste your API token in the input field above.
              </p>
              <p>
                2. Click the button to run the tests.
              </p>
              <p>
                3. Open your browser's developer console (press F12) to see the detailed output of the API tests.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
