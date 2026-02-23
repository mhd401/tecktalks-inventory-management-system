import { apiFetch } from "./client";

export const inventoryApi = {
  list: () => apiFetch("/inventories/"),

  create: (payload) =>
    apiFetch("/inventories/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (inventoryId, payload) =>
    apiFetch(`/inventories/${inventoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (inventoryId) =>
    apiFetch(`/inventories/${inventoryId}`, {
      method: "DELETE",
    }),
};