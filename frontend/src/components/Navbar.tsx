"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Container } from "./Container";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, requireAuth } = useAuth();
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-brand-fg">
          QuickBite<span className="text-brand-primary">.</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-brand-muted">
          <Link href="/" className="hover:text-brand-fg transition-colors">Discover</Link>
          <Link href="/restaurants" className="hover:text-brand-fg transition-colors">Top Rated</Link>
          <Link href="/restaurant/onboarding-status" className="hover:text-brand-fg transition-colors font-semibold text-brand-primary">Partner</Link>
          {user?.roles?.includes("ROLE_OPERATOR") && <Link href="/operator/restaurants" className="hover:text-brand-fg transition-colors font-semibold text-purple-600">Operator</Link>}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Orders</span>
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Cart
          </Link>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-brand-muted hidden md:inline-block truncate max-w-[150px]" title={user?.sub}>
                {user?.sub?.split('@')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => requireAuth(() => {})} className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">Log in</button>
              <button onClick={() => requireAuth(() => {})} className="rounded-full bg-brand-fg px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-fg/90 transition-colors">Sign up</button>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
