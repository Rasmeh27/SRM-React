// src/lib/http.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:3000";

export async function apiGET<T>(
  path: string,
  opts?: { token?: string | null; dev?: { id: string; role: string } | null }
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.token) headers["Authorization"] = `Bearer ${opts.token}`;
  else if (opts?.dev) {
    headers["x-user-id"] = opts.dev.id;
    headers["x-role"] = opts.dev.role;
  }
  const r = await fetch(`${API_BASE}${path}`, { headers });
  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try { msg = (await r.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}
