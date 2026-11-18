import { API_BASE } from './config';

export interface TokenOut { access_token: string; token_type: string; expires_in: number }
export interface RegistroOut { propietario_tipo: 'empresa' | 'usuario'; propietario_id: string; nombre_usuario: string; email: string; nombre_empresa?: string | null; limite_colas: number; creada_en: string }
export interface RegisterBody {
  tipo_cuenta: 'empresa' | 'usuario'; nombre_empresa?: string; nombre: string; apellido: string; nombre_usuario: string;
  email: string; password: string; pais: string; ciudad: string; acepto_terminos: boolean;
}
export type ApiResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

function messageFor(status: number, body: unknown): string {
  const d = (body as { detail?: unknown } | null)?.detail;
  if (typeof d === 'string' && d.length < 200) return d;
  switch (status) {
    case 0: return 'No pudimos conectar con la API. Revisa tu conexión e inténtalo de nuevo.';
    case 404: return 'Esta función aún no está disponible en el servidor.';
    case 401: return 'Usuario o contraseña incorrectos.';
    case 409: return 'Ya existe una cuenta con ese correo o nombre de usuario.';
    case 422: return 'Revisa los datos: alguno no cumple el formato esperado.';
    case 429: return 'Demasiados intentos. Espera un momento e inténtalo otra vez.';
    default: return status >= 500 ? 'La API tuvo un problema. Inténtalo de nuevo en un momento.' : 'No se pudo completar la solicitud.';
  }
}

async function send<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown, token?: string): Promise<ApiResult<T>> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 45_000);   // la API en Render puede tardar en despertar
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ac.signal });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return res.ok ? { ok: true, value: json as T } : { ok: false, status: res.status, message: messageFor(res.status, json) };
  } catch {
    return { ok: false, status: 0, message: messageFor(0, null) };
  } finally { clearTimeout(timer); }
}

const post = <T,>(path: string, body: unknown) => send<T>('POST', path, body);

export const apiLogin = (identificador: string, password: string) => post<TokenOut>('/auth/token', { identificador, password });
export const apiRegister = (b: RegisterBody) => post<RegistroOut>('/auth/registro', b);
export const apiRecover = (email: string) => post<unknown>('/auth/recuperar', { email });

export async function apiReady(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    const res = await fetch(`${API_BASE}/listo`, { headers: { Accept: 'application/json' } });
    const j = (await res.json()) as { supabase?: string };
    return res.ok && j.supabase === 'ok' ? 'ok' : 'degraded';
  } catch { return 'down'; }
}

export interface ApiKeyState { activa: boolean; creada_en: string | null }
export interface ApiKeyIssued { api_key: string; creada_en: string }
/** La API key permanente de la cuenta. La llave en claro solo se ve al emitirla. */
export const apiKeyStatus = (token: string) => send<ApiKeyState>('GET', '/auth/api-key', undefined, token);
export const apiKeyIssue = (token: string, identificador: string, password: string) => send<ApiKeyIssued>('POST', '/auth/api-key', { identificador, password }, token);
export const apiKeyRevoke = (token: string) => send<null>('DELETE', '/auth/api-key', undefined, token);
