const BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "token";

export function getStoredToken() {
  const raw = localStorage.getItem(TOKEN_KEY);
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
  localStorage.setItem(TOKEN_KEY, token); // save raw token string
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  // optional cleanup if you previously used another key
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
    // notify AuthContext to logout
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}