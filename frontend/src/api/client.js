const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function parseError(res) {
  try {
    const data = await res.json();
    // FastAPI commonly returns { detail: ... }
    return data?.detail ? JSON.stringify(data.detail) : JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return `HTTP ${res.status}`;
    }
  }
}

export async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  // handle empty body responses safely
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();

  const text = await res.text();
  return text ? text : null;
}