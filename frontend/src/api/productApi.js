import { api } from "./client";

export const productApi = {
  listByStock: (stockId) => api(`/stocks/${stockId}/products`),

  create: (payload) =>
    api("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (productId, payload) =>
    api(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (productId) =>
    api(`/products/${productId}`, {
      method: "DELETE",
    }),

  adjustQuantity: (productId, payload) =>
    api(`/products/${productId}/adjust-quantity`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};