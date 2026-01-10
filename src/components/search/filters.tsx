'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterState } from "@/types/travel";
import { Filter } from "lucide-react";

type FiltersProps = {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allAirlines: string[];
};

export function Filters({ filters, setFilters, allAirlines }: FiltersProps) {

  const handleAirlineChange = (airline: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      airlines: checked
        ? [...prev.airlines, airline]
        : prev.airlines.filter(a => a !== airline)
    }));
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5"/>
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort by</Label>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value: FilterState['sortBy']) => setFilters(f => ({...f, sortBy: value}))}
          >
            <SelectTrigger id="sortBy">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="duration">Shortest Duration</SelectItem>
              <SelectItem value="departure">Earliest Departure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="maxPrice">Max Price</Label>
            <span className="text-sm font-medium text-primary">${filters.maxPrice}</span>
          </div>
          <Slider
            id="maxPrice"
            min={0}
            max={5000}
            step={50}
            value={[filters.maxPrice]}
            onValueChange={([value]) => setFilters(f => ({...f, maxPrice: value}))}
          />
        </div>
        
        {/* Stops */}
        <div className="space-y-2">
          <Label>Stops</Label>
          <Select 
            value={String(filters.maxStops)} 
            onValueChange={(value) => setFilters(f => ({...f, maxStops: parseInt(value)}))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Max stops" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Non-stop</SelectItem>
              <SelectItem value="1">Up to 1 stop</SelectItem>
              <SelectItem value="2">Up to 2 stops</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Departure/Arrival Times */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Departure Time</Label>
                <span className="text-sm text-muted-foreground">{`${filters.departureTime[0]}:00 - ${filters.departureTime[1]}:00`}</span>
            </div>
            <Slider
                min={0}
                max={24}
                step={1}
                value={filters.departureTime}
                onValueChange={(value) => setFilters(f => ({...f, departureTime: value}))}
            />
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Arrival Time</Label>
                <span className="text-sm text-muted-foreground">{`${filters.arrivalTime[0]}:00 - ${filters.arrivalTime[1]}:00`}</span>
            </div>
            <Slider
                min={0}
                max={24}
                step={1}
                value={filters.arrivalTime}
                onValueChange={(value) => setFilters(f => ({...f, arrivalTime: value}))}
            />
        </div>

        {/* Airlines */}
        {allAirlines.length > 0 && (
          <div className="space-y-2">
            <Label>Airlines</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {allAirlines.map(airline => (
                <div key={airline} className="flex items-center space-x-2">
                  <Checkbox
                    id={`airline-${airline}`}
                    checked={filters.airlines.includes(airline)}
                    onCheckedChange={(checked) => handleAirlineChange(airline, !!checked)}
                  />
                  <Label htmlFor={`airline-${airline}`} className="font-normal text-sm">
                    {airline}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
