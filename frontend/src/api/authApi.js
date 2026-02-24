import { api } from "./client";

export const authApi = {
  register: (payload) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: ({ email, password }) => {
    const form = new URLSearchParams();
    form.append("username", email); // backend expects "username" field
    form.append("password", password);

    return api("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  },

  me: () => api("/auth/me"),
};