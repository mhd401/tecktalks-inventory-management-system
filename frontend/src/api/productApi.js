import { apiFetch } from "./client";

export const productApi = {
  listByStock: (stockId) => apiFetch(`/stocks/${stockId}/products`),

  create: (payload) =>
    apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (productId, payload) =>
    apiFetch(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (productId) =>
    apiFetch(`/products/${productId}`, {
      method: "DELETE",
    }),

  adjustQuantity: (productId, payload) =>
   apiFetch(`/products/${productId}/adjust-quantity`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
};

