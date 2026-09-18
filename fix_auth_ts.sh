#!/bin/bash
cat << 'INNER_EOF' > frontend/src/lib/auth.ts
export interface AuthUser {
  customerId: number;
  roles?: string[];
  sub: string;
  exp: number;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

export function getUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp * 1000 < Date.now()) {
      removeToken(); // Token expired
      return null;
    }
    
    // Normalize roles
    if (decoded.roles && Array.isArray(decoded.roles)) {
      decoded.roles = decoded.roles.map(normalizeRole);
    } else if (typeof decoded.roles === "string") {
      decoded.roles = [normalizeRole(decoded.roles as string)];
    } else if (decoded.role && typeof decoded.role === "string") {
      decoded.roles = [normalizeRole(decoded.role as string)];
    }
    
    // Print only the role name per user requirement
    if (typeof window !== "undefined") {
       console.log("Logged in roles:", decoded.roles);
    }

    return decoded as AuthUser;
  } catch (_e) {
    return null;
  }
}

export function normalizeRole(role: string): string {
  let normalized = role;
  if (normalized.startsWith("ROLE_")) {
    normalized = normalized.substring(5);
  }
  normalized = normalized.toUpperCase();
  if (normalized === "ADMIN") {
    normalized = "OPERATOR";
  }
  return normalized;
}

export function getDashboardRoute(user: AuthUser | null): string {
  if (!user) return "/";
  const roles = user.roles || [];
  if (roles.includes("OPERATOR")) return "/admin/dashboard";
  if (roles.includes("DRIVER")) return "/driver";
  // The Prompt requires Restaurant Partner -> /restaurant/dashboard
  if (roles.includes("RESTAURANT_PARTNER")) return "/restaurant/dashboard";
  return "/"; 
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
INNER_EOF
bash fix_auth_ts.sh
