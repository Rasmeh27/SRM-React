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
      } catch { if (alive) setRows([]); } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [token, dev, user?.id]);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">
          Hola, Dr. {user?.fullname?.split(" ")[0] || "Usuario"}
        </h1>
        <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow ring-1 ring-gray-200">
          <img src="/src/images/doctor-avatar.jpg" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold text-teal-700">Dr. {user?.fullname}</p>
            <p className="text-xs text-gray-500">Cardiólogo</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
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
      </section>

      {/* Actividad Reciente */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-teal-700">Actividad Reciente</h2>
        {loading ? <div className="h-40 animate-pulse rounded-xl bg-gray-200" /> : <RecentActivityTable rows={rows} />}
      </section>
    </AppShell>
  );
}
