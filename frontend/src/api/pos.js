import { api } from "./client";

export const listPOS = () => api("/pos");

export const createPOS = (payload) =>
  api("/pos", { method: "POST", body: JSON.stringify(payload) });

export const getSession = (posId) =>
  api(`/pos/${posId}/session`);

export const openSessionApi = (posId) =>
  api(`/pos/${posId}/session/open`, { method: "POST" });

export const closeSessionApi = (posId) =>
  api(`/pos/${posId}/session/close`, { method: "POST" });
