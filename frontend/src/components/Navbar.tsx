"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Container } from "./Container";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { ShoppingBag, Menu, X, User as UserIcon, LogOut, ChevronDown, Store, Bike, Shield } from "lucide-react";
import { getStoredCartId, fetchCartDisplay } from "@/lib/cart";

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
    }, 150);
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
        className="hover:text-brand-fg font-semibold text-brand-primary flex items-center gap-1 py-2 text-sm"
        aria-expanded={isOpen}
      >
        Partner
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 top-full w-52 bg-white border border-stone-200 rounded-xl shadow-xl py-2 z-[100]"
          onClick={closeDropdown}
        >
          <Link href="/restaurant/dashboard" className="block px-4 py-2 hover:bg-stone-50 text-brand-fg text-sm">Partner Dashboard</Link>
          <Link href="/restaurant/register" className="block px-4 py-2 hover:bg-stone-50 text-brand-fg text-sm">Register Restaurant</Link>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, requireAuth } = useAuth();
  const isLoggedIn = !!user;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Keep cart item count synchronized
  useEffect(() => {
    let ignore = false;
    const updateCartCount = async () => {
      const cid = getStoredCartId();
      if (!cid) {
        if (!ignore) setCartCount(0);
        return;
      }
      try {
        const display = await fetchCartDisplay(cid);
        if (!ignore && display && display.items) {
          const totalItems = display.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
          setCartCount(totalItems);
        }
      } catch {
        if (!ignore) setCartCount(0);
      }
    };

    updateCartCount();

    const handleCartUpdated = () => {
      updateCartCount();
    };

    window.addEventListener("quickbite_cart_updated", handleCartUpdated);
    window.addEventListener("storage", handleCartUpdated);

    return () => {
      ignore = true;
      window.removeEventListener("quickbite_cart_updated", handleCartUpdated);
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, [pathname]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push("/");
  };

  const roles = user?.roles || [];
  const isOperator = roles.includes("OPERATOR");
  const isDriver = roles.includes("DRIVER");
  const isCustomer = roles.includes("CUSTOMER") || (!isOperator && !isDriver);

  const userInitial = user?.sub ? user.sub.charAt(0).toUpperCase() : "U";
  const displayName = user?.sub ? user.sub.split('@')[0] : "Account";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-white/95 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-brand-fg shrink-0 flex items-center">
            QuickBite<span className="text-brand-primary">.</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-8 text-sm font-medium text-brand-muted items-center">
            {isOperator && (
              <Link href="/admin/dashboard" className="hover:text-brand-fg font-semibold text-brand-secondary flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}

            {isDriver && (
              <>
                <Link href="/driver" className="hover:text-brand-fg font-semibold text-brand-secondary flex items-center gap-1.5">
                  <Bike className="w-4 h-4" /> Driver Dashboard
                </Link>
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {isCustomer && !isOperator && !isDriver && (
              <>
                <Link href="/orders" className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">
                  Orders
                </Link>
                <Link href="/cart" className="relative flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold flex items-center justify-center text-xs">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-brand-fg truncate max-w-[130px]" title={user?.sub}>
                    {displayName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-stone-500 hover:text-red-600 transition-colors px-2 py-1"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => requireAuth(() => {})}
                  className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors px-2 py-1"
                >
                  Log in
                </button>
                <button
                  onClick={() => requireAuth(() => {})}
                  className="rounded-full bg-brand-fg px-4 py-2 text-sm font-semibold text-white hover:bg-brand-fg/90 transition-colors shadow-sm"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls (Clean, uncluttered, fits 320px screens perfectly) */}
          <div className="flex md:hidden items-center gap-2 sm:gap-3">
            {/* Mobile Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-brand-fg hover:text-brand-primary transition-colors rounded-lg"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-primary text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Auth Controls */}
            {isLoggedIn ? (
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-bold text-xs"
                aria-label="User Profile"
              >
                {userInitial}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => requireAuth(() => {})}
                  className="px-2.5 py-1 text-xs font-medium text-brand-fg hover:text-brand-primary transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => requireAuth(() => {})}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-full transition-colors shadow-sm"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-stone-600 hover:text-brand-fg transition-colors rounded-lg focus:outline-none"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </Container>
      </header>

      {/* Mobile Drawer Overlay & Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full ml-auto shadow-2xl flex flex-col p-6 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <span className="font-bold text-lg text-brand-fg">QuickBite<span className="text-brand-primary">.</span></span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User status in drawer */}
            {isLoggedIn ? (
              <div className="bg-stone-50 p-3.5 rounded-xl mb-4 border border-stone-200/60">
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-stone-900 truncate mt-0.5">{user?.sub}</p>
              </div>
            ) : null}

            {/* Navigation Links in Drawer */}
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              <Link 
                href="/" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/restaurants" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
              >
                Explore Restaurants
              </Link>
              <Link 
                href="/orders" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
              >
                My Orders
              </Link>
              <Link 
                href="/profile" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
              >
                My Profile
              </Link>

              <div className="pt-3 pb-1 border-t border-stone-100 my-2">
                <p className="px-3 text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Partners & Drivers</p>
                <Link 
                  href="/restaurant/dashboard" 
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-stone-700 hover:bg-stone-50"
                >
                  <Store className="w-4 h-4 text-brand-primary" /> Partner Dashboard
                </Link>
                <Link 
                  href="/restaurant/register" 
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-stone-700 hover:bg-stone-50"
                >
                  <Store className="w-4 h-4 text-brand-primary" /> Register Restaurant
                </Link>
                <Link 
                  href="/driver" 
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-stone-700 hover:bg-stone-50"
                >
                  <Bike className="w-4 h-4 text-brand-primary" /> Delivery Dashboard
                </Link>
                {isOperator && (
                  <Link 
                    href="/admin/dashboard" 
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-brand-secondary font-bold hover:bg-stone-50"
                  >
                    <Shield className="w-4 h-4" /> Admin Console
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-stone-100">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      requireAuth(() => {});
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
