import { api } from "./client";

export const posApi = {
  list: () => api("/pos"),
  listByStock: (stockId) => api(`/pos/stocks/${stockId}`),
  get: (posId) => api(`/pos/${posId}`),

  create: (payload) =>
    api("/pos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (posId, payload) =>
    api(`/pos/${posId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (posId) =>
    api(`/pos/${posId}`, {
      method: "DELETE",
    }),

  // Sessions
  getLatestSession: (posId) => api(`/pos/${posId}/session`),
  listSessions: (posId) => api(`/pos/${posId}/sessions`),
  openSessionLegacy: (posId) => api(`/pos/${posId}/session/open`, { method: "POST" }),
  closeSessionLegacy: (posId) => api(`/pos/${posId}/session/close`, { method: "POST" }),

  expectedOpeningCash: (posId) => api(`/pos/${posId}/drawer/expected-opening-cash`),
  drawerSummary: (posId) => api(`/pos/${posId}/drawer/summary`),
  openSessionWithCash: (posId, opening_cash) =>
    api(`/pos/${posId}/session/open-with-cash`, {
      method: "POST",
      body: JSON.stringify({ opening_cash }),
    }),
  closeSessionWithCash: (posId, closing_cash) =>
    api(`/pos/${posId}/session/close-with-cash`, {
      method: "POST",
      body: JSON.stringify({ closing_cash }),
    }),

  cashMove: (posId, move_type, amount, note) =>
    api(`/pos/${posId}/cash-move`, {
      method: "POST",
      body: JSON.stringify({ move_type, amount, note }),
    }),

  // Products (scoped to POS stock)
  listProducts: (posId, q = "") =>
    api(`/pos/${posId}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  searchByImage: (posId, file) => {
    const form = new FormData();
    form.append("image", file);
    return api(`/pos/${posId}/products/search-by-image`, {
      method: "POST",
      body: form,
    });
  },

  // Orders
  payOrder: (posId, lines) =>
    api(`/pos/${posId}/orders/pay`, {
      method: "POST",
      body: JSON.stringify({ lines, payment_method: "CASH" }),
    }),
};
