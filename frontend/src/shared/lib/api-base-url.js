const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

// API modules already include the `/api` prefix in their endpoint paths. On
// Vercel the rewrite therefore needs a same-origin base URL, not `/api`.
export const apiBaseUrl = configuredBaseUrl === "/api"
    ? ""
    : configuredBaseUrl || (import.meta.env.PROD ? "" : "http://localhost:3000");
