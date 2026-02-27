// IMPORTANT: configure via frontend/.env (Vite)
// Example: VITE_API_URL=http://127.0.0.1:8000
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "token";

export function getApiBaseUrl() {
  return BASE_URL;
}
export function getStoredToken() {
  // support both keys (some parts store "access_token")
  const raw = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!raw) return null;

  // handle old values accidentally saved with quotes
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
export function setStoredToken(token) {
  if (!token) return;
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token); // keep both for compatibility
}

export function clearStoredToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
}

async function parseError(res) {
  try {
    const data = await res.json();
    return data?.detail || JSON.stringify(data);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function api(path, options = {}) {
  const token = getStoredToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}