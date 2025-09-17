// src/pages/pharmacy/PharmacyDashboard.tsx
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
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, dev, user?.id]);

  // ====== UI-only stats (no cambia lógica ni APIs) ======
  const stats = useMemo(() => {
    const total = rows.length;
    const today = rows.filter((r) => {
      try {
        const d = new Date(r.dispensed_at);
        const t = new Date();
        return d.toDateString() === t.toDateString();
      } catch {
        return false;
      }
    }).length;
    const itemsCount = rows.reduce((acc, r) => acc + (Number(r.items_count) || 0), 0);
    return { total, today, itemsCount };
  }, [rows]);

  return (
    <PharmacyShell>
      {/* HERO / Encabezado */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 p-6 sm:p-8 text-white shadow-lg ring-1 ring-black/5">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-white/90 text-sm">Panel de farmacia</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
              Hola, {user?.fullname || "Farmacia"}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              Valide recetas y lleve control de la dispensación con rapidez.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md ring-1 ring-white/25">
            <img
              src="/src/images/avatar-farmacia.jpg"
              alt="Avatar de la farmacia"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/70"
            />
            <div className="min-w-[160px]">
              <p className="truncate text-sm font-semibold">{user?.fullname || "Farmacia"}</p>
              <p className="text-xs text-white/85">Cuenta de farmacia</p>
            </div>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPill label="Dispensadas (vista)" value={stats.total} />
          <StatPill label="Hoy" value={stats.today} />
          <StatPill label="Ítems dispensados" value={stats.itemsCount} />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ActionCard
            image="/src/images/verificar-receta.jpg"
            title="Validar Recetas"
            subtitle="Verifique autenticidad escaneando un código QR o token."
            cta="Validar"
            to="/pharmacy/verify"
          />
          <ActionCard
            image="/src/images/recetas-dispensadas.jpg"
            title="Recetas Dispensadas"
            subtitle="Revise todas las recetas dispensadas."
            cta="Ver Historial"
            to="/pharmacy/dispensed"
          />
        </div>
      </section>

      {/* Actividad reciente */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-teal-800">Actividad reciente</h2>
          <span className="text-xs text-slate-500">Últimas {Math.max(rows.length, 0)} del feed</span>
        </div>

        <div className="overflow-hidden rounded-[18px] bg-white shadow ring-1 ring-gray-200">
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-teal-700/95 text-white backdrop-blur">
                    <th className="px-4 py-3 text-left font-semibold">Número Receta</th>
                    <th className="px-4 py-3 text-left font-semibold">Paciente</th>
                    <th className="px-4 py-3 text-left font-semibold">Fecha Dispensada</th>
                    <th className="px-4 py-3 text-left font-semibold">Medicamentos</th>
                    <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8">
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b last:border-b-0 even:bg-slate-50/60 hover:bg-teal-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{r.id}</td>
                        <td className="px-4 py-3 text-slate-800">{r.patient_id}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(r.dispensed_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.items_count ?? "—"}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`/pharmacy/dispensed`}
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
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </PharmacyShell>
  );
}

/* ========= Subcomponentes puramente visuales ========= */

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] bg-white/12 px-4 py-3 ring-1 ring-white/25">
      <span className="text-sm text-white/90">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

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
        Las recetas dispensadas aparecerán aquí para acceso rápido.
      </p>
    </div>
  );
}
