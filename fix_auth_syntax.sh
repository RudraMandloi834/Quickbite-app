#!/bin/bash
cat << 'INNER_EOF' > frontend/src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiSignup, apiLogout } from "@/lib/api";
import { getUser, saveToken, removeToken, AuthUser, getDashboardRoute } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  requireAuth: (action: () => void) => void;
  closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    removeToken();
    const { token } = await apiLogin(email, pass);
    saveToken(token);
    const newUser = getUser();
    setUser(newUser);
    
    setIsModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    } else {
      router.push(getDashboardRoute(newUser));
    }
  }, [pendingAction, router]);

  const signup = useCallback(async (name: string, email: string, pass: string) => {
    removeToken();
    await apiSignup(name, email, pass);
    const { token } = await apiLogin(email, pass);
    saveToken(token);
    const newUser = getUser();
    setUser(newUser);
    
    setIsModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    } else {
      router.push(getDashboardRoute(newUser));
    }
  }, [pendingAction, router]);

  const logout = useCallback(() => {
    apiLogout();
    removeToken();
    setUser(null);
    router.push("/");
  }, [router]);

  const requireAuth = useCallback((action: () => void) => {
    if (getUser()) {
      action();
    } else {
      setPendingAction(() => action);
      setIsModalOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, requireAuth, closeModal }}>
      {children}
      {/* Dynamic import of AuthModal prevents circular dependency issues during SSR */}
      {isModalOpen && (
        <AuthModalWrapper onClose={closeModal} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthModalWrapper({ onClose }: { onClose: () => void }) {
  const { default: AuthModal } = require('@/components/AuthModal');
  return <AuthModal isOpen={true} onClose={onClose} />;
}
INNER_EOF
bash fix_auth_syntax.sh
cd frontend && npm run build
