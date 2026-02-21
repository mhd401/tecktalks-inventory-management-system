const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function parseError(res) {
  try {
    const data = await res.json();
    return data?.detail || JSON.stringify(data);
  } catch {
    return await res.text();
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message || "API request failed");
  }

  // For safety if any endpoint returns empty body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}