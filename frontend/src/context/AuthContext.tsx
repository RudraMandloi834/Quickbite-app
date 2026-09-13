"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, AuthUser, removeToken, setToken as saveToken } from "@/lib/auth";
import { login as apiLogin, signup as apiSignup } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";

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
    
    const handleUnauthorized = () => {
      removeToken();
      setUser(null);
      setIsModalOpen(true);
    };
    
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { token } = await apiLogin(email, pass);
    saveToken(token);
    setUser(getUser());
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsModalOpen(false);
  }, [pendingAction]);

  const signup = useCallback(async (name: string, email: string, pass: string) => {
    await apiSignup(name, email, pass);
    const { token } = await apiLogin(email, pass);
    saveToken(token);
    setUser(getUser());
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsModalOpen(false);
  }, [pendingAction]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setPendingAction(null);
    setIsModalOpen(false);
    // don't navigate away aggressively, just stay where you are
  }, []);

  const requireAuth = useCallback((action: () => void) => {
    const currentUser = getUser();
    if (currentUser) {
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
      <AuthModal isOpen={isModalOpen} onClose={closeModal} />
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
