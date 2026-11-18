const env = import.meta.env as Record<string, string | undefined>;
export const API_BASE = (env.VITE_QHUB_API_BASE_URL ?? 'https://qhub-api-a5yf.onrender.com').replace(/\/+$/, '');
export const WS_BASE = API_BASE.replace(/^http/, 'ws');
export const PLATFORM_URL = (env.VITE_QHUB_PLATFORM_URL ?? 'https://qhub-web-psi.vercel.app').replace(/\/+$/, '');
