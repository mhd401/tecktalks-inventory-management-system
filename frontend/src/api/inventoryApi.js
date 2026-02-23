import { api } from "./client";

export const inventoryApi = {
  list: () => api("/inventories"),

  create: (payload) =>
    api("/inventories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (inventoryId, payload) =>
    api(`/inventories/${inventoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (inventoryId) =>
    api(`/inventories/${inventoryId}`, {
      method: "DELETE",
    }),
};