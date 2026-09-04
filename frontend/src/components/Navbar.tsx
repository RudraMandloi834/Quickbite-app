import Link from "next/link";
import { Container } from "./Container";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-brand-fg">
          QuickBite<span className="text-brand-primary">.</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-brand-muted">
          <Link href="/" className="hover:text-brand-fg transition-colors">Discover</Link>
          <Link href="/restaurants" className="hover:text-brand-fg transition-colors">Top Rated</Link>
          <Link href="/offers" className="hover:text-brand-fg transition-colors">Offers</Link>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Cart
          </Link>
          <Link href="/login" className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-fg px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-fg/90 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </Container>
    </header>
  );
}
