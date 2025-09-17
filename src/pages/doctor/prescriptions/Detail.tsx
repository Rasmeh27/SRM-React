import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../../component/AppShell";
import { useAuth } from "../../../context/AuthContext";
import {
  anchorPrescription,
  fetchPrescription,
  fetchQrToken,            // <- reemplaza getQrToken por fetchQrToken
  signPrescription,
  type RxDetail,
} from "../../../lib/prescriptionsApi";

function Badge({ status }: { status: RxDetail["status"] }) {
  const map: Record<RxDetail["status"], string> = {
    DRAFT: "bg-amber-100 text-amber-800",
    ISSUED: "bg-blue-100 text-blue-800",
    DISPENSED: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

export default function Detail() {
  const { id = "" } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const dev = useMemo(
    () => (!token && user ? { id: user.id, role: user.role } : null),
    [token, user]
  );

  const [rx, setRx] = useState<RxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pem, setPem] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [anchoring, setAnchoring] = useState(false);
  const [signing, setSigning] = useState(false);

  const [qrToken, setQrToken] = useState<string | null>(null);

  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      if (!id) throw new Error("ID inválido");
      const data = await fetchPrescription(id, { token, dev });
      setRx(data);
    } catch (e: any) {
      setErr(e.message || "No se pudo cargar");
      setRx(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const readFile = async (f: File) => {
    const text = await f.text();
    setPem(text);
  };

  const doSign = async () => {
    setSigning(true);
    setErr(null);
    try {
      if (!id) throw new Error("ID inválido");
      const up = await signPrescription(id, pem, { token, dev });
      setRx(up);
    } catch (e: any) {
      setErr(e.message || "No se pudo firmar");
    } finally {
      setSigning(false);
    }
  };

  const doAnchor = async () => {
    setAnchoring(true);
    setErr(null);
    try {
      if (!id) throw new Error("ID inválido");
      await anchorPrescription(id, { token, dev });
      await load();
    } catch (e: any) {
      setErr(e.message || "No se pudo anclar");
    } finally {
      setAnchoring(false);
    }
  };

  const genQr = async () => {
    setErr(null);
    setQrToken(null);
    try {
      if (!id) throw new Error("ID inválido");
      const r = await fetchQrToken(id, { token, dev }); // <- aquí el cambio
      setQrToken(r.token);
    } catch (e: any) {
      setQrToken(null);
      setErr(e.message || "No se pudo generar token");
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal-700">Receta #{id}</h1>
        {rx && <Badge status={rx.status} />}
      </div>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-200" />
      ) : rx ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Información */}
          <section className="lg:col-span-2 rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Paciente:</span>{" "}
                {rx.patient_name || rx.patient_id}
              </p>
              <p>
                <span className="font-semibold">Fecha:</span>{" "}
                {new Date(rx.created_at).toLocaleString()}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Notas:</span> {rx.notes || "—"}
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

            {/* Anclaje */}
            <h2 className="mt-6 text-md font-semibold text-teal-700">Anclaje</h2>
            {rx.anchor_txid ? (
              <div className="mt-2 rounded-xl border p-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Red:</span> {rx.anchor_network}
                </p>
                <p className="break-words">
                  <span className="font-semibold">Tx:</span> {rx.anchor_txid}
                </p>
                <p>
                  <span className="font-semibold">Bloque:</span>{" "}
                  {rx.anchor_block ?? "—"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">Aún no anclada.</p>
            )}
          </section>

          {/* Acciones */}
          <aside className="lg:col-span-1 h-fit rounded-2xl bg-white p-5 shadow ring-1 ring-gray-200">
            {/* Firmar */}
            {rx.status === "DRAFT" && (
              <>
                <h3 className="text-lg font-semibold text-teal-700">Firmar receta</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Carga tu clave privada PEM para firmar.
                </p>
                <textarea
                  className="mt-2 h-32 w-full rounded-lg border p-2 text-xs font-mono"
                  placeholder="-----BEGIN PRIVATE KEY-----\n..."
                  value={pem}
                  onChange={(e) => setPem(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pem,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readFile(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full border px-3 py-1.5 text-sm"
                  >
                    Cargar archivo
                  </button>
                  <button
                    type="button"
                    disabled={!pem || signing}
                    onClick={doSign}
                    className="rounded-full bg-teal-700 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {signing ? "Firmando..." : "Firmar"}
                  </button>
                </div>
              </>
            )}

            {/* Anclar */}
            {rx.status !== "DRAFT" && !rx.anchor_txid && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-teal-700">Anclar en blockchain</h3>
                <button
                  type="button"
                  disabled={anchoring}
                  onClick={doAnchor}
                  className="mt-2 w-full rounded-full bg-teal-700 py-2 text-white font-semibold disabled:opacity-60"
                >
                  {anchoring ? "Anclando..." : "Anclar ahora"}
                </button>
              </div>
            )}

            {/* Token QR (opcional) */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-teal-700">Token de verificación</h3>
              <button
                type="button"
                onClick={genQr}
                className="mt-2 w-full rounded-full border px-4 py-2 text-sm"
              >
                Generar token
              </button>
              {qrToken && (
                <div className="mt-2 break-all rounded-lg border bg-gray-50 p-2 text-xs">
                  {qrToken}
                </div>
              )}
            </div>

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
      ) : (
        <p className="mt-6 text-sm text-gray-600">No se encontró la receta.</p>
      )}
    </AppShell>
  );
}
