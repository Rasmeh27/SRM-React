import { useEffect, useMemo, useState } from "react";
import PatientShell from "../../component/PatientShell";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPatientNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type PatientNotification,
} from "../../lib/prescriptionsApi";
import { Bell, FileSignature, CheckCircle2 } from "lucide-react";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Hace 1 min";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} días`;
  const w = Math.floor(d / 7);
  if (w < 5) return `Hace ${w} semana${w > 1 ? "s" : ""}`;
  const mo = Math.floor(d / 30);
  return `Hace ${mo} mes${mo > 1 ? "es" : ""}`;
}

function IconByType({ type }: { type: PatientNotification["type"] }) {
  const cls = "h-5 w-5";
  if (type === "PRESCRIPTION_ISSUED") return <FileSignature className={cls} />;
  if (type === "PRESCRIPTION_DISPENSED") return <CheckCircle2 className={cls} />;
  return <Bell className={cls} />;
}

function titleByType(t: PatientNotification["type"]) {
  if (t === "PRESCRIPTION_ISSUED") return "Receta Emitida";
  if (t === "PRESCRIPTION_DISPENSED") return "Receta Dispensada";
  return "Notificación";
}

export default function PatientNotifications() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);

  const [rows, setRows] = useState<PatientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true); setErr(null);
    try {
      const data = await fetchPatientNotifications(user.id, { token, dev }, { limit: 50 });
      setRows(data);
    } catch (e: any) {
      setErr(e.message || "No se pudieron cargar las notificaciones");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onRead = async (id: string) => {
    try {
      await markNotificationRead(id, { token, dev });
      setRows((r) => r.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch (e) {
      // opcional: toast
    }
  };

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead(user!.id, { token, dev });
      setRows((r) => r.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {}
  };

  return (
    <PatientShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">Notificaciones</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-full border px-3 py-2 text-sm"
            title="Refrescar"
          >
            Refrescar
          </button>
          <button
            onClick={onReadAll}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <>
            <div className="h-24 animate-pulse rounded-3xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-3xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-3xl bg-gray-200" />
          </>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border bg-white p-8 text-center text-gray-600 ring-1 ring-gray-200">
            No tienes notificaciones.
          </div>
        ) : (
          rows.map((n) => {
            const title = titleByType(n.type);
            const text =
              n.message ||
              (n.type === "PRESCRIPTION_ISSUED"
                ? `El Dr(a). ${n.doctor_name || ""} ha emitido una nueva receta`
                : n.type === "PRESCRIPTION_DISPENSED"
                ? `Tu receta ha sido dispensada`
                : "Tienes una notificación");
            const href = n.prescription_id ? `/patient/prescriptions/${n.prescription_id}` : undefined;

            return (
              <div
                key={n.id}
                className={`rounded-3xl border bg-white px-5 py-4 ring-1 ring-gray-200 ${n.read_at ? "" : "shadow-sm"}`}
              >
                <div className="grid grid-cols-[48px_1fr_auto] gap-4 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <IconByType type={n.type} />
                  </div>
                  <div>
                    <h3 className="text-teal-700 font-semibold">{title}</h3>
                    <p className="text-sm text-gray-600">{text}</p>
                    {!n.read_at && (
                      <button
                        onClick={() => onRead(n.id)}
                        className="mt-2 rounded-full border px-3 py-1.5 text-xs"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{timeAgo(n.created_at)}</div>
                </div>

                <div className="mt-3">
                  {href ? (
                    <a
                      href={href}
                      className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                      onClick={() => onRead(n.id)}
                    >
                      Ver Receta
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        {err && (
          <p className="text-sm text-red-600">
            {err}
          </p>
        )}
      </div>
    </PatientShell>
  );
}
