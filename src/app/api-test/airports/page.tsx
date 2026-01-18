
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AirportsDataPage() {
    const [airports, setAirports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('https://api.travelpayouts.com/data/en/airports.json');
                if (!response.ok) throw new Error('Failed to fetch data from API.');
                const data = await response.json();
                setAirports(data.filter((a: any) => a.flightable));
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const renderContent = () => {
        if (loading) {
            return <Skeleton className="h-96 w-full" />;
        }
        if (error) {
            return <p className="text-destructive">Error: {error}</p>;
        }
        return (
            <div className="border rounded-md max-h-[70vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Country</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {airports.map((airport) => (
                            <TableRow key={airport.code}>
                                <TableCell className="font-bold">{airport.code}</TableCell>
                                <TableCell>{airport.name}</TableCell>
                                <TableCell>{airport.city_code}</TableCell>
                                <TableCell>{airport.country_code}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Database className="w-6 h-6" />
                            <CardTitle>Airports Data</CardTitle>
                        </div>
                        <Button asChild variant="outline">
                           <Link href="/api-test">Back to API Test</Link>
                        </Button>
                    </div>
                    <CardDescription>
                        A list of flightable airports from the Travelpayouts API. Found {airports.length} records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
