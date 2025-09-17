// src/pages/auth/Register.tsx
import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { apiRegisterDoctor, apiRegisterPatient, apiRegisterPharmacy } from "../../lib/api";

type Tab = "doctor" | "patient" | "pharmacy";

/* ========================
   UI: Segmented Tabs (teal)
======================== */
function SegmentedTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const base =
    "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-[.99]";
  const off =
    "text-teal-700 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
  const on =
    "bg-teal-700 text-white shadow ring-1 ring-teal-700/10";

  return (
    <div className="rounded-full bg-teal-50 p-1 ring-1 ring-teal-100">
      <div className="grid grid-cols-3 gap-1">
        <button
          className={`${base} ${tab === "doctor" ? on : off}`}
          onClick={() => onChange("doctor")}
          type="button"
          aria-pressed={tab === "doctor"}
        >
          Médico
        </button>
        <button
          className={`${base} ${tab === "patient" ? on : off}`}
          onClick={() => onChange("patient")}
          type="button"
          aria-pressed={tab === "patient"}
        >
          Paciente
        </button>
        <button
          className={`${base} ${tab === "pharmacy" ? on : off}`}
          onClick={() => onChange("pharmacy")}
          type="button"
          aria-pressed={tab === "pharmacy"}
        >
          Farmacia
        </button>
      </div>
    </div>
  );
}

/* ========================
   UI helpers (solo estilo)
======================== */
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1 w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 ${props.className || ""
        }`}
    />
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const initial = (sp.get("role") as Tab) || "doctor";

  const [tab, setTab] = useState<Tab>(initial);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Campos comunes
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Médico
  const [license, setLicense] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Paciente
  const [documentId, setDocumentId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  // Farmacia
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  const resetFeedback = () => {
    setErr(null);
    setOkMsg(null);
  };

  // UI-only: Indicador simple de seguridad de contraseña (no afecta validación)
  const passScore =
    (password.length >= 10 ? 2 : password.length >= 6 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const passLabel =
    passScore >= 4 ? "Fuerte" : passScore >= 2 ? "Media" : "Débil";
  const passColor =
    passScore >= 4 ? "bg-emerald-500" : passScore >= 2 ? "bg-amber-500" : "bg-red-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetFeedback();

    if (password.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "doctor") {
        if (!license.trim()) throw new Error("El número de licencia es obligatorio.");
        await apiRegisterDoctor({
          email: email.trim(),
          password,
          fullname: fullname.trim(),
          license_number: license.trim(),
          specialty: specialty.trim() || null,
        });
        setOkMsg("¡Médico registrado con éxito!");
        setTimeout(() => navigate("/login/doctor", { replace: true }), 800);
      } else if (tab === "patient") {
        if (!documentId.trim()) throw new Error("La cédula/documento es obligatorio.");
        await apiRegisterPatient({
          email: email.trim(),
          password,
          fullname: fullname.trim(),
          document_id: documentId.trim(),
          doctor_id: doctorId.trim() || null,
        });
        setOkMsg("¡Paciente registrado con éxito!");
        setTimeout(() => navigate("/login/patient", { replace: true }), 800);
      } else {
        await apiRegisterPharmacy({
          email: email.trim(),
          password,
          fullname: fullname.trim(),
          company_name: company.trim() || null,
          phone: phone.trim() || null,
        });
        setOkMsg("¡Farmacia registrada con éxito!");
        setTimeout(() => navigate("/login/pharmacy", { replace: true }), 800);
      }
    } catch (e: any) {
      setErr(e.message || "Error durante el registro.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    tab === "doctor"
      ? "Registrar Médico"
      : tab === "patient"
      ? "Registrar Paciente"
      : "Registrar Farmacia";

  return (
    <div className="min-h-screen w-full flex items-stretch bg-gray-50 md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-teal-50">
      {/* Imagen lateral con logo */}
      <div className="relative hidden md:block md:w-1/2">
        <img
          src="/src/images/register-images.jpg"
          alt="Registro SRM"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-teal-900/10 mix-blend-multiply" aria-hidden />
        {/* Logo SRM arriba-izquierda */}
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
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = "/logo-srm.png";
              }
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
        <div className="w-full max-w-lg">
          {/* Encabezado con logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white ring-1 ring-teal-600/20 shadow-sm">
              <img
                src="/src/images/logo_med_shield.png"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    img.src = "/logo-srm.png";
                  }
                }}
                alt="SRM"
                className="h-10 w-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-teal-700">{title}</h1>
            <p className="text-sm text-gray-500">Cree una cuenta para utilizar el SRM.</p>
          </div>

          <SegmentedTabs
            tab={tab}
            onChange={(t) => {
              setTab(t);
              resetFeedback();
            }}
          />

          <form
            onSubmit={onSubmit}
            className="mt-5 space-y-4 rounded-[20px] bg-white p-6 shadow ring-1 ring-gray-200"
          >
            {/* Comunes */}
            <Field label={tab === "pharmacy" ? "Encargado / Representante" : "Nombre completo"}>
              <TextInput
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder={tab === "pharmacy" ? "Encargado / Representante" : "Nombre y apellido"}
                required
              />
            </Field>

            <Field label="Correo">
              <TextInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
              />
            </Field>

            {/* Específicos por pestaña */}
            {tab === "doctor" && (
              <>
                <Field label="N° de licencia">
                  <TextInput
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    required
                    placeholder="000-XXX-000"
                  />
                </Field>
                <Field label="Especialidad (opcional)">
                  <TextInput
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Cardiología, Pediatría, etc."
                  />
                </Field>
              </>
            )}

            {tab === "patient" && (
              <>
                <Field label="Documento de identidad">
                  <TextInput
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    required
                    placeholder="Cédula / Pasaporte"
                  />
                </Field>
                <Field label="ID del Doctor (opcional)" hint="Si no lo tiene, puede asignarse luego desde el panel del doctor.">
                  <TextInput
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    placeholder="UUID del doctor (opcional)"
                  />
                </Field>
              </>
            )}

            {tab === "pharmacy" && (
              <>
                <Field label="Nombre comercial (opcional)">
                  <TextInput
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Farmacia Central, S.R.L."
                  />
                </Field>
                <Field label="Teléfono (opcional)">
                  <TextInput
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 809 555 0000"
                  />
                </Field>
              </>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Contraseña">
                <div className="relative">
                  <TextInput
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Indicador (UI only) */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${passColor}`}
                      style={{ width: `${Math.min(passScore, 4) * 25}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{passLabel}</span>
                </div>
              </Field>

              <Field label="Confirmar contraseña">
                <div className="relative">
                  <TextInput
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            </div>

            {/* Feedback */}
            {err && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">{err}</p>
            )}
            {okMsg && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
                {okMsg}
              </p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 py-2.5 text-white font-semibold shadow hover:bg-teal-800 active:scale-[.99] disabled:opacity-60"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                to={
                  tab === "doctor"
                    ? "/login/doctor"
                    : tab === "patient"
                    ? "/login/patient"
                    : "/login/pharmacy"
                }
                className="text-teal-700 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
