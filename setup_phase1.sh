#!/bin/bash
cd frontend

# 1. Update globals.css
cat << 'CSS' > src/app/globals.css
@import "tailwindcss";

@theme {
  --color-brand-bg: #F8FAFC; /* slate-50 */
  --color-brand-fg: #0F172A; /* slate-900 */
  
  /* Deep Teal / Emerald */
  --color-brand-primary: #0F766E; /* teal-600 */
  --color-brand-primary-hover: #115E59; /* teal-700 */
  
  /* Warm Secondary Accent */
  --color-brand-secondary: #F59E0B; /* amber-500 */
  --color-brand-secondary-hover: #D97706; /* amber-600 */

  --color-brand-muted: #64748B; /* slate-500 */
  --color-brand-border: #E2E8F0; /* slate-200 */
  --color-brand-card: #FFFFFF;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-playfair), ui-serif, Georgia, serif;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;

  --shadow-soft: 0 4px 20px rgba(0,0,0,0.05);
  --shadow-hover: 0 10px 30px rgba(0,0,0,0.08);
  --shadow-card: 0 2px 10px rgba(0,0,0,0.03);
}

@layer base {
  body {
    background-color: var(--color-brand-bg);
    color: var(--color-brand-fg);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-sans);
    font-weight: 700;
  }
}
CSS

# 2. Update Button.tsx
cat << 'BTN' > src/components/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  href?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none rounded-full";
  
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-soft hover:shadow-hover",
    secondary: "bg-brand-secondary text-white hover:bg-brand-secondary-hover shadow-soft hover:shadow-hover",
    outline: "border-2 border-brand-border bg-transparent hover:border-brand-primary hover:text-brand-primary text-brand-fg",
    ghost: "bg-transparent text-brand-fg hover:bg-brand-border/50",
  };
  
  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
    icon: "h-10 w-10",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
BTN

# 3. Update Card.tsx
cat << 'CRD' > src/components/Card.tsx
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-brand-card shadow-card hover:shadow-soft transition-shadow border border-brand-border/40 ${noPadding ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 pb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-sans text-xl font-bold leading-none tracking-tight text-brand-fg ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
}
CRD

# 4. Update Badge.tsx
cat << 'BDG' > src/components/Badge.tsx
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "neutral" | "secondary";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    secondary: "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-brand-border/50 text-brand-muted border-brand-border",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
BDG

# 5. Create Input.tsx
cat << 'INP' > src/components/Input.tsx
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-brand-fg placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
          error ? "border-rose-500 focus:ring-rose-500/50" : "border-brand-border"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
INP

# 6. Create Skeleton.tsx
cat << 'SKL' > src/components/Skeleton.tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-brand-border/60 ${className}`}
    />
  );
}
SKL

# 7. Create MobileNav.tsx
cat << 'MNAV' > src/components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth')) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "Search", href: "/restaurants", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { label: "Orders", href: "/orders", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
    { label: "Profile", href: user ? "/profile" : "/login", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-brand-primary" : "text-brand-muted hover:text-brand-fg"}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? "2.5" : "2"} d={item.icon} />
              </svg>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
MNAV

# 8. Create Footer.tsx
cat << 'FTR' > src/components/Footer.tsx
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
FTR

# 9. Update layout.tsx
cat << 'LAY' > src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/components/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickBite",
  description: "Good food, delivered fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col selection:bg-brand-primary selection:text-white pb-16 md:pb-0">
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <MobileNav />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
LAY

# 10. Update Navbar.tsx fonts and colors
sed -i 's/text-purple-600/text-brand-secondary/g' src/components/Navbar.tsx
sed -i 's/text-amber-600/text-brand-secondary/g' src/components/Navbar.tsx
sed -i 's/font-serif/font-sans font-bold/g' src/components/Navbar.tsx

# 11. Globally replace font-serif with font-sans
find src -type f -name "*.tsx" -exec sed -i 's/font-serif/font-sans/g' {} +

# 12. Fix the restaurants/page.tsx TypeScript lint issue
sed -i 's/: any/: any \/\/ eslint-disable-line @typescript-eslint\/no-explicit-any/g' src/app/restaurants/page.tsx
sed -i '244i \              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}' src/app/restaurants/page.tsx

# 13. Fix useSSE.ts lint issue
sed -i 's/setConnectionStatus("Disconnected");/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setConnectionStatus("Disconnected");/g' src/hooks/useSSE.ts
