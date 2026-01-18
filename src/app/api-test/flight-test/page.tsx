
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Plane } from 'lucide-react';

export default function FlightTestPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = {
    origin: 'DXB',
    destination: 'KHI',
    depart_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
  };

  useEffect(() => {
    const handleSearch = async () => {
      setLoading(true);
      setError(null);
      setFlights([]);
      try {
        const results = await travelpayoutsApi.searchFlights(searchParams);
        setFlights(results);
        if (results.length === 0) {
          setError('No flights found for this route and date. This might be expected if the API has no data. Mock data should be returned as a fallback.');
        }
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    if (flights.length > 0) {
        return (
             <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price</TableHead>
                      <TableHead>Airline</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flights.map((flight) => (
                      <TableRow key={flight.id}>
                        <TableCell>${flight.price}</TableCell>
                        <TableCell>{flight.airline}</TableCell>
                        <TableCell>{flight.origin} → {flight.destination}</TableCell>
                        <TableCell>{format(new Date(flight.departure_at), 'p')}</TableCell>
                        <TableCell>{flight.duration}m</TableCell>
                        <TableCell>{flight.transfers}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                        <TableCell>
                          {flight.is_mock ? 
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              Example
                            </span>
                            : 
                            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                              Live
                            </span>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
        );
    }
    return <p className="text-muted-foreground text-center py-8">No flights to display.</p>
  }

  return (
    <div className="container py-8">
      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Plane className="w-6 h-6" />
                    <CardTitle>Flight Search Test</CardTitle>
                </div>
                <Button asChild variant="outline">
                   <Link href="/api-test">Back to API Test</Link>
                </Button>
            </div>
            <CardDescription>
              Showing results for a test flight search from {searchParams.origin} to {searchParams.destination} for {searchParams.depart_date}. 
              Found {flights.length} results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
      </Card>
    </div>
  );
}
