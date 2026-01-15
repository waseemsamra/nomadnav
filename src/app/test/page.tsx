
'use client';

import React, { useState } from 'react';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TestPage() {
  const [origin, setOrigin] = useState('KHI');
  const [destination, setDestination] = useState('DXB');
  const [departDate, setDepartDate] = useState('2026-01-20');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setFlights([]);
    try {
      const results = await travelpayoutsApi.searchFlights({
        origin,
        destination,
        depart_date: departDate,
      });
      setFlights(results);
      if (results.length === 0) {
        setError('No flights found for this route and date.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Flight Search Test Page</h1>
        <p className="text-muted-foreground mb-8">This page is for testing the flight search API with real data. It is not part of the production app.</p>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="origin">Origin (IATA)</Label>
                <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination (IATA)</Label>
                <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depart-date">Departure Date</Label>
                <Input id="depart-date" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading} className="mt-4 w-full">
              {loading ? 'Searching...' : 'Search Flights'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {flights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Found {flights.length} Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price</TableHead>
                      <TableHead>Airline</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flights.map((flight) => (
                      <TableRow key={flight.id}>
                        <TableCell>${flight.price}</TableCell>
                        <TableCell>{flight.airline}</TableCell>
                        <TableCell>{flight.origin} → {flight.destination}</TableCell>
                        <TableCell>{flight.departure_at}</TableCell>
                        <TableCell>{flight.duration}m</TableCell>
                        <TableCell>{flight.transfers}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
