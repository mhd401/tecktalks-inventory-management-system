const BASE = import.meta.env.VITE_API_URL;

export async function getInventories() {
  const res = await fetch(`${BASE}/inventories`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
