import type { Prescription } from "../types/Prescriptions";
import { Link } from "react-router-dom";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function RecentActivityTable({
  rows,
}: {
  rows: Prescription[];
}) {
  return (
    <div className="rounded-xl border ring-1 ring-gray-200 overflow-hidden">
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
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Sin actividad reciente.
                </td>
              </tr>
            ) : (
              rows.map((rx) => (
                <tr key={rx.id} className="even:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{rx.id}</td>
                  <td className="px-4 py-3">
                    {rx.patient_name || rx.patient_id}
                  </td>
                  <td className="px-4 py-3">{formatDate(rx.created_at)}</td>
                  <td className="px-4 py-3">
                    {rx.items?.map((i) => i.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/doctor/prescriptions/${rx.id}`}
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
    </div>
  );
}
