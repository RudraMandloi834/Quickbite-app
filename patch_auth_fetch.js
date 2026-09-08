const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

const replacement = `async function authFetch(url: string, options: RequestInit = {}) {
  const headers = { ...options.headers, ...getAuthHeaders() };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      // Trigger a custom event for AuthContext to handle
      window.dispatchEvent(new Event("auth_unauthorized"));
    }
    throw new ApiError("Unauthorized", res.status);
  }
  if (res.status === 403) {
    // Just throw, do not wipe token or redirect
    throw new ApiError("Forbidden", res.status);
  }`;

code = code.replace(/async function authFetch\([\s\S]*?throw new ApiError\("Unauthorized", res\.status\);\n  \}/, replacement);
fs.writeFileSync('frontend/src/lib/api.ts', code);
