// src/pages/doctor/prescriptions/NewPrescription.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import AppShell from "../../../component/AppShell";
import {
  fetchPatientsByDoctor,
  fetchMedications,
  createPrescription,
  type NewItem,
} from "../../../lib/prescriptionsApi";

type PatientLite = { id: string; fullname: string };
type MedLite = { code: string; name: string };

export default function NewPrescription() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Fallback dev headers (si no tienes token aún)
  const dev = useMemo(
    () => (!token && user ? { id: user.id, role: user.role } : null),
    [token, user]
  );

  // Estado de datos
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [meds, setMeds] = useState<MedLite[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");

  // Estado de ítems
  const [items, setItems] = useState<NewItem[]>([
    { drug_code: "", name: "", quantity: 1, dosage: "" },
  ]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Cargar pacientes del doctor + listado base de medicamentos
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user?.id) return;
        const [p, m] = await Promise.all([
          fetchPatientsByDoctor(user.id, { token, dev }),
          fetchMedications({ token, dev }),
        ]);
        if (!alive) return;

        setPatients(p);
        setMeds(m.map((x) => ({ code: x.code, name: x.name })));
        if (p[0]) setPatientId(p[0].id);
      } catch (e: any) {
        if (alive) setErr(e.message || "Error cargando datos iniciales");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, dev, user?.id]);

  // Helpers de ítems
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { drug_code: "", name: "", quantity: 1, dosage: "" },
    ]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<NewItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const medsFilter = (q: string) =>
    meds
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.code.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 8);

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!patientId) return setErr("Debe seleccionar un paciente.");
    if (
      items.length === 0 ||
      items.some((i) => !i.drug_code || !i.name || !i.quantity)
    )
      return setErr(
        "Complete al menos un medicamento (código, nombre y cantidad)."
      );

    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          drug_code: i.drug_code.trim(),
          name: i.name.trim(),
          quantity: Number(i.quantity),
          dosage: i.dosage?.trim() || undefined,
        })),
      };
      const res = await createPrescription(payload, { token, dev });
      navigate(`/doctor/prescriptions/${res.id}`, { replace: true });
    } catch (e: any) {
      setErr(e.message || "No se pudo crear la receta.");
    } finally {
      setSaving(false);
    }
  };

  // Render
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-teal-700">Emitir Receta</h1>
      <p className="text-sm text-gray-600">
        Complete la información y agregue los medicamentos.
      </p>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-200" />
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Columna izquierda (form principal) */}
          <section className="lg:col-span-2 rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Paciente
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones generales"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Ítems */}
            <div className="mt-6">
              <h2 className="text-md font-semibold text-teal-700">
                Medicamentos
              </h2>
              <div className="mt-3 space-y-4">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-3 ring-1 ring-gray-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-700">
                          Búsqueda
                        </label>
                        <input
                          placeholder="Código o nombre"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          onChange={(e) => {
                            const q = e.target.value;
                            const hint = medsFilter(q)[0];
                            updateItem(idx, {
                              drug_code: hint?.code || q,
                              name: hint?.name || q,
                            });
                          }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Escriba para autocompletar.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700">
                          Código
                        </label>
                        <input
                          value={it.drug_code}
                          onChange={(e) =>
                            updateItem(idx, { drug_code: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-700">
                          Nombre
                        </label>
                        <input
                          value={it.name}
                          onChange={(e) =>
                            updateItem(idx, { name: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(idx, { quantity: Number(e.target.value) })
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-sm text-gray-700">
                          Dosificación
                        </label>
                        <input
                          value={it.dosage || ""}
                          onChange={(e) =>
                            updateItem(idx, { dosage: e.target.value })
                          }
                          placeholder="Ej: 1 tableta cada 8h por 5 días"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-full border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                >
                  + Agregar medicamento
                </button>
              </div>
            </div>
          </section>

          {/* Columna derecha (resumen/acciones) */}
          <aside className="lg:col-span-1 h-fit rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-teal-700">Resumen</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
              <li>
                Paciente:{" "}
                {patients.find((p) => p.id === patientId)?.fullname || "—"}
              </li>
              <li>Ítems: {items.length}</li>
            </ul>

            {err && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full rounded-full bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Creando..." : "Crear receta"}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Luego podrá firmar y anclar en la pantalla de detalle.
            </p>
          </aside>
        </form>
      )}
    </AppShell>
  );
}
