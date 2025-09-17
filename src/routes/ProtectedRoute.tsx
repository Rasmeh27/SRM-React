// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  role,
  children,
}: {
  role?: "doctor" | "patient" | "pharmacy" | "admin";
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth() as {
    user: { id: string; role: "doctor" | "patient" | "pharmacy" | "admin" } | null;
    ready?: boolean;
  };
  const location = useLocation();

  // 1) Espera rehidratación del contexto para evitar falsos negativos
  if (ready === false) {
    return null; // o un pequeño loader si quieres
  }

  // 2) Si no hay sesión, redirige al login del rol esperado (o 'doctor' por defecto)
  if (!user) {
    const loginRole = role || "doctor";
    return (
      <Navigate
        to={`/login/${loginRole}`}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 3) Si hay restricción de rol, valida y reubica al home real del usuario
  if (role && user.role !== role) {
    const target =
      user.role === "doctor"
        ? "/doctor"
        : user.role === "patient"
        ? "/patient"
        : user.role === "pharmacy"
        ? "/pharmacy"
        : "/admin";
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
