"use client";

import Link from "next/link";
import { Container } from "./Container";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <footer className="hidden md:block bg-brand-fg text-brand-border pt-16 pb-8 mt-auto">
      <Container>
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
            <Link href="/" className="font-sans text-2xl font-bold tracking-tight text-white mb-4 block">
              QuickBite<span className="text-brand-primary">.</span>
            </Link>
            <p className="text-sm text-brand-muted">
              Good food, delivered fast. Experience the best restaurants near you.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-brand-muted">
              <li><Link href="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-brand-muted">
              <li><Link href="/" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Partner with us</h4>
            <ul className="space-y-2 text-sm text-brand-muted">
              <li><Link href="/restaurant/register" className="hover:text-white transition-colors">Add your restaurant</Link></li>
              <li><Link href="/driver" className="hover:text-white transition-colors">Sign up to deliver</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-muted/30 pt-8 flex justify-between items-center text-sm text-brand-muted">
          <p>&copy; {new Date().getFullYear()} QuickBite Technologies Inc.</p>
          <div className="flex gap-4">
            <span>Eat</span>
            <span className="w-1 h-1 rounded-full bg-brand-primary self-center"></span>
            <span>Explore</span>
            <span className="w-1 h-1 rounded-full bg-brand-primary self-center"></span>
            <span>Enjoy</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
