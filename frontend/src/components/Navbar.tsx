"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "./Container";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";

function PartnerDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // slight delay to prevent flicker when moving mouse
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        onClick={toggleDropdown}
        className="hover:text-brand-fg font-semibold text-brand-primary flex items-center gap-1 py-2"
        aria-expanded={isOpen}
      >
        Partner
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 top-full w-48 bg-white border border-gray-200 rounded shadow-lg z-[100]"
          onClick={closeDropdown}
        >
          <Link href="/restaurant/dashboard" className="block px-4 py-2 hover:bg-gray-100 text-brand-fg">Partner Dashboard</Link>
          <Link href="/restaurant/register" className="block px-4 py-2 hover:bg-gray-100 text-brand-fg">Register Restaurant</Link>
          <Link href="/restaurant/join" className="block px-4 py-2 hover:bg-gray-100 text-brand-fg">Join Restaurant</Link>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const router = useRouter();
  const { user, logout, requireAuth } = useAuth();
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout();
  };

  const roles = user?.roles || [];
  const isOperator = roles.includes("OPERATOR");
  const isDriver = roles.includes("DRIVER");
  const isCustomer = roles.includes("CUSTOMER") || (!isOperator && !isDriver);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-brand-fg">
          QuickBite<span className="text-brand-primary">.</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-brand-muted items-center">
          {isOperator && (
            <>
              <Link href="/admin/dashboard" className="hover:text-brand-fg font-semibold text-purple-600">Admin Dashboard</Link>
              <Link href="/operator/restaurants" className="hover:text-brand-fg">Restaurant Approvals</Link>
              <Link href="/admin/dashboard" className="hover:text-brand-fg">All Restaurants</Link>
              <Link href="/admin/dashboard" className="hover:text-brand-fg">All Orders</Link>
            </>
          )}

          {isDriver && (
            <>
              <Link href="/driver" className="hover:text-brand-fg font-semibold text-amber-600">Driver Dashboard</Link>
              <Link href="/driver" className="hover:text-brand-fg">My Deliveries</Link>
            </>
          )}

          {isCustomer && !isOperator && !isDriver && (
            <>
              <Link href="/" className="hover:text-brand-fg py-2">Home</Link>
              <Link href="/restaurants" className="hover:text-brand-fg py-2">Top Rated</Link>
              <PartnerDropdown />
            </>
          )}
        </nav>

        <div className="flex items-center gap-5">
          {isCustomer && !isOperator && !isDriver && (
            <>
              <Link href="/orders" className="flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">
                Orders
              </Link>
              <Link href="/cart" className="flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">
                Cart
              </Link>
            </>
          )}
          
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
