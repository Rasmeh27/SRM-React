// src/pages/auth/DoctorLogin.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function DoctorLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      // Decide dashboard por rol (aunque estamos en login doctor)
      const stored =
        localStorage.getItem("srm_auth") || sessionStorage.getItem("srm_auth");
      const user = stored ? JSON.parse(stored).user : null;
      if (user?.role === "doctor") navigate("/doctor", { replace: true });
      else if (user?.role === "patient") navigate("/patient", { replace: true });
      else if (user?.role === "pharmacy") navigate("/pharmacy", { replace: true });
      else navigate("/admin", { replace: true });
    } catch (e: any) {
      setErr(e.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-stretch">
      {/* Lado izquierdo con imagen */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src="/src/images/doctor-login.jpg"
          alt="Médico"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* curva suave a la derecha */}
        <div className="absolute -right-12 top-0 h-full w-24 bg-gray-50 rounded-l-[48px]" />
      </div>

      {/* Lado derecho: formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Encabezado con icono médico */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl ring-1 ring-teal-600/20 flex items-center justify-center">
              {/* Ícono caduceo simple */}
              <svg
                viewBox="0 0 24 24"
                className="h-9 w-9 text-teal-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2v20M7 6h10M8 10c0 2.5 1.79 4.5 4 4.5s4-2 4-4.5" />
                <path d="M7 14c0 3 2.24 5 5 5s5-2 5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-teal-700">¡Bienvenido de nuevo!</h1>
            <p className="text-sm text-gray-500">Listo para salvar vidas? Ingrese sus credenciales.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="nombre.apellido@doctor.com"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Recuérdame</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-teal-700 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>

            {err && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 py-2.5 text-white font-semibold shadow hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Eres paciente o farmacia?{" "}
            <Link to="/login/patient" className="text-teal-700 hover:underline">
              Paciente
            </Link>{" "}
            ·{" "}
            <Link to="/login/pharmacy" className="text-teal-700 hover:underline">
              Farmacia
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
