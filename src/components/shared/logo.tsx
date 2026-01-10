
import { Wind } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Wind className="h-6 w-6 text-accent" />
      <span className="font-bold text-lg font-headline">Nomad Navigator</span>
    </div>
  );
}
