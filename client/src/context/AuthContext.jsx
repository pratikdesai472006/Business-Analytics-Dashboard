import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const login = (jwtToken, profile) => { localStorage.setItem("token", jwtToken); if (profile) localStorage.setItem("user", JSON.stringify(profile)); setToken(jwtToken); setUser(profile || null); };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setToken(null); setUser(null); };
  useEffect(() => { if (!token || user) return; api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then(({data}) => { const profile = { id:data.user.id, fullName:data.user.full_name || data.user.fullName, email:data.user.email }; setUser(profile); localStorage.setItem("user", JSON.stringify(profile)); }).catch(logout); }, [token, user]);
  return <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
