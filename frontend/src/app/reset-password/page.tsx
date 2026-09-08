"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { getApiBaseUrl } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Failed to reset password. The link may have expired.");
      }
      
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="font-medium text-brand-fg text-lg">Password updated</h3>
        <p className="text-brand-muted text-sm">
          Your password has been changed successfully.
        </p>
        <Button href="/" variant="primary" className="w-full mt-4">
          Continue to QuickBite
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium mb-4">Invalid password reset link.</p>
        <Button href="/" variant="outline">Return home</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-brand-fg mb-1">New Password</label>
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} minLength={6}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-fg text-sm">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-fg mb-1">Confirm New Password</label>
        <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6}
          className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" />
      </div>

      <Button type="submit" disabled={loading} className="w-full h-11 mt-2" variant="primary">
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Container className="py-16 md:py-24 flex-1 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg tracking-tight mb-3">
          Set new password
        </h1>
        <p className="text-brand-muted text-lg">
          Please enter your new password below.
        </p>
      </div>

      <Card className="shadow-sm border-brand-border/60">
        <CardContent className="p-6 sm:p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-brand-muted">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </Container>
  );
}
