
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { type Airline } from '@/types/travel';

export default function AirlinesDataPage() {
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await travelpayoutsApi.getAirlines();
                setAirlines(data);
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
                            <TableHead>Logo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Lowcost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {airlines.map((airline) => (
                            <TableRow key={airline.code}>
                                <TableCell>
                                    <Image
                                        src={`https://pics.avs.io/120/40/${airline.code}.png`}
                                        alt={airline.name}
                                        width={60}
                                        height={20}
                                        className="object-contain"
                                        unoptimized
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{airline.name}</TableCell>
                                <TableCell>{airline.code}</TableCell>
                                <TableCell>
                                    {airline.is_lowcost && <Badge variant="secondary">Lowcost</Badge>}
                                </TableCell>
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
                            <CardTitle>Airlines Data</CardTitle>
                        </div>
                        <Button asChild variant="outline">
                           <Link href="/api-test">Back to API Test</Link>
                        </Button>
                    </div>
                    <CardDescription>
                        A list of airlines from the Travelpayouts API. Found {airlines.length} records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
