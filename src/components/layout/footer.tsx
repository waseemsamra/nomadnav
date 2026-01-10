export function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Nomad Navigator. All rights reserved.</p>
        <p className="mt-2">Your seamless journey starts here.</p>
      </div>
    </footer>
  );
}
