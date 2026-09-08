"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { signup, login } from "@/lib/api";
import { setToken } from "@/lib/auth";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/restaurants";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(name, email, password);
      // Automatically log them in after signup
      const { token } = await login(email, password);
      setToken(token);
      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      setError(((err as Error).message) || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-fg" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg transition-shadow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-fg" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg transition-shadow"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-fg" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg transition-shadow"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-brand-muted pt-2">
          Already have an account?{" "}
          <Link href={`/login${redirectPath !== "/restaurants" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`} className="text-brand-primary font-medium hover:text-brand-primary-hover underline underline-offset-4 transition-colors">
            Log in
          </Link>
        </p>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <Container className="py-16 md:py-24 flex-1 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg tracking-tight mb-3">
          Join QuickBite
        </h1>
        <p className="text-brand-muted text-lg">
          Create an account to start ordering
        </p>
      </div>

      <Card className="shadow-sm border-brand-border/60">
        <CardContent className="p-6 sm:p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-brand-muted">Loading...</div>}>
            <SignupForm />
          </Suspense>
        </CardContent>
      </Card>
    </Container>
  );
}
