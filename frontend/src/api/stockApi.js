import { api } from "./client";

export const stockApi = {
  listByInventory: (inventoryId) => api(`/stocks/inventories/${inventoryId}`),

  create: (payload) =>
    api("/stocks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (stockId, payload) =>
    api(`/stocks/${stockId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (stockId) =>
    api(`/stocks/${stockId}`, {
      method: "DELETE",
    }),
};