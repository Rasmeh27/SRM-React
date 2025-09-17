// src/lib/api.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:3000";

export type AuthUser = {
  id: string;
  email?: string;
  fullname: string;
  role: "doctor" | "patient" | "pharmacy" | "admin";
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    let msg = "Error de autenticación";
    try { msg = (await r.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

async function postJSON<T>(path: string, body: any): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try { msg = (await r.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

/* ---- Registro por rol ---- */
export function apiRegisterDoctor(input: {
  email: string; password: string; fullname: string;
  license_number: string; specialty?: string | null;
}): Promise<{ user_id: string }> {
  return postJSON(`/api/auth/register-doctor`, input);
}

export function apiRegisterPatient(input: {
  email: string; password: string; fullname: string;
  document_id: string; doctor_id?: string | null;
}): Promise<{ user_id: string }> {
  return postJSON(`/api/auth/register-patient`, input);
}

/* Nota: si tu backend aún no tiene este endpoint, te lo dejé listo.
   Si responde 404, solo muestra el error y luego lo activamos en backend. */
export function apiRegisterPharmacy(input: {
  email: string; password: string; fullname: string;
  company_name?: string | null; phone?: string | null;
}): Promise<{ user_id: string }> {
  return postJSON(`/api/auth/register-pharmacy`, input);
}
