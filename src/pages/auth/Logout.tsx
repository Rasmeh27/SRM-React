import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Logout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // guarda el rol antes de limpiar sesión
    const role = user?.role;
    logout();
    // redirige al login correcto
    if (role === "patient") navigate("/login/patient", { replace: true });
    else if (role === "pharmacy") navigate("/login/pharmacy", { replace: true });
    else navigate("/login/doctor", { replace: true }); // default
  }, [logout, navigate, user?.role]);

  return null;
}
