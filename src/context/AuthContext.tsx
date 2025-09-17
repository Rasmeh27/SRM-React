// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, LoginResponse } from "../lib/api";
import { apiLogin } from "../lib/api";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Cargar sesión al montar
  useEffect(() => {
    const stored =
      localStorage.getItem("srm_auth") || sessionStorage.getItem("srm_auth");
    if (stored) {
      try {
        const { token, user } = JSON.parse(stored);
        setToken(token);
        setUser(user);
      } catch {}
    }
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    const res: LoginResponse = await apiLogin(email, password);
    setToken(res.access_token);
    setUser(res.user);
    const payload = JSON.stringify({ token: res.access_token, user: res.user });
    if (remember) localStorage.setItem("srm_auth", payload);
    else sessionStorage.setItem("srm_auth", payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("srm_auth");
    sessionStorage.removeItem("srm_auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
