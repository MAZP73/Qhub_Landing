const env = import.meta.env as Record<string, string | undefined>;
export const API_BASE = (env.VITE_QHUB_API_BASE_URL ?? 'https://qhub-api-a5yf.onrender.com').replace(/\/+$/, '');
export const WS_BASE = API_BASE.replace(/^http/, 'ws');
/** App móvil para clientes: se abre con Expo Go (instálalo desde Google Play o la App Store y abre este enlace). */
export const APP_URL = (env.VITE_QHUB_APP_URL ?? 'exp://u.expo.dev/dc7a8386-2fda-4cbf-a350-93bd1fb7c4de?channel-name=preview&runtime-version=0.1.0');
export const EXPO_GO_ANDROID = 'https://play.google.com/store/apps/details?id=host.exp.exponent';
export const EXPO_GO_IOS = 'https://apps.apple.com/app/expo-go/id982107779';
export const PLATFORM_URL = (env.VITE_QHUB_PLATFORM_URL ?? 'https://qhub-web-psi.vercel.app').replace(/\/+$/, '');
