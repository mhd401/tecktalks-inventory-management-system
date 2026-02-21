import { apiFetch } from "./client";

export const stockApi = {
  create: (payload) =>
    apiFetch("/stocks/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listByInventory: (inventoryId) =>
    apiFetch(`/stocks/inventories/${inventoryId}`),
};