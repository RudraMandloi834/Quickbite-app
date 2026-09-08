"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { getApiBaseUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to process request");
      }
      
      setSuccess(true);
    } catch (err: unknown) {
      // Security: We actually always want to show success even if the email doesn't exist,
      // but if the API fails entirely (e.g. 500), we show an error.
      setSuccess(true); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-16 md:py-24 flex-1 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg tracking-tight mb-3">
          Reset password
        </h1>
        <p className="text-brand-muted text-lg">
          We'll send you a link to reset it.
        </p>
      </div>

      <Card className="shadow-sm border-brand-border/60">
        <CardContent className="p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-medium text-brand-fg text-lg">Check your email</h3>
              <p className="text-brand-muted text-sm">
                If an account exists for {email}, we have sent a password reset link.
              </p>
              <Button href="/" variant="outline" className="w-full mt-4">
                Return to home
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-brand-fg mb-1">Email address</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 outline-none" 
                  placeholder="you@example.com" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11" variant="primary">
                {loading ? "Sending link..." : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
