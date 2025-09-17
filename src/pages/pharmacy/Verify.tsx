// src/pages/pharmacy/Verify.tsx
import { useCallback, useMemo, useState } from "react";
import PharmacyShell from "../../component/PharmacyShell";
import QrScanner from "../../component/QrScanner";
import { useAuth } from "../../context/AuthContext";
import {
  verifyPrescriptionByToken,
  dispensePrescription,
  type RxVerifyResponse,
} from "../../lib/prescriptionsApi";

export default function PharmacyVerify() {
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);

  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<RxVerifyResponse | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [scan, setScan] = useState(true); // <— controla el escáner

  const verify = useCallback(
    async (tokenStr: string) => {
      if (!tokenStr) return;
      if (loading) return;        // evita doble verify
      setErr(null);
      setLoading(true);
      setData(null);
      setScan(false);             // <— pausa escaneo mientras verificas
      try {
        const res = await verifyPrescriptionByToken(tokenStr, { token, dev });
        setData(res);
      } catch (e: any) {
        setErr(e?.message || "Token inválido o no verificable");
      } finally {
        setLoading(false);
      }
    },
    [token, dev, loading]
  );

  async function dispense() {
    if (!data?.prescription?.id) return;
    setDispensing(true);
    setErr(null);
    try {
      const up = await dispensePrescription(data.prescription.id, { token, dev });
      setData((d) => (d ? { ...d, prescription: up } : d));
    } catch (e: any) {
      setErr(e.message || "No se pudo dispensar");
    } finally {
      setDispensing(false);
    }
  }

  return (
    <PharmacyShell>
      <h1 className="text-2xl font-bold text-teal-700">Validar Recetas</h1>
      <p className="text-sm text-gray-600">Escanee un QR o ingrese el token manualmente.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Escáner + manual */}
        <section className="lg:col-span-1 rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
          <h2 className="text-md font-semibold text-teal-700">Escáner QR</h2>

          <div className="mt-2">
            {scan ? (
              <QrScanner
                active
                onResult={(txt) => verify(txt)}
                onError={(e) => {
                  // Ignora errores benignos del dispositivo/permiso
                  console.warn("[QR] error", e);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[240px] rounded-xl bg-gray-50 text-gray-500 text-sm">
                Escáner pausado
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setScan((s) => !s)}
              disabled={loading}
            >
              {scan ? "Pausar cámara" : "Re-escanear"}
            </button>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-gray-700">Ingresar token manual</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="pej. eyJhbGciOi..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => verify(manual.trim())}
              disabled={loading || !manual.trim()}
            >
              Verificar
            </button>
          </div>

          {err && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
              {err}
            </p>
          )}
        </section>

        {/* Resultado */}
        <section className="lg:col-span-2 rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
          <h2 className="text-md font-semibold text-teal-700">Resultado</h2>

          {!data ? (
            <p className="mt-2 text-sm text-gray-500">{loading ? "Verificando..." : "Aún no hay resultado."}</p>
          ) : (
            <>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                <p><span className="font-semibold">Receta:</span> {data.prescription.id}</p>
                <p><span className="font-semibold">Estado:</span> {data.prescription.status}</p>
                <p><span className="font-semibold">Fecha:</span> {new Date(data.prescription.created_at).toLocaleString()}</p>
                <p><span className="font-semibold">Firma/Hash:</span> {data.valid ? "VÁLIDOS ✅" : "Inválidos ❌"}</p>
                <p className="sm:col-span-2">
                  <span className="font-semibold">Anclaje:</span>{" "}
                  {data.anchored ? `Sí (${data.network})` : "No"}
                </p>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-teal-700">Medicamentos</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                      <th className="px-3 py-2 text-left">Dosificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prescription.items?.map((i, idx) => (
                      <tr key={idx} className="even:bg-gray-50">
                        <td className="px-3 py-2">{i.drug_code}</td>
                        <td className="px-3 py-2">{i.name}</td>
                        <td className="px-3 py-2">{i.quantity}</td>
                        <td className="px-3 py-2">{i.dosage || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={dispensing || data.prescription.status === "DISPENSED" || !data.valid}
                  onClick={dispense}
                >
                  {dispensing ? "Dispensando..." : "Marcar como Dispensada"}
                </button>
                {data.prescription.status === "DISPENSED" && (
                  <span className="text-sm text-emerald-700">Receta ya dispensada.</span>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </PharmacyShell>
  );
}
