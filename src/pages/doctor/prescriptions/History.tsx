// src/pages/doctor/prescriptions/History.tsx
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../component/AppShell";
import { useAuth } from "../../../context/AuthContext";
import { fetchPrescriptions, fetchPrescription, type RxListItem, type RxDetail } from "../../../lib/prescriptionsApi";

type Row = RxDetail;

export default function History() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const list: RxListItem[] = await fetchPrescriptions({ doctorId: user?.id, order }, { token, dev });
      // Traemos detalle de las que están en la página actual (para ver medicamentos)
      const start = (page - 1) * pageSize;
      const target = list.slice(start, start + pageSize);
      const detailed = await Promise.all(
        target.map((r) => fetchPrescription(r.id, { token, dev }).catch(() => ({ ...r } as any)))
      );
      // Filtro por paciente si hay query (se respeta tu lógica)
      const filtered = q.trim()
        ? detailed.filter((d) => (d.patient_name || d.patient_id)?.toLowerCase().includes(q.toLowerCase()))
        : detailed;
      setRows(filtered);
    } catch (e: any) {
      setErr(e.message || "Error al cargar historial");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [order, page]);

  // Se mantiene tu cálculo “simple”
  const totalPages = Math.max(1, Math.ceil(rows.length < pageSize ? page : page + 1));

  return (
    <AppShell>
      {/* Barra de filtros (teal, pill, consistente con el dashboard) */}
      <section
        aria-label="Filtros de historial"
        className="rounded-[20px] bg-white shadow ring-1 ring-gray-200 p-3 sm:p-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative w-full sm:w-80">
          <input
            aria-label="Buscar por paciente"
            placeholder="Buscar por paciente"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          {/* Icono búsqueda */}
          <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {/* Limpiar query */}
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2.5 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 hover:bg-teal-600/15"
              aria-label="Limpiar búsqueda"
              title="Limpiar"
            >
              ×
            </button>
          )}
        </div>

        <select
          aria-label="Ordenar por fecha"
          className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
        >
          <option value="desc">Ordenar por fecha (nuevas primero)</option>
          <option value="asc">Ordenar por fecha (antiguas primero)</option>
        </select>

        <button
          onClick={() => {
            setPage(1);
            load();
          }}
          className="rounded-full bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 active:scale-[.99]"
        >
          Filtrar
        </button>
      </section>

      {/* Título */}
      <h1 className="mt-6 text-2xl font-bold text-teal-800">Historial de Recetas</h1>

      {/* Contenedor principal */}
      <div className="mt-4 rounded-[20px] bg-white shadow ring-1 ring-gray-200 p-0">
        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-teal-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Número Receta</th>
                    <th className="px-4 py-3 text-left font-semibold">Paciente</th>
                    <th className="px-4 py-3 text-left font-semibold">Fecha Emitida</th>
                    <th className="px-4 py-3 text-left font-semibold">Medicamentos</th>
                    <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10">
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    rows
                      .filter((d) => (q ? (d.patient_name || d.patient_id)?.toLowerCase().includes(q.toLowerCase()) : true))
                      .map((d) => (
                        <tr
                          key={d.id}
                          className="even:bg-gray-50 hover:bg-teal-50/60 transition-colors border-b last:border-b-0"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{d.id}</td>
                          <td className="px-4 py-3 text-slate-700">{d.patient_name || d.patient_id}</td>
                          <td className="px-4 py-3 text-slate-700">{new Date(d.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {d.items?.map((i) => i.name).join(", ") || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`/doctor/prescriptions/${d.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-3 py-1.5 text-white hover:bg-teal-800"
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
                            </a>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación (estilo teal) */}
            <div className="mt-4 flex items-center justify-between gap-2 px-4 pb-4">
              <p className="text-xs text-slate-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-700/30 px-3 py-1.5 text-teal-800 hover:bg-teal-50 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-3 py-1.5 text-white hover:bg-teal-800"
                >
                  Siguiente
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {err && (
              <div className="mx-4 mb-4 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ========================
   Subcomponentes visuales
   (UI only; no lógica nueva)
======================== */

function TableSkeleton() {
  return (
    <div className="p-4">
      <div className="mb-3 h-6 w-56 animate-pulse rounded bg-slate-200" />
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
      <h3 className="text-base font-semibold text-slate-800">Sin actividad reciente</h3>
      <p className="mt-1 text-sm text-slate-500">
        Cuando emitas o firmes nuevas recetas, aparecerán aquí para consulta rápida.
      </p>
    </div>
  );
}
