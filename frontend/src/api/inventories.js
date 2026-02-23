import { api } from "./client";

export const getInventories = () => api("/inventories/");
export const createInventory = (payload) =>
  api("/inventories/", { method: "POST", body: JSON.stringify(payload) });
