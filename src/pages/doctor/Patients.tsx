// src/pages/doctor/Patients.tsx
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../component/AppShell";
import { useAuth } from "../../context/AuthContext";
import {
  assignPatient,
  fetchPatientsByDoctor,
  unassignPatient,
  type Patient,
} from "../../lib/prescriptionsApi";

export default function Patients() {
  const { user, token } = useAuth();
  const dev = useMemo(
    () => (!token && user ? { id: user.id, role: user.role } : null),
    [token, user]
  );
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [toAssign, setToAssign] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchPatientsByDoctor(user!.id, { token, dev }));
    } catch (e: any) {
      setErr(e.message || "No se pudo cargar");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const doAssign = async () => {
    if (!toAssign.trim()) return;
    try {
      await assignPatient(user!.id, toAssign.trim(), { token, dev });
      setToAssign("");
      await load();
    } catch (e: any) {
      setErr(e.message || "No se pudo asignar");
    }
  };
  const doUnassign = async (pid: string) => {
    try {
      await unassignPatient(user!.id, pid, { token, dev });
      await load();
    } catch (e: any) {
      setErr(e.message || "No se pudo desasignar");
    }
  };

  return (
    <AppShell>
      {/* Header + acción de asignar (estándar teal) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-teal-800">Mis Pacientes</h1>

        <div className="flex items-center gap-2 rounded-[16px] bg-white p-2 shadow-sm ring-1 ring-gray-200">
          <div className="relative">
            <input
              placeholder="ID de paciente para asignar (UUID)"
              value={toAssign}
              onChange={(e) => setToAssign(e.target.value)}
              className="w-72 rounded-full border border-gray-300 bg-white pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            {/* botón limpiar input */}
            {toAssign && (
              <button
                type="button"
                onClick={() => setToAssign("")}
                className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 hover:bg-teal-600/15"
                title="Limpiar"
                aria-label="Limpiar"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={doAssign}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 active:scale-[.99]"
          >
            Asignar
          </button>
        </div>
      </div>

      {/* Filtro local */}
      <section
        aria-label="Filtros"
        className="mt-4 flex flex-wrap items-center gap-2 rounded-[16px] bg-white p-3 shadow-sm ring-1 ring-gray-200"
      >
        <div className="relative">
          <input
            placeholder="Filtrar por nombre o cédula"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-80 rounded-full border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <button
          onClick={() => setFilter("")}
          className="rounded-full border border-teal-700/30 px-3 py-2 text-sm text-teal-800 hover:bg-teal-50"
        >
          Limpiar
        </button>
      </section>

      {/* Tabla */}
      <div className="mt-4 rounded-[20px] bg-white p-0 shadow ring-1 ring-gray-200">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-teal-700 text-white">
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Documento</th>
                  <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter(
                    (p) =>
                      !filter ||
                      p.fullname.toLowerCase().includes(filter.toLowerCase()) ||
                      (p.document_id || "").toLowerCase().includes(filter.toLowerCase())
                  )
                  .map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-b-0 even:bg-gray-50 hover:bg-teal-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-800">{p.id}</td>
                      <td className="px-4 py-3 text-slate-800">{p.fullname}</td>
                      <td className="px-4 py-3 text-slate-800">{p.document_id || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/doctor/prescriptions?patientId=${p.id}`}
                            className="rounded-full border border-teal-700/30 px-3 py-1.5 text-teal-800 hover:bg-teal-50"
                          >
                            Ver historial
                          </a>
                          <button
                            onClick={() => doUnassign(p.id)}
                            className="rounded-full bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                          >
                            Quitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {err && (
          <div className="m-4 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ======================
   Subcomponentes de UI
====================== */

function TableSkeleton() {
  return (
    <div className="p-4">
      <div className="mb-3 h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="overflow-hidden rounded-[14px] ring-1 ring-slate-200">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse bg-slate-100 odd:bg-slate-200/60" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto grid max-w-md place-items-center text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-teal-50 ring-1 ring-teal-100">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800">Sin pacientes asignados</h3>
      <p className="mt-1 text-sm text-slate-500">
        Asigne un paciente usando su ID para comenzar a visualizar su historial.
      </p>
    </div>
  );
}
