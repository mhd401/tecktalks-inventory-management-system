import { apiFetch } from "./client";

export const stockApi = {
  listByInventory: (inventoryId) => apiFetch(`/stocks/inventories/${inventoryId}`),

  create: (payload) =>
    apiFetch("/stocks/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (stockId, payload) =>
    apiFetch(`/stocks/${stockId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (stockId) =>
    apiFetch(`/stocks/${stockId}`, {
      method: "DELETE",
    }),
};