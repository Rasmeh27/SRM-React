import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PatientShell from "../../component/PatientShell";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPrescription,
  fetchQrToken,
  qrImageUrl,
  qrPayloadFromServerToken,
  type RxDetail,
} from "../../lib/prescriptionsApi";

function StatusPill({ status }: { status: RxDetail["status"] }) {
  const cls =
    status === "DISPENSED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "ISSUED"
      ? "bg-blue-100 text-blue-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function PrescriptionDetailPatient() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const dev = useMemo(
    () => (!token && user ? { id: user.id, role: user.role } : null),
    [token, user]
  );

  const [rx, setRx] = useState<RxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // QR state
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      if (!id) throw new Error("ID inválido");
      const d = await fetchPrescription(id, { token, dev });
      setRx(d);
    } catch (e: any) {
      setErr(e.message || "No se pudo cargar la receta.");
      setRx(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const genQr = async () => {
    setQrLoading(true);
    setErr(null);
    setQrUrl(null);
    try {
      if (!id) throw new Error("ID inválido");
      const { token: t } = await fetchQrToken(id, { token, dev });
      setQrToken(t);
      // imagen QR sin dependencias extra
      setQrUrl(qrImageUrl(qrPayloadFromServerToken(t), 220));
    } catch (e: any) {
      setQrToken(null);
      setQrUrl(null);
      setErr(e.message || "No se pudo generar el token QR.");
    } finally {
      setQrLoading(false);
    }
  };

  const copyToken = async () => {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
      alert("Token copiado al portapapeles.");
    } catch {
      /* noop */
    }
  };

  return (
    <PatientShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">Receta #{id}</h1>
        {rx && <StatusPill status={rx.status} />}
      </div>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-200" />
      ) : !rx ? (
        <p className="mt-6 text-sm text-red-600">{err || "No se encontró la receta."}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Información general e items */}
          <section className="lg:col-span-2 rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Estado:</span>{" "}
                <StatusPill status={rx.status} />
              </p>
              <p>
                <span className="font-semibold">Emitida:</span>{" "}
                {new Date(rx.created_at).toLocaleString()}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Notas:</span>{" "}
                {rx.notes || "—"}
              </p>
            </div>

            <h2 className="mt-4 text-md font-semibold text-teal-700">Medicamentos</h2>
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
                  {rx.items?.map((i, idx) => (
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

            {rx.anchor_txid && (
              <>
                <h2 className="mt-6 text-md font-semibold text-teal-700">Anclaje</h2>
                <div className="mt-2 rounded-xl border p-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Red:</span> {rx.anchor_network}
                  </p>
                  <p className="break-words">
                    <span className="font-semibold">Tx:</span> {rx.anchor_txid}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* QR / acciones para el paciente */}
          <aside className="lg:col-span-1 h-fit rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-teal-700">Presentar en farmacia</h3>
            <p className="mt-1 text-xs text-gray-500">
              Genera un código QR con tu token de verificación para que la farmacia lo escanee.
            </p>

            <button
              type="button"
              onClick={genQr}
              disabled={qrLoading}
              className="mt-3 w-full rounded-full bg-teal-700 py-2 text-white font-semibold disabled:opacity-60"
            >
              {qrLoading ? "Generando…" : "Mostrar QR"}
            </button>

            {qrToken && (
              <div className="mt-4 flex flex-col items-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR de verificación"
                    className="h-56 w-56 rounded-xl border p-2 bg-white"
                  />
                ) : (
                  <p className="text-xs text-gray-600">
                    (No se pudo generar la imagen del QR. Muestra el token abajo.)
                  </p>
                )}

                <div className="mt-3 w-full">
                  <label className="block text-xs font-medium text-gray-700">Token</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      readOnly
                      value={qrToken}
                      className="flex-1 rounded-lg border px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={copyToken}
                      className="rounded-full border px-3 py-1.5 text-xs"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {err && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {err}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 w-full rounded-full border px-4 py-2 text-sm"
            >
              Volver
            </button>
          </aside>
        </div>
      )}
    </PatientShell>
  );
}
