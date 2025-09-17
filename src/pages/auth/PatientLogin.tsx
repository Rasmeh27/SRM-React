// src/pages/auth/PatientLogin.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function PatientLogin() {
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
      // Redirige según el rol real
      const stored =
        localStorage.getItem("srm_auth") || sessionStorage.getItem("srm_auth");
      const user = stored ? JSON.parse(stored).user : null;
      if (user?.role === "patient") navigate("/patient", { replace: true });
      else if (user?.role === "doctor") navigate("/doctor", { replace: true });
      else if (user?.role === "pharmacy") navigate("/pharmacy", { replace: true });
      else navigate("/admin", { replace: true });
    } catch (e: any) {
      setErr(e.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-stretch bg-gray-50 md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-teal-50">
      {/* Lado izquierdo con imagen */}
      <div className="relative hidden md:block md:w-1/2">
        <img
          src="/src/images/medico.png" // coloca tu imagen en public/images/
          alt="Paciente"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Capa para coherencia de marca */}
        <div className="absolute inset-0 bg-teal-900/10 mix-blend-multiply" aria-hidden />
        {/* Logo SRM (arriba-izquierda sobre la imagen) */}
        <Link
          to="/"
          className="absolute left-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/15 transition"
          aria-label="SRM - Inicio"
          title="SRM"
        >
          <img
            src="/src/images/logo_med_shield.png"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "/logo-srm.png"; }
            }}
            alt="Logo SRM"
            className="h-8 w-8 object-contain drop-shadow"
          />
        </Link>
        {/* curva suave a la derecha */}
        <div className="absolute -right-12 top-0 h-full w-24 bg-gray-50 rounded-l-[48px]" aria-hidden />
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Encabezado con logo SRM */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white ring-1 ring-teal-600/20 shadow-sm">
              <img
                src="/src/images/logo_med_shield.png"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "/logo-srm.png"; }
                }}
                alt="SRM"
                className="h-10 w-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-teal-700">Bienvenido/a</h1>
            <p className="text-sm text-gray-500">
              Ingrese con su cuenta de paciente para ver sus recetas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[20px] bg-white p-6 shadow ring-1 ring-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="nombre.apellido@correo.com"
                className="mt-1 w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative mt-1">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 pr-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
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
              <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 py-2.5 text-white font-semibold shadow hover:bg-teal-800 active:scale-[.99] disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Eres doctor o farmacia?{" "}
            <Link to="/login/doctor" className="text-teal-700 hover:underline">
              Doctor
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
