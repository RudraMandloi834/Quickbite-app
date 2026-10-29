"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;

    // 1. Preferred secure approach: Extract token from URL fragment (never sent to servers)
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      token = hashParams.get("token");
    }

    // 2. Backward compatibility fallback: Check query parameter if fragment is absent
    if (!token) {
      token = searchParams.get("token");
    }

    if (token) {
      // Immediately clear the fragment from browser URL / history to avoid leakage
      if (typeof window !== "undefined" && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      setToken(token);
      // Wait a tick then reload to let AuthContext pick it up
      setTimeout(() => {
        window.location.assign("/");
      }, 300);
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-brand-muted font-medium">Authenticating...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
