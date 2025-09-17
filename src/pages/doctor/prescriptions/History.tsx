import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../component/AppShell";
import { useAuth } from "../../../context/AuthContext";
import { fetchPrescriptions, fetchPrescription, type RxListItem, type RxDetail } from "../../../lib/prescriptionsApi";

type Row = RxDetail;

export default function History() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);
  const [order, setOrder] = useState<"asc"|"desc">("desc");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const list: RxListItem[] = await fetchPrescriptions({ doctorId: user?.id, order }, { token, dev });
      // Traemos detalle de las que están en la página actual (para ver medicamentos)
      const start = (page-1)*pageSize;
      const target = list.slice(start, start+pageSize);
      const detailed = await Promise.all(target.map(r => fetchPrescription(r.id, { token, dev }).catch(()=>({ ...r } as any))));
      // Filtro por paciente (cliente) si hay query
      const filtered = q.trim()
        ? detailed.filter(d => (d.patient_name || d.patient_id)?.toLowerCase().includes(q.toLowerCase()))
        : detailed;
      setRows(filtered);
    } catch (e:any) {
      setErr(e.message || "Error al cargar historial");
      setRows([]);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [order, page]);

  const totalPages = Math.max(1, Math.ceil(rows.length < pageSize ? page : page + 1)); // simple

  return (
    <AppShell>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            placeholder="Buscar por paciente"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
        </div>
        <select
          className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={order}
          onChange={(e)=>setOrder(e.target.value as "asc"|"desc")}
        >
          <option value="desc">Ordenar por fecha (nuevas primero)</option>
          <option value="asc">Ordenar por fecha (antiguas primero)</option>
        </select>
        <button
          onClick={() => { setPage(1); load(); }}
          className="rounded-full bg-teal-700 px-5 py-2 font-semibold text-white hover:bg-teal-800"
        >
          Filtrar
        </button>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-teal-700">Historial de Recetas</h1>

      <div className="mt-4 rounded-3xl border bg-white p-4 ring-1 ring-gray-200">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-teal-700 text-white">
                    <th className="px-4 py-3 text-left">Número Receta</th>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Fecha Emitida</th>
                    <th className="px-4 py-3 text-left">Medicamentos</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Sin actividad reciente.</td></tr>
                  ) : rows
                      .filter(d => q ? (d.patient_name || d.patient_id)?.toLowerCase().includes(q.toLowerCase()) : true)
                      .map(d => (
                    <tr key={d.id} className="even:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{d.id}</td>
                      <td className="px-4 py-3">{d.patient_name || d.patient_id}</td>
                      <td className="px-4 py-3">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{d.items?.map(i=>i.name).join(", ") || "—"}</td>
                      <td className="px-4 py-3">
                        <a href={`/doctor/prescriptions/${d.id}`} className="rounded-full bg-teal-700 px-3 py-1.5 text-white hover:bg-teal-800">
                          Ver Detalle
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación simple */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}
                className="rounded-full border px-3 py-1.5 disabled:opacity-50">Anterior</button>
              <span className="text-sm text-gray-600">Página {page}</span>
              <button onClick={()=>setPage(p=>p+1)} className="rounded-full border px-3 py-1.5">Siguiente</button>
            </div>

            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          </>
        )}
      </div>
    </AppShell>
  );
}
