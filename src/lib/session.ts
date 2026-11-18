import { useSyncExternalStore } from 'react';

/** Sesión del panel de desarrolladores. El token es el access_token que devuelve POST /auth/token. */
export interface DevSession { token: string; expiresAt: number; identifier: string; userId: string; role: 'admin' | 'agente' | 'cliente' }
const KEY = 'qhub.dev.session';
let cache: DevSession | null | undefined;
const subs = new Set<() => void>();

function read(): DevSession | null {
  if (cache !== undefined) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as DevSession) : null;
    cache = s && s.token && s.expiresAt > Date.now() ? s : null;
    if (!cache) localStorage.removeItem(KEY);
  } catch { cache = null; }
  return cache;
}
function write(s: DevSession | null) {
  cache = s;
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* sin storage */ }
  subs.forEach((f) => f());
}

/** Lee `sub` del JWT si existe; el panel lo usa como X-Usuario-Id por defecto. */
export function jwtSubject(token: string): string | null {
  try {
    const p = token.split('.')[1];
    if (!p) return null;
    const j = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    const v = j.sub ?? j.propietario_id ?? j.user_id;
    return typeof v === 'string' ? v : null;
  } catch { return null; }
}

export const sessionStore = {
  get: read,
  start(token: string, expiresIn: number, identifier: string) {
    write({ token, expiresAt: Date.now() + expiresIn * 1000, identifier, userId: jwtSubject(token) ?? identifier, role: 'admin' });
  },
  update(patch: Partial<Pick<DevSession, 'userId' | 'role'>>) { const s = read(); if (s) write({ ...s, ...patch }); },
  clear() { write(null); },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
};

export function useDevSession(): DevSession | null {
  const s = useSyncExternalStore(sessionStore.subscribe, sessionStore.get, () => null);
  return s && s.expiresAt > Date.now() ? s : null;
}
