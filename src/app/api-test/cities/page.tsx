
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN;

export default function CitiesDataPage() {
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('https://api.travelpayouts.com/data/en/cities.json', {
                    headers: {
                        'X-Access-Token': API_TOKEN || ''
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch data from API.');
                const data = await response.json();
                setCities(data);
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
                            <TableHead>Country</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cities.map((city) => (
                            <TableRow key={city.code}>
                                <TableCell className="font-bold">{city.code}</TableCell>
                                <TableCell>{city.name}</TableCell>
                                <TableCell>{city.country_code}</TableCell>
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
                            <CardTitle>Cities Data</CardTitle>
                        </div>
                        <Button asChild variant="outline">
                           <Link href="/api-test">Back to API Test</Link>
                        </Button>
                    </div>
                    <CardDescription>
                        A list of cities from the Travelpayouts API. Found {cities.length} records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
