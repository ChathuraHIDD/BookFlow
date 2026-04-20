import { useEffect, useState } from "react";
import api, { readApiError, setAuthorizationToken } from "../services/api";
import { normalizeRole } from "../utils/role";
import AuthContext from "./auth-context";

const STORAGE_KEY = "bookflow_auth";

const normalizeUser = (user) => ({
  ...user,
  role: normalizeRole(user?.role),
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setReady(true);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        if (!parsed?.token) {
          setReady(true);
          return;
        }

        setAuthorizationToken(parsed.token);
        const { data } = await api.get("/auth/me");
        setToken(parsed.token);
        setUser(normalizeUser(data));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setAuthorizationToken(null);
      } finally {
        setReady(true);
      }
    };

    restore();
  }, []);

  const persistAuth = (authToken, authUser) => {
    const normalizedUser = normalizeUser(authUser);
    setToken(authToken);
    setUser(normalizedUser);
    setAuthorizationToken(authToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: authToken }));
    return normalizedUser;
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      return persistAuth(data.token, data.user);
    } catch (error) {
      throw new Error(readApiError(error));
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      return persistAuth(data.token, data.user);
    } catch (error) {
      throw new Error(readApiError(error));
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const { data } = await api.post("/auth/google/login", { idToken });
      return persistAuth(data.token, data.user);
    } catch (error) {
      throw new Error(readApiError(error));
    }
  };

  const registerWithGoogle = async (payload) => {
    try {
      const { data } = await api.post("/auth/google/register", payload);
      return persistAuth(data.token, data.user);
    } catch (error) {
      throw new Error(readApiError(error));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthorizationToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    token,
    user,
    ready,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    loginWithGoogle,
    registerWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
