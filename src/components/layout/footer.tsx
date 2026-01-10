'use client';

import { useState, useEffect } from 'react';

export function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {year} Nomad Navigator. All rights reserved.</p>
        <p className="mt-2">Your seamless journey starts here.</p>
      </div>
    </footer>
  );
}
