// src/lib/prescriptionsApi.ts
/* =========================================
   Config & helpers
========================================= */
export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:3000";

type FetchOpts = { token?: string | null; dev?: { id: string; role: string } | null };

function authHeaders(opts?: FetchOpts) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.token) h.Authorization = `Bearer ${opts.token}`;
  else if (opts?.dev) {
    h["x-user-id"] = opts.dev.id;
    h["x-role"] = opts.dev.role;
  }
  return h;
}

async function respOrThrow<T = any>(r: Response, fallbackMsg: string): Promise<T> {
  let body: any = null;
  try {
    body = await r.json();
  } catch {
    // ignore
  }
  if (!r.ok) {
    const msg = body?.error || body?.message || r.statusText || fallbackMsg;
    throw new Error(msg);
  }
  return body as T;
}

function enc(v: string) {
  return encodeURIComponent(v);
}

/** Si el QR contiene JSON, extrae el campo token/t; si es string JWT/HMAC, lo deja tal cual */
export function normalizeTokenInput(input: string): string {
  const s = (input || "").trim();
  if (!s) return s;
  if (s.startsWith("{")) {
    try {
      const j = JSON.parse(s);
      return (j.token || j.t || s) as string;
    } catch {
      return s;
    }
  }
  return s;
}

/** Genera URL de imagen QR pública a partir de un token o payload */
export function qrImageUrl(payload: string | object, size: number = 280): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${enc(
    data
  )}`;
}

/* =========================================
   Tipos
========================================= */
export type Patient = { id: string; fullname: string; document_id?: string | null };

export type Medication = { id: number; code: string; name: string };

export type NewItem = { drug_code: string; name: string; quantity: number; dosage?: string };

export type RxListItem = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  created_at: string;
};

export type RxDetail = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "DRAFT" | "ISSUED" | "DISPENSED";
  created_at: string;
  notes?: string | null;
  items?: Array<{ drug_code: string; name: string; quantity: number; dosage?: string }>;
  patient_name?: string;
  hash_sha256?: string;
  signature_b64?: string;
  signed_at?: string;
  anchor_network?: string;
  anchor_txid?: string;
  anchor_block?: number;
  dispensed_at?: string;
};

export type RxVerifyResponse = {
  valid: boolean; // firma/hash válidos
  anchored?: boolean;
  network?: string | null;
  txid?: string | null;
  prescription: RxDetail;
};

export type PatientNotification = {
  id: string;
  type: "PRESCRIPTION_ISSUED" | "PRESCRIPTION_DISPENSED" | "GENERIC";
  message?: string | null;
  created_at: string;
  read_at?: string | null;
  prescription_id?: string | null;
  doctor_name?: string | null;
};

export type RxDispensedRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  dispensed_at: string;
  items_count?: number;
};

/* =========================================
   Utils de normalización
========================================= */
function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (Array.isArray(v?.items)) return v.items as T[];
  if (Array.isArray(v?.list)) return v.list as T[];
  return [];
}

/* =========================================
   Doctores / Pacientes / Catálogos
========================================= */
export async function fetchPatientsByDoctor(doctorId: string, opts?: FetchOpts): Promise<Patient[]> {
  const r = await fetch(`${API_BASE}/api/patients?doctorId=${enc(doctorId)}`, { headers: authHeaders(opts) });
  return respOrThrow<Patient[]>(r, "Error cargando pacientes");
}

export async function fetchMedications(opts?: FetchOpts): Promise<Medication[]> {
  const r = await fetch(`${API_BASE}/api/medications`, { headers: authHeaders(opts) });
  return respOrThrow<Medication[]>(r, "Error cargando medicamentos");
}

/* =========================================
   Prescripciones (listado, detalle, creación)
========================================= */
export async function fetchPrescriptions(
  params: { doctorId?: string; patientId?: string; order?: "asc" | "desc" },
  opts?: FetchOpts
): Promise<RxListItem[]> {
  const q = new URLSearchParams();
  if (params.doctorId) q.set("doctorId", params.doctorId);
  if (params.patientId) q.set("patientId", params.patientId);
  if (params.order) q.set("order", params.order);
  const r = await fetch(`${API_BASE}/api/prescriptions?${q.toString()}`, { headers: authHeaders(opts) });
  const raw = await respOrThrow<any>(r, "Error cargando recetas");
  return asArray<RxListItem>(raw);
}

export async function fetchPrescription(id: string, opts?: FetchOpts): Promise<RxDetail> {
  const r = await fetch(`${API_BASE}/api/prescriptions/${id}`, { headers: authHeaders(opts) });
  return respOrThrow<RxDetail>(r, "No se encontró la receta");
}

export async function createPrescription(
  input: { patient_id: string; notes?: string; items: NewItem[] },
  opts?: FetchOpts
): Promise<{ id: string }> {
  const r = await fetch(`${API_BASE}/api/prescriptions`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify(input),
  });
  return respOrThrow<{ id: string }>(r, "No se pudo crear la receta");
}

export async function signPrescription(id: string, privateKeyPem: string, opts?: FetchOpts): Promise<RxDetail> {
  const r = await fetch(`${API_BASE}/api/prescriptions/${id}/sign`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify({ privateKeyPem }),
  });
  return respOrThrow<RxDetail>(r, "No se pudo firmar");
}

export async function anchorPrescription(
  id: string,
  opts?: FetchOpts
): Promise<{ network: string; txid: string; blockNumber: number }> {
  const r = await fetch(`${API_BASE}/api/prescriptions/${id}/anchor`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify({}),
  });
  return respOrThrow<{ network: string; txid: string; blockNumber: number }>(r, "No se pudo anclar");
}

/* =========================================
   Token QR (paciente/doctor/admin) y verificación (farmacia)
========================================= */
/** Genera un token efímero para verificación de receta (BACKEND: GET /api/prescriptions/:id/qr) */
export async function fetchQrToken(
  id: string,
  opts?: FetchOpts
): Promise<{ token: string; exp?: number }> {
  const r = await fetch(`${API_BASE}/api/prescriptions/${id}/qr`, { headers: authHeaders(opts) });
  return respOrThrow<{ token: string; exp?: number }>(r, "No se pudo generar token");
}

/** Verifica una receta por token (usa GET público primero, luego POST público como fallback) */
export async function verifyPrescriptionByToken(
  tokenStr: string,
  _opts?: FetchOpts // se ignora a propósito para NO enviar Authorization
): Promise<RxVerifyResponse> {
  const tok = normalizeTokenInput(tokenStr);
  // 1) GET SIN Authorization
  let r = await fetch(`${API_BASE}/api/prescriptions/verify?token=${enc(tok)}`);
  // 2) Fallback a POST (por si la URL es muy larga u otro motivo)
  if (!r.ok) {
    r = await fetch(`${API_BASE}/api/prescriptions/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // sin Authorization
      body: JSON.stringify({ token: tok }),
    });
  }
  return respOrThrow<RxVerifyResponse>(r, "No se pudo verificar el token");
}

/** Construye payload estándar para QR a partir del token del servidor */
export function qrPayloadFromServerToken(token: string) {
  return JSON.stringify({ token });
}

/* =========================================
   Dispensación (farmacia)
========================================= */
export async function dispensePrescription(id: string, opts?: FetchOpts): Promise<RxDetail> {
  const r = await fetch(`${API_BASE}/api/prescriptions/${id}/dispense`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify({}),
  });
  return respOrThrow<RxDetail>(r, "No se pudo dispensar");
}

export async function fetchDispensedPrescriptions(
  params: { pharmacyId?: string; order?: "asc" | "desc" },
  opts?: FetchOpts
): Promise<RxDispensedRow[]> {
  const q = new URLSearchParams();
  if (params.pharmacyId) q.set("pharmacyId", params.pharmacyId);
  q.set("status", "DISPENSED");
  if (params.order) q.set("order", params.order);

  // Intento 1: filtro por status en /prescriptions
  let r = await fetch(`${API_BASE}/api/prescriptions?${q.toString()}`, { headers: authHeaders(opts) });
  if (r.ok) return r.json();

  // Fallback por farmacia
  r = await fetch(`${API_BASE}/api/pharmacies/${params.pharmacyId}/dispensed?${q.toString()}`, {
    headers: authHeaders(opts),
  });
  return respOrThrow<RxDispensedRow[]>(r, "No se pudo cargar el historial");
}

/* =========================================
   Asignaciones Doctor-Paciente
========================================= */
export async function assignPatient(doctorId: string, patientId: string, opts?: FetchOpts) {
  const r = await fetch(`${API_BASE}/api/doctors/${doctorId}/patients/${patientId}`, {
    method: "POST",
    headers: authHeaders(opts),
  });
  return respOrThrow(r, "No se pudo asignar");
}

export async function unassignPatient(doctorId: string, patientId: string, opts?: FetchOpts) {
  const r = await fetch(`${API_BASE}/api/doctors/${doctorId}/patients/${patientId}`, {
    method: "DELETE",
    headers: authHeaders(opts),
  });
  return respOrThrow(r, "No se pudo desasignar");
}

export async function fetchAssignedDoctor(
  patientId: string,
  opts?: FetchOpts
): Promise<{ id: string; fullname: string; license_number?: string }> {
  const r = await fetch(`${API_BASE}/api/patients/${patientId}/doctor`, { headers: authHeaders(opts) });
  return respOrThrow(r, "No se pudo cargar el médico asignado");
}

/* =========================================
   Notificaciones del Paciente
========================================= */
export async function fetchPatientNotifications(
  patientId: string,
  opts?: FetchOpts,
  params?: { page?: number; limit?: number }
): Promise<PatientNotification[]> {
  const q = new URLSearchParams();
  q.set("patientId", patientId);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));

  // Opción 1
  let r = await fetch(`${API_BASE}/api/notifications?${q.toString()}`, {
    headers: authHeaders(opts),
  });
  if (r.ok) return r.json();

  // Fallback
  r = await fetch(`${API_BASE}/api/patients/${patientId}/notifications?${q.toString()}`, {
    headers: authHeaders(opts),
  });
  return respOrThrow<PatientNotification[]>(r, "No se pudieron cargar las notificaciones");
}

export async function markNotificationRead(id: string, opts?: FetchOpts) {
  // Intento 1
  let r = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify({}),
  });
  if (r.ok) return r.json();

  // Fallback
  r = await fetch(`${API_BASE}/api/notifications/${id}`, {
    method: "PATCH",
    headers: authHeaders(opts),
    body: JSON.stringify({ read_at: new Date().toISOString() }),
  });
  return respOrThrow(r, "No se pudo marcar como leída");
}

export async function markAllNotificationsRead(patientId: string, opts?: FetchOpts) {
  const r = await fetch(`${API_BASE}/api/patients/${patientId}/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(opts),
    body: JSON.stringify({}),
  });
  return respOrThrow(r, "No se pudieron marcar todas");
}
