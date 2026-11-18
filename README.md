# Qhub Info

Landing principal de Qhub + panel de desarrolladores (React 19 + Vite + Tailwind v4 + React Router).
Mismo design system que Qhub_Web (tokens, IBM Plex, logos e íconos copiados aquí; el proyecto es independiente).

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Landing: información de Qhub y las dos entradas (plataforma / desarrollador) |
| `/acceso?tipo=dev` | Login o registro de **cuenta de API** (solo API: `POST /auth/registro` y `POST /auth/token`) |
| `/dev` | Panel del desarrollador (requiere sesión): token, URL base, usuario/rol de ejemplo |
| `/dev/probar` | Probador de endpoints con el token de la sesión (requiere sesión) |
| `/dev/docs/:id` | Documentación de la API: guías y referencia de cada endpoint (pública) |

La opción «Usar la plataforma» lleva a `VITE_QHUB_PLATFORM_URL` (Qhub_Web), donde la persona crea su cuenta como siempre.

## Variables (públicas)

`VITE_QHUB_API_BASE_URL` · `VITE_QHUB_PLATFORM_URL` (ver `.env.example`).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build en dist/
```

La especificación de endpoints vive en `src/docs/spec.ts` (derivada de `GET /openapi.json` de la API); las guías en `src/docs/guides.tsx`.
La credencial del desarrollador es su **API key** (no vence): la manda directo en cada petición (`X-Api-Key` o `Authorization: Bearer <API key>`).
Se genera en el panel (`POST /auth/api-key`, pide confirmar la contraseña) y se muestra una sola vez. El token de sesión del panel (`/auth/token`) es temporal y solo lo usan el panel y el probador; no se guarda la contraseña.

## Despliegue (Vercel)

`vercel.json` ya trae el rewrite SPA. Variables `VITE_*` en *Environment Variables*.
