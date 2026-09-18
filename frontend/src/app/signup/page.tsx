"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push(getDashboardRoute(user));
    }
  }, [user, loading, router]);

  if (!mounted || loading || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <AuthModal 
        isOpen={true} 
        onClose={() => router.back()}
        defaultView="signup" 
      />
    </div>
  );
}
