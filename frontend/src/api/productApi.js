import { apiFetch } from "./client";

export const productApi = {
  create: (payload) =>
    apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listByStock: (stockId) =>
    apiFetch(`/stocks/${stockId}/products`),
};