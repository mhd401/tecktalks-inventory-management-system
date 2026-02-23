import { api } from "./client";

export const posApi = {
  list: () => api("/pos"),
  listByStock: (stockId) => api(`/pos/stocks/${stockId}`),

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

  openSession: (posId) => api(`/pos/${posId}/session/open`, { method: "POST" }),
  closeSession: (posId) => api(`/pos/${posId}/session/close`, { method: "POST" }),
  listSessions: (posId) => api(`/pos/${posId}/sessions`),

  getSession: (posId) => api(`/pos/${posId}/session`),
};