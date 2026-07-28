import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const login = (jwtToken, userData) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const next = { ...prev, ...userData };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Auto-login: hydrate the current user from the token on first load.
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (active && data?.user) {
          const normalized = {
            id: data.user.id,
            fullName: data.user.full_name || data.user.fullName,
            email: data.user.email,
          };
          localStorage.setItem("user", JSON.stringify(normalized));
          setUser(normalized);
        }
      } catch {
        // Offline or unreachable backend: keep any cached user we already have.
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  // React to forced logouts triggered by the axios 401 interceptor.
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
