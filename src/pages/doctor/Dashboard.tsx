// src/pages/doctor/DoctorDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../component/AppShell";
import ActionCard from "../../component/ActionCard";
import RecentActivityTable from "../../component/RecentActivityTable";
import { useAuth } from "../../context/AuthContext";
import { apiGET } from "../../lib/http";
import type { Prescription } from "../../types/Prescriptions";

type RxListItem = { id: string; patient_id: string; doctor_id: string; status: string; created_at: string };

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Prescription[]>([]);
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list: RxListItem[] = await apiGET(`/api/prescriptions?doctorId=${user?.id}`, { token, dev });
        const top = list.slice(0, 5);
        const detailed = await Promise.all(
          top.map(async (rx) => {
            try { return await apiGET<Prescription>(`/api/prescriptions/${rx.id}`, { token, dev }); }
            catch { return { ...rx, items: [] } as Prescription; }
          })
        );
        if (alive) setRows(detailed);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token, dev, user?.id]);

  const stats = useMemo(() => {
    const total = rows.length;
    const anchored = rows.filter((r: any) => String(r.status || "").toLowerCase().includes("anchor")).length;
    const pending = rows.filter((r: any) => {
      const s = String(r.status || "").toLowerCase();
      return s.includes("sign") || s.includes("pend") || s.includes("draft");
    }).length;
    return { total, anchored, pending };
  }, [rows]);

  const firstName = user?.fullname?.split(" ")[0] || "Usuario";

  return (
    <AppShell>
      {/* HERO: gradiente azul-violeta + acentos teal (coherente con tu UI) */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-500 p-6 sm:p-8 text-white shadow-lg ring-1 ring-black/5">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-white/90 text-sm">Panel del médico</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
              Hola, Dr. {firstName}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              Supervise sus recetas recientes, firme y haga seguimiento en un vistazo.
            </p>
          </div>

          {/* CARD ajustada a la paleta teal */}
          <div className="flex items-center gap-4 rounded-2xl bg-teal-600/25 px-4 py-3 backdrop-blur-md ring-1 ring-teal-300/30">
            <img
              src="/src/images/doctor-avatar.jpg"
              alt="Avatar del doctor"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-teal-200/70"
            />
            <div className="min-w-[160px]">
              <p className="truncate text-sm font-semibold">Dr. {user?.fullname}</p>
              <p className="text-xs text-white/90">Cardiólogo</p>
            </div>
          </div>
        </div>

        {/* Métricas rápidas con tono teal semitransparente */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPill label="Recientes" value={stats.total} />
          <StatPill label="En proceso" value={stats.pending} />
          <StatPill label="Ancladas" value={stats.anchored} />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <ActionCard
            image="/src/images/crear-prescripcion.jpg"
            title="Emitir Receta"
            subtitle="Cree y firme una nueva prescripción"
            cta="Crear Receta"
            to="/doctor/prescriptions/new"
          />
          <ActionCard
            image="/src/images/historial-prescripcion.jpg"
            title="Historial de Recetas"
            subtitle="Revise todas las recetas emitidas"
            cta="Ver Historial"
            to="/doctor/prescriptions"
          />
          <ActionCard
            image="/src/images/pacientes-doctors.jpg"
            title="Mis Pacientes"
            subtitle="Acceda a la información de sus pacientes"
            cta="Ver Pacientes"
            to="/doctor/patients"
          />
        </div>
      </section>

      {/* Actividad reciente */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-teal-800">Actividad reciente</h2>
          <span className="text-xs text-slate-500">Últimas {Math.max(rows.length, 0)} recetas</span>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-[18px] bg-white shadow ring-1 ring-slate-300">
            <RecentActivityTable rows={rows} />
          </div>
        )}
      </section>
    </AppShell>
  );
}

/* ===== Subcomponentes visuales (teal-friendly) ===== */

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] bg-teal-600/25 px-4 py-3 ring-1 ring-teal-300/35">
      <span className="text-sm text-white/95">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-[18px] bg-white p-4 shadow ring-1 ring-slate-300">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-[18px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-teal-50 ring-1 ring-teal-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Sin actividad reciente</h3>
        <p className="mt-1 text-sm text-slate-500">
          Cuando emita o firme nuevas recetas, aparecerán aquí para un acceso rápido.
        </p>
      </div>
    </div>
  );
}
