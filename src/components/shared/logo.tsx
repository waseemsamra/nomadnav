import { Globe } from 'lucide-react';

export function Logo() {
  return (
    <>
      <Globe className="logo-icon" />
      <span className="logo-text">
        Travel<span className="logo-highlight">Explorer</span>
      </span>
    </>
  );
}