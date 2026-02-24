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

identifyByImage: async ({ file, pos_id, stock_id }) => {
  const form = new FormData();
  form.append("image", file);
  if (pos_id != null) form.append("pos_id", String(pos_id));
  if (stock_id != null) form.append("stock_id", String(stock_id));

  return api("/products/identify-by-image", {
    method: "POST",
    body: form,
  });
}};
