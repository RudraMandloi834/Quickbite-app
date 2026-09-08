"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./Button";
import Link from "next/link";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, signup } = useAuth();
  
  const [view, setView] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView("login");
      setError("");
      setEmail("");
      setPassword("");
      setName("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(((err as Error).message) || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (err: unknown) {
      setError(((err as Error).message) || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // redirect to backend OAuth2 endpoint
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const calculateStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength += 25;
    if (pass.length > 7) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    return strength;
  };
  const strength = calculateStrength(password);

  const getStrengthColor = () => {
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-amber-500";
    if (strength <= 75) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-fg/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md" style={{ perspective: "1000px" }}>
        
        {/* Flip Container */}
        <div 
          className="relative w-full transition-transform duration-500" 
          style={{ 
            transformStyle: "preserve-3d", 
            transform: view === "signup" ? "rotateY(180deg)" : "rotateY(0deg)",
            height: view === "signup" ? "650px" : "550px"
          }}
        >
          
          {/* LOGIN FRONT */}
          <div 
            className="absolute inset-0 bg-brand-card rounded-2xl shadow-xl border border-brand-border overflow-hidden flex flex-col p-6 sm:p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-semibold text-brand-fg">Welcome back</h2>
              <button onClick={onClose} className="text-brand-muted hover:text-brand-fg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {error && view === "login" && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-brand-fg mb-1">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-fg mb-1">Password</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-fg">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Link href="/forgot-password" onClick={onClose} className="text-sm text-brand-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full h-11" variant="primary">
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-brand-card text-brand-muted">Or continue with</span></div>
              </div>
              <button type="button" onClick={googleLogin} className="mt-4 w-full flex items-center justify-center gap-2 h-11 px-4 border border-brand-border rounded-lg hover:bg-stone-50 transition-colors text-brand-fg font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Google
              </button>
            </div>
            
            <p className="mt-6 text-center text-sm text-brand-muted">
              Don't have an account? <button type="button" onClick={() => { setView("signup"); setError(""); }} className="text-brand-primary hover:underline font-medium">Sign up</button>
            </p>
          </div>
          
          {/* SIGNUP BACK */}
          <div 
            className="absolute inset-0 bg-brand-card rounded-2xl shadow-xl border border-brand-border overflow-hidden flex flex-col p-6 sm:p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-serif font-semibold text-brand-fg">Create account</h2>
              <button onClick={onClose} className="text-brand-muted hover:text-brand-fg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {error && view === "signup" && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
            )}
            
            <form onSubmit={handleSignup} className="space-y-3 flex-1">
              <div>
                <label className="block text-xs font-medium text-brand-fg mb-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-fg mb-1">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-fg mb-1">Password</label>
                <div className="relative">
                  <input required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-fg text-sm">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-1.5 flex gap-1 h-1 w-full rounded overflow-hidden bg-stone-100">
                    <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${strength}%` }} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-fg mb-1">Confirm Password</label>
                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full h-11 mt-2" variant="primary">
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>
            
            <div className="mt-4">
              <button type="button" onClick={googleLogin} className="w-full flex items-center justify-center gap-2 h-11 px-4 border border-brand-border rounded-lg hover:bg-stone-50 transition-colors text-brand-fg font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
              </button>
            </div>
            
            <p className="mt-4 text-center text-sm text-brand-muted">
              Already have an account? <button type="button" onClick={() => { setView("login"); setError(""); }} className="text-brand-primary hover:underline font-medium">Log in</button>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
