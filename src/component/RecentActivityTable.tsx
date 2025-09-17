// src/component/RecentActivityTable.tsx
import type { Prescription } from "../types/Prescriptions";
import { Link } from "react-router-dom";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const styles =
    s.includes("anchor")
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : s.includes("sign")
      ? "bg-teal-50 text-teal-700 ring-teal-600/20"
      : s.includes("pend") || s.includes("draft")
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : "bg-slate-50 text-slate-700 ring-slate-600/20";
  const label =
    s.includes("anchor") ? "Anclada" :
    s.includes("sign")   ? "Firmada" :
    s.includes("pend") || s.includes("draft") ? "Pendiente" :
    status;

  return (
    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${styles}`}>
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto grid max-w-md place-items-center py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-teal-50 ring-1 ring-teal-100">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800">Sin actividad reciente</h3>
      <p className="mt-1 text-sm text-slate-500">Cuando emitas o firmes nuevas recetas, aparecerán aquí.</p>
    </div>
  );
}

export default function RecentActivityTable({ rows }: { rows: Prescription[] }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow ring-1 ring-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-teal-700/95 text-white backdrop-blur">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Número Receta</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Paciente</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Fecha Emitida</th>
              <th scope="col" className="hidden md:table-cell px-4 py-3 text-left font-semibold">Medicamentos</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              rows.map((rx) => {
                const meds = (rx.items || []).map((i: any) => i?.name).filter(Boolean) as string[];
                const shown = meds.slice(0, 3).join(", ");
                const extra = meds.length - 3;
                return (
                  <tr
                    key={rx.id}
                    className="border-b last:border-b-0 even:bg-slate-50/60 hover:bg-teal-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{rx.id}</td>

                    <td className="px-4 py-3 text-slate-800">
                      <div className="flex flex-col">
                        <span>{rx.patient_name || rx.patient_id}</span>
                        {/* Badge de estado opcional debajo del nombre */}
                        <StatusBadge status={(rx as any).status} />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{formatDate((rx as any).created_at)}</td>

                    <td className="hidden md:table-cell px-4 py-3 text-slate-700">
                      {meds.length === 0 ? (
                        "—"
                      ) : (
                        <span title={meds.join(", ")}>
                          {shown}
                          {extra > 0 && <span className="text-slate-500"> {" "}+{extra} más</span>}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/doctor/prescriptions/${rx.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-3 py-1.5 text-white shadow-sm hover:bg-teal-800 active:scale-[.99]"
                      >
                        Ver Detalle
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
