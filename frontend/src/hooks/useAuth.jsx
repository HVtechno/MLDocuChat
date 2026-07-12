import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAccessToken, getAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email confirmation (and magic links) send the user back with the
  // session tokens in the URL fragment: #access_token=...&refresh_token=...
  // Capture them on load, store them, and clean the URL, so a freshly
  // confirmed user is authenticated instead of landing on the home page.
  const captureTokensFromUrl = useCallback(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return false;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access) {
      setAccessToken(access);
      if (refresh) localStorage.setItem("refresh_token", refresh);
      // strip the token fragment from the URL and go to the app
      window.history.replaceState(null, "", "/chat");
      return true;
    }
    return false;
  }, []);

  // On load, if we have a token, fetch the current user. If the access
  // token has expired, try the stored refresh token before giving up —
  // this keeps the user logged in across days, not just one hour.
  const loadMe = useCallback(async () => {
    // First: did we just arrive from an email confirmation link?
    captureTokensFromUrl();

    if (!getAccessToken()) {
      // No access token, but maybe a refresh token survives a browser restart.
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const tokens = await api.post("/auth/refresh?refresh_token=" + encodeURIComponent(refreshToken));
          setAccessToken(tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
        } catch {
          localStorage.removeItem("refresh_token");
          setLoading(false);
          return;
        }
      } else {
        setLoading(false);
        return;
      }
    }
    try {
      const me = await api.get("/auth/me");
      setUser(me);
    } catch {
      // Access token likely expired — try refreshing once.
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const tokens = await api.post("/auth/refresh?refresh_token=" + encodeURIComponent(refreshToken));
          setAccessToken(tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
          const me = await api.get("/auth/me");
          setUser(me);
          return;
        } catch { /* fall through to logout */ }
      }
      setAccessToken(null);
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [captureTokensFromUrl]);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = async (email, password) => {
    const tokens = await api.post("/auth/login", { email, password });
    setAccessToken(tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const me = await api.get("/auth/me");
    setUser(me);
    return me;
  };

  const signup = async (email, password, nickname) => {
    // Returns {message, needs_confirmation}
    return api.post("/auth/signup", { email, password, nickname });
  };

  // Update nickname and/or profession; refreshes the current user.
  const updateProfile = async (updates) => {
    const me = await api.patch("/auth/profile", updates);
    setUser(me);
    return me;
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
