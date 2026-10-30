"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, signup as apiSignup } from "@/lib/api";
import { getUser, setToken, removeToken, AuthUser, getDashboardRoute } from "@/lib/auth";
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
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setUser(getUser());
    setLoading(false);

    const handleUnauthorized = () => {
      removeToken();
      setUser(null);
      router.push("/login");
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth_unauthorized", handleUnauthorized);
      return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
    }
  }, [router]);

  const login = useCallback(async (email: string, pass: string) => {
    removeToken();
    const { token } = await apiLogin(email, pass);
    setToken(token);
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
    setToken(token);
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
    removeToken();
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
  return <AuthModal isOpen={true} onClose={onClose} />;
}