import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadMe = async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      clearStoredToken();
      setToken(null);
      setUser(null);
      return null;
    }
  };

  // On app load / refresh -> restore session if token exists
  useEffect(() => {
    let active = true;

    (async () => {
      if (!token) {
        if (active) setBooting(false);
        return;
      }

      try {
        const me = await authApi.me();
        if (!active) return;
        setUser(me);
      } catch {
        if (!active) return;
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  // 401 from interceptor -> clear local auth state
  useEffect(() => {
    const onUnauthorized = () => {
      clearStoredToken();
      setToken(null);
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    const me = await loadMe();
    if (!me) throw new Error("Failed to load user profile");
    return me;
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}