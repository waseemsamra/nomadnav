import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ResultsSkeleton() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-8" />
      
      <div className="space-y-8">
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4 mb-4" />
            {[...Array(2)].map((_, i) => (
              <Card key={`flight-skel-${i}`}>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="flex items-center gap-4 col-span-2 md:col-span-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-center gap-4 col-span-2 md:col-span-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-2 items-end flex flex-col">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          {[...Array(2)].map((_, i) => (
            <Card key={`hotel-skel-${i}`} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <Skeleton className="h-48 md:h-full" />
                    <div className="p-6 md:col-span-2 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-1/3" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
