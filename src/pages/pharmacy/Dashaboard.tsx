import PharmacyShell from "../../component/PharmacyShell";
import { useAuth } from "../../context/AuthContext";
import ActionCard from "../../component/ActionCard";
import { useMemo, useEffect, useState } from "react";
import { fetchDispensedPrescriptions, type RxDispensedRow } from "../../lib/prescriptionsApi";


export default function PharmacyDashboard() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);
  const [rows, setRows] = useState<RxDispensedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchDispensedPrescriptions({ pharmacyId: user?.id, order: "desc" }, { token, dev });
        if (alive) setRows(data.slice(0, 5));
      } catch { if (alive) setRows([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [token, dev, user?.id]);

  return (
    <PharmacyShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">
          Hola, {user?.fullname || "Farmacia"}
        </h1>
        <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow ring-1 ring-gray-200">
          <img src="/images/pharmacy-avatar.jpg" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold text-teal-700">{user?.fullname || "Farmacia"}</p>
          </div>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ActionCard
          image="/images/card-validate.jpg"
          title="Validar Recetas"
          subtitle="Verifique autenticidad escaneando un código QR o token."
          cta="Ver Historial"
          to="/pharmacy/verify"
        />
        <ActionCard
          image="/images/card-dispensed.jpg"
          title="Recetas Dispensadas"
          subtitle="Revise todas las recetas dispensadas."
          cta="Ver Historial"
          to="/pharmacy/dispensed"
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-teal-700">Actividad Reciente</h2>
        <div className="rounded-xl border ring-1 ring-gray-200 overflow-hidden">
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Número Receta</th>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Fecha Dispensada</th>
                    <th className="px-4 py-3 text-left">Medicamentos</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Sin actividad reciente.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="even:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.id}</td>
                      <td className="px-4 py-3">{r.patient_id}</td>
                      <td className="px-4 py-3">{new Date(r.dispensed_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{r.items_count ?? "—"}</td>
                      <td className="px-4 py-3">
                        <a href={`/pharmacy/dispensed`} className="rounded-full bg-teal-700 px-3 py-1.5 text-white">Ver Detalle</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </PharmacyShell>
  );
}
