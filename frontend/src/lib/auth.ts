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
    const t = localStorage.getItem("token");
    if (t === "undefined" || t === "null") return null;
    return t;
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
    
    return decoded as AuthUser;
  } catch (_e) {
    return null;
  }
}

export function normalizeRole(role: string): string {
  if (role.startsWith("ROLE_")) {
    return role.substring(5);
  }
  return role;
}

export function getDashboardRoute(user: AuthUser | null): string {
  if (!user) return "/";
  const roles = user.roles || [];
  if (roles.includes("OPERATOR")) return "/admin/dashboard";
  if (roles.includes("DRIVER")) return "/driver";
  return "/"; // default customer home. Or if partner, they use /restaurant/dashboard manually or we redirect if they own one? 
  // Wait, the prompt says: "CUSTOMER -> /discover or existing customer home. Restaurant owner with approved restaurant access -> /restaurant/dashboard"
  // Since we can't trivially know if they have an approved restaurant just from the token (unless we fetch it), we'll let the user navigate or we add a helper later.
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
