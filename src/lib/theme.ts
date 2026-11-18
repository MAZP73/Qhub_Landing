export type Theme = 'light' | 'dark' | 'system';
const KEY = 'qhub.theme';
export function loadTheme(): Theme { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } }
export function applyTheme(t: Theme) {
  const r = document.documentElement;
  if (t === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', t);
  try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch { /* sin storage */ }
}
