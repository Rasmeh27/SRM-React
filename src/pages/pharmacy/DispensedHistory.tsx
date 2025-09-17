import { useEffect, useMemo, useState } from "react";
import PharmacyShell from "../../component/PharmacyShell";
import { useAuth } from "../../context/AuthContext";
import { fetchDispensedPrescriptions, type RxDispensedRow } from "../../lib/prescriptionsApi";


export default function DispensedHistory() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<RxDispensedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await fetchDispensedPrescriptions({ pharmacyId: user?.id, order }, { token, dev });
      setRows(data);
    } catch (e: any) {
      setErr(e.message || "No se pudo cargar");
      setRows([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [order]);

  return (
    <PharmacyShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal-700">Recetas Dispensadas</h1>
        <select
          className="rounded-full border px-3 py-2 text-sm"
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
        >
          <option value="desc">Ordenar por fecha (nuevas primero)</option>
          <option value="asc">Ordenar por fecha (antiguas primero)</option>
        </select>
      </div>

      <div className="mt-4 rounded-3xl border bg-white p-4 ring-1 ring-gray-200">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-teal-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Número Receta</th>
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Fecha Dispensada</th>
                  <th className="px-4 py-3 text-left">Ítems</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No hay registros.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.id} className="even:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.id}</td>
                    <td className="px-4 py-3">{r.patient_id}</td>
                    <td className="px-4 py-3">{new Date(r.dispensed_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{r.items_count ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </div>
    </PharmacyShell>
  );
}
