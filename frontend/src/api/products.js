import { api } from "./client";

export const createProduct = (payload) =>
  api("/products", { method: "POST", body: JSON.stringify(payload) });

export const listProductsByStock = (stockId) =>
  api(`/stocks/${stockId}/products`);
