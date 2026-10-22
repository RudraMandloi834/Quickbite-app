"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/auth";
import { Container } from "@/components/Container";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import Link from "next/link";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(getDashboardRoute(user));
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to login");
      setIsSubmitting(false);
    }
  };

  if (loading || user) return <div className="min-h-screen bg-stone-50" />;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6">
            <LogIn className="w-6 h-6 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mb-2">Welcome Back</h1>
          <p className="text-stone-500 mb-8">Sign in to continue to QuickBite</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-10 h-12 w-full bg-stone-50 border-stone-200" 
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-stone-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-brand-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="pl-10 h-12 w-full bg-stone-50 border-stone-200" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              variant="primary" 
              className="w-full h-12 text-base font-bold mt-2"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
        <div className="bg-stone-50 p-6 text-center border-t border-stone-100">
          <p className="text-stone-500 text-sm font-medium">
            Don&apos;t have an account? <Link href="/signup" className="text-brand-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
