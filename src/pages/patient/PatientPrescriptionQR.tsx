// src/pages/patient/PatientPrescriptionQR.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../../component/AppShell";
import { useAuth } from "../../context/AuthContext";
import { fetchPrescription, type RxDetail } from "../../lib/prescriptionsApi";

export default function PatientPrescriptionQR() {
  const { id } = useParams<{ id: string }>();            // <-- usa 'id'
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const dev = useMemo(() => (!token && user ? { id: user.id, role: user.role } : null), [token, user]);

  const [rx, setRx] = useState<RxDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error("ID inválido");
        const data = await fetchPrescription(id, { token, dev }); // mismo fetch que en detalle
        setRx(data);
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar la receta");
      }
    })();
  }, [id, token, dev]);

  // PAYLOAD que la farmacia leerá al escanear (simple y suficiente)
  const payload = useMemo(() => {
    if (!rx) return "";
    return JSON.stringify({
      rx: rx.id,
      network: rx.anchor_network ?? null,
      txid: rx.anchor_txid ?? null,
      issued_at: rx.created_at,
    });
  }, [rx]);

  // QR sin librerías (usa un endpoint público de imagen)
  const qrSrc = useMemo(() => {
    if (!payload) return "";
    const data = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${data}`;
  }, [payload]);

  if (err) {
    return (
      <AppShell>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
        <div className="mt-4">
          <button onClick={() => navigate(-1)} className="rounded-full border px-4 py-2">Volver</button>
        </div>
      </AppShell>
    );
  }

  if (!rx || !qrSrc) {
    return (
      <AppShell>
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-200" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-teal-700">Código para la farmacia</h1>
      <p className="text-sm text-gray-600">Muestra este QR para verificar tu receta.</p>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200">
        <img src={qrSrc} alt="QR de receta" className="h-[280px] w-[280px]" />
        <textarea
          readOnly
          value={payload}
          className="w-full max-w-xl rounded-lg border p-2 text-xs text-gray-700"
        />
        <button onClick={() => navigate(-1)} className="rounded-full border px-5 py-2 hover:bg-gray-50">
          Volver
        </button>
      </div>
    </AppShell>
  );
}
