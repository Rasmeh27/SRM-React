import { useEffect, useMemo, useState } from "react";
import AppShell from "../../component/AppShell";
import { useAuth } from "../../context/AuthContext";
import { assignPatient, fetchPatientsByDoctor, unassignPatient, type Patient } from "../../lib/prescriptionsApi";

export default function Patients() {
  const { user, token } = useAuth();
  const dev = useMemo(()=> (!token && user ? { id: user.id, role: user.role } : null), [token, user]);
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [toAssign, setToAssign] = useState("");

  async function load() {
    setLoading(true); setErr(null);
    try { setRows(await fetchPatientsByDoctor(user!.id, { token, dev })); }
    catch (e:any) { setErr(e.message || "No se pudo cargar"); setRows([]); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);

  const doAssign = async () => {
    if (!toAssign.trim()) return;
    try { await assignPatient(user!.id, toAssign.trim(), { token, dev }); setToAssign(""); await load(); }
    catch (e:any) { setErr(e.message || "No se pudo asignar"); }
  };
  const doUnassign = async (pid: string) => {
    try { await unassignPatient(user!.id, pid, { token, dev }); await load(); }
    catch (e:any) { setErr(e.message || "No se pudo desasignar"); }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-teal-700">Mis Pacientes</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="ID de paciente para asignar (UUID)"
            value={toAssign}
            onChange={(e)=>setToAssign(e.target.value)}
            className="w-72 rounded-full border px-3 py-2 text-sm"
          />
          <button onClick={doAssign} className="rounded-full bg-teal-700 px-4 py-2 text-white font-semibold">Asignar</button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          placeholder="Filtrar por nombre o cédula"
          value={filter}
          onChange={(e)=>setFilter(e.target.value)}
          className="w-80 rounded-full border px-3 py-2 text-sm"
        />
        <button onClick={()=>setFilter("")} className="rounded-full border px-3 py-2 text-sm">Limpiar</button>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 ring-1 ring-gray-200">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-teal-700 text-white">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Documento</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter(p =>
                    !filter ||
                    p.fullname.toLowerCase().includes(filter.toLowerCase()) ||
                    (p.document_id || "").toLowerCase().includes(filter.toLowerCase())
                  )
                  .map(p => (
                  <tr key={p.id} className="even:bg-gray-50">
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3">{p.fullname}</td>
                    <td className="px-4 py-3">{p.document_id || "—"}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <a href={`/doctor/prescriptions?patientId=${p.id}`} className="rounded-full border px-3 py-1.5">Ver historial</a>
                      <button onClick={()=>doUnassign(p.id)} className="rounded-full bg-red-600 px-3 py-1.5 text-white">Quitar</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin pacientes asignados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </div>
    </AppShell>
  );
}
