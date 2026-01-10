import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockBookingHistory } from "@/lib/placeholder-data";

export function BookingHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
        <CardDescription>A record of your past and upcoming trips.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBookingHistory.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Badge variant="outline">{booking.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{booking.details}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'Completed' ? 'secondary' : 'default'} className="capitalize">
                      {booking.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${booking.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
