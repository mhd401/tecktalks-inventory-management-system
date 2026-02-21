import { apiFetch } from "./client";

export const inventoryApi = {
  list: () => apiFetch("/inventories/"),
  create: (payload) =>
    apiFetch("/inventories/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};