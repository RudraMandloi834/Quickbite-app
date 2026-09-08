"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/restaurants";
  const message = searchParams.get("message");
  const signupSuccess = searchParams.get("signup") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await login(email, password);
      setToken(token);
      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      setError(((err as Error).message) || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm text-center font-medium">
          {message}
        </div>
      )}
      {signupSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm text-center font-medium">
          Account created successfully! Please log in.
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg transition-shadow"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>

        <p className="text-center text-sm text-brand-muted pt-2">
          Don&apos;t have an account?{" "}
          <Link href={`/signup${redirectPath !== "/restaurants" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`} className="text-brand-primary font-medium hover:text-brand-primary-hover underline underline-offset-4 transition-colors">
            Sign up
          </Link>
        </p>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <Container className="py-16 md:py-24 flex-1 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg tracking-tight mb-3">
          Welcome back
        </h1>
        <p className="text-brand-muted text-lg">
          Log in to your QuickBite account
        </p>
      </div>

      <Card className="shadow-sm border-brand-border/60">
        <CardContent className="p-6 sm:p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-brand-muted">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </Container>
  );
}
