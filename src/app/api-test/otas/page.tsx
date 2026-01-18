
'use client';
import { OTA_DATA } from '@/lib/ota-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OtasDataPage() {
    return (
        <div className="container py-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-6 h-6" />
                            <CardTitle>Online Travel Agencies (OTAs)</CardTitle>
                        </div>
                         <Button asChild variant="outline">
                           <Link href="/api-test">Back to API Test</Link>
                        </Button>
                    </div>
                    <CardDescription>
                        A list of supported Online Travel Agencies. Found {OTA_DATA.length} records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Website</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {OTA_DATA.map((ota) => (
                                    <TableRow key={ota.code}>
                                        <TableCell className="font-medium">{ota.name}</TableCell>
                                        <TableCell>{ota.code}</TableCell>
                                        <TableCell>
                                            <a href={ota.main_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                {ota.main_url} <LinkIcon className="w-3 h-3" />
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
