"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      // Wait a tick then reload to let AuthContext pick it up
      setTimeout(() => {
        window.location.assign("/");
      }, 500);
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
