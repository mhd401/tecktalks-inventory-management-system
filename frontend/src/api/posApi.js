import { apiFetch } from "./client";

export const posApi = {
  list: () => apiFetch("/pos/"),
  listByStock: (stockId) => apiFetch(`/pos/stocks/${stockId}`),

  create: (payload) =>
    apiFetch("/pos/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (posId, payload) =>
    apiFetch(`/pos/${posId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (posId) =>
    apiFetch(`/pos/${posId}`, {
      method: "DELETE",
    }),

  openSession: (posId) => apiFetch(`/pos/${posId}/session/open`, { method: "POST" }),
  closeSession: (posId) => apiFetch(`/pos/${posId}/session/close`, { method: "POST" }),
  listSessions: (posId) => apiFetch(`/pos/${posId}/sessions`),
};