import React, { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("bp_token"));

  useEffect(() => {
    if (token) {
      const r = localStorage.getItem("bp_role");
      setRole(r);
      if (r === "firm") {
        fetch(API + "/api/firm/me", { headers: { Authorization: "Bearer " + token } })
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setUser(data); else logout(); })
          .catch(() => logout())
          .finally(() => setLoading(false));
      } else if (r === "superadmin") {
        setUser({ email: localStorage.getItem("bp_email"), role: "superadmin" });
        setLoading(false);
      } else { setLoading(false); }
    } else { setLoading(false); }
  }, []);

  async function firmLogin(email, password) {
    const res = await fetch(API + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token); setRole("firm"); setUser(data.firm);
    localStorage.setItem("bp_token", data.token); localStorage.setItem("bp_role", "firm");
    return data;
  }

  async function firmSignup(name, email, password) {
    const res = await fetch(API + "/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token); setRole("firm"); setUser(data.firm);
    localStorage.setItem("bp_token", data.token); localStorage.setItem("bp_role", "firm");
    return data;
  }

  async function adminLogin(email, password) {
    const res = await fetch(API + "/api/auth/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token); setRole("superadmin"); setUser({ email, role: "superadmin" });
    localStorage.setItem("bp_token", data.token); localStorage.setItem("bp_role", "superadmin"); localStorage.setItem("bp_email", email);
    return data;
  }

  function logout() {
    setToken(null); setRole(null); setUser(null);
    ["bp_token","bp_role","bp_email"].forEach(k => localStorage.removeItem(k));
  }

  function refreshUser() {
    if (role === "firm" && token) {
      fetch(API + "/api/firm/me", { headers: { Authorization: "Bearer " + token } }).then(r => r.json()).then(setUser).catch(console.error);
    }
  }

  return React.createElement(AuthContext.Provider, { value: { user, role, token, loading, firmLogin, firmSignup, adminLogin, logout, refreshUser, setUser } }, children);
}
export const useAuth = () => useContext(AuthContext);