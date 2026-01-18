
'use client';
import { ALLIANCE_DATA } from '@/lib/alliance-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AlliancesDataPage() {
    return (
        <div className="container py-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            <CardTitle>Airline Alliances</CardTitle>
                        </div>
                        <Button asChild variant="outline">
                           <Link href="/api-test">Back to API Test</Link>
                        </Button>
                    </div>
                    <CardDescription>
                        A list of airline alliances and their members. Found {ALLIANCE_DATA.length} records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alliance Name</TableHead>
                                    <TableHead>Member Airlines (Codes)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ALLIANCE_DATA.map((alliance) => (
                                    <TableRow key={alliance.name}>
                                        <TableCell className="font-medium">{alliance.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {alliance.airlines.map(code => <Badge key={code} variant="secondary">{code}</Badge>)}
                                            </div>
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
