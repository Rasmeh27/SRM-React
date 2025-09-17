import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { apiRegisterDoctor, apiRegisterPatient, apiRegisterPharmacy } from "../../lib/api";

type Tab = "doctor" | "patient" | "pharmacy";

function SegmentedTabs({
  tab, onChange,
}: { tab: Tab; onChange: (t: Tab) => void }) {
  const base = "flex-1 py-2.5 rounded-full text-sm font-semibold transition";
  return (
    <div className="grid grid-cols-3 gap-2 rounded-full bg-gray-100 p-1">
      <button
        className={`${base} ${tab === "doctor" ? "bg-teal-700 text-white" : "text-teal-700 hover:bg-white"}`}
        onClick={() => onChange("doctor")}
      >
        Médico
      </button>
      <button
        className={`${base} ${tab === "patient" ? "bg-teal-700 text-white" : "text-teal-700 hover:bg-white"}`}
        onClick={() => onChange("patient")}
      >
        Paciente
      </button>
      <button
        className={`${base} ${tab === "pharmacy" ? "bg-teal-700 text-white" : "text-teal-700 hover:bg-white"}`}
        onClick={() => onChange("pharmacy")}
      >
        Farmacia
      </button>
    </div>
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

  // Médico
  const [license, setLicense] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Paciente
  const [documentId, setDocumentId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  // Farmacia
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  const resetFeedback = () => { setErr(null); setOkMsg(null); };

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

  // Placeholder de campos según pestaña
  const title =
    tab === "doctor" ? "Registrar Médico" :
    tab === "patient" ? "Registrar Paciente" : "Registrar Farmacia";

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-stretch">
      {/* Imagen lateral */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src="/images/register-hero.jpg"
          alt="Registro SRM"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute -right-12 top-0 h-full w-24 bg-gray-50 rounded-l-[48px]" />
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Encabezado */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl ring-1 ring-teal-600/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M7 6h10M8 10c0 2.5 1.79 4.5 4 4.5s4-2 4-4.5" />
                <path d="M7 14c0 3 2.24 5 5 5s5-2 5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-teal-700">{title}</h1>
            <p className="text-sm text-gray-500">Cree una cuenta para utilizar el SRM.</p>
          </div>

          <SegmentedTabs tab={tab} onChange={(t) => { setTab(t); resetFeedback(); }} />

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {/* Comunes */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                value={fullname} onChange={(e) => setFullname(e.target.value)}
                placeholder={tab === "pharmacy" ? "Encargado / Representante" : "Nombre y apellido"}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {tab === "doctor" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° de licencia</label>
                  <input
                    value={license} onChange={(e) => setLicense(e.target.value)} required
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialidad (opcional)</label>
                  <input
                    value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Cardiología, Pediatría, etc."
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}

            {tab === "patient" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Documento de identidad</label>
                  <input
                    value={documentId} onChange={(e) => setDocumentId(e.target.value)} required
                    placeholder="Cédula / Pasaporte"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID del Doctor (opcional)
                  </label>
                  <input
                    value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
                    placeholder="UUID del doctor (opcional)"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Si no lo tiene, puede asignarse luego desde el panel del doctor.
                  </p>
                </div>
              </>
            )}

            {tab === "pharmacy" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre comercial (opcional)</label>
                  <input
                    value={company} onChange={(e) => setCompany(e.target.value)}
                    placeholder="Farmacia Central, S.R.L."
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 809 555 0000"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <input
                  type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {err && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>
            )}
            {okMsg && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{okMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 py-2.5 text-white font-semibold shadow hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                to={
                  tab === "doctor" ? "/login/doctor" :
                  tab === "patient" ? "/login/patient" :
                  "/login/pharmacy"
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
