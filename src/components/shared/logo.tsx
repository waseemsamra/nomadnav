import { Globe } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg font-headline">
        Travel<span className="text-primary">Explorer</span>
      </span>
    </div>
  );
}