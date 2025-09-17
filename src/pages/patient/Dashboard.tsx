import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import PatientShell from "../../component/PatientShell";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAssignedDoctor,
  fetchPrescription,
  fetchPrescriptions,
  fetchPatientNotifications,
  type PatientNotification,
  type RxDetail,
  type RxListItem,
} from "../../lib/prescriptionsApi";
import { Link } from "react-router-dom";

type Row = RxDetail;

export default function PatientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const dev = useMemo(
    () => (!token && user ? { id: user.id, role: user.role } : null),
    [token, user]
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [doctorName, setDoctorName] = useState<string>("");
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // contador de no leídas para la campana
  const [unread, setUnread] = useState<number>(0);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    setErr(null);
    try {
      // Médico asignado
      fetchAssignedDoctor(user.id, { token, dev })
        .then((d) => setDoctorName(d.fullname))
        .catch(() => setDoctorName(""));

      // Recetas
      const list: RxListItem[] = await fetchPrescriptions(
        { patientId: user.id, order },
        { token, dev }
      );
      const detailed = await Promise.all(
        list.map((rx) =>
          fetchPrescription(rx.id, { token, dev }).catch(
            () => ({ ...rx } as any)
          )
        )
      );
      setRows(detailed);

      // Notificaciones (solo para el badge)
      fetchPatientNotifications(user.id, { token, dev }, { limit: 50 })
        .then((n: PatientNotification[]) =>
          setUnread(n.filter((x) => !x.read_at).length)
        )
        .catch(() => setUnread(0));
    } catch (e: any) {
      setErr(e.message || "Error cargando recetas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [order]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const dname = doctorName || r.doctor_id || "";
    return dname.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <PatientShell>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">
          Hola, {user?.fullname || "Paciente"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Campana de notificaciones */}
          <button
            type="button"
            onClick={() => navigate("/patient/notifications")}
            title="Notificaciones"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal-700 shadow ring-1 ring-gray-200 hover:bg-teal-50"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
          </button>

          {/* Tarjeta de perfil */}
          <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow ring-1 ring-gray-200">
            <img
              src="/images/patient-avatar.jpg"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-teal-700">
                {user?.fullname}
              </p>
              <p className="text-xs text-gray-500">
                {doctorName ? `Dr(a). ${doctorName}` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            placeholder="Buscar por médico"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
        </div>
        <select
          className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
        >
          <option value="desc">Ordenar por fecha (nuevas primero)</option>
          <option value="asc">Ordenar por fecha (antiguas primero)</option>
        </select>
        <button
          onClick={() => load()}
          className="rounded-full bg-teal-700 px-5 py-2 font-semibold text-white hover:bg-teal-800"
        >
          Filtrar
        </button>
      </div>

      <h2 className="mt-6 text-xl font-semibold text-teal-700">Mis Recetas</h2>

      <div className="mt-4 rounded-3xl border bg-white p-4 ring-1 ring-gray-200">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-teal-700 text-white">
                  <th className="px-4 py-3 text-left">Número Receta</th>
                  <th className="px-4 py-3 text-left">Doctor</th>
                  <th className="px-4 py-3 text-left">Fecha Emitida</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No hay recetas.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="even:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{d.id}</td>
                      <td className="px-4 py-3">{doctorName || d.doctor_id}</td>
                      <td className="px-4 py-3">
                        {new Date(d.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            d.status === "DISPENSED"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "ISSUED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/patient/prescriptions/${d.id}`}
                          className="rounded-full bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
                        >
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </div>
    </PatientShell>
  );
}
