import { API_BASE, WS_BASE } from '@/lib/config';
import { CLIENTS } from './clients';
import { ENDPOINTS, ERRORS, GROUPS, STATUS_TEXT, type Endpoint, type Field } from './spec';

/** Nombre del archivo estático que publica el sitio (y que se descarga desde la documentación). */
export const AI_MD_FILE = 'qhub-api.md';

const json = (v: unknown) => JSON.stringify(v, null, 2);
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
function table(title: string, f?: Field[]): string {
  if (!f?.length) return '';
  return `\n**${title}**\n\n| Campo | Tipo | Requerido | Descripción |\n|---|---|---|---|\n${f.map((x) => `| \`${x.name}\` | ${cell(x.type)} | ${x.required ? 'sí' : 'no'} | ${cell(x.desc)} |`).join('\n')}\n`;
}

function endpoint(e: Endpoint): string {
  const auth = e.auth === 'none' ? 'Pública (sin credencial).' : e.auth === 'bearer' ? 'Token de sesión (`POST /auth/token`); aquí no vale la API key. Es la gestión de la propia API key: normalmente se hace desde el panel, no desde la integración.' : `API key (o token de sesión) + \`X-Usuario-Id\` + \`X-Usuario-Rol\`${e.roles ? ` (rol \`${e.roles}\`)` : ''}.`;
  const out = [`### \`${e.method} ${e.path}\` — ${e.title}`, '', e.summary, '', `- **Autenticación:** ${auth}`, `- **Respuesta exitosa:** ${e.status} ${STATUS_TEXT[e.status] ?? ''}`.trimEnd()];
  if (e.errors?.length) out.push(`- **Errores posibles:** ${e.errors.join(', ')}`);
  for (const n of e.notes ?? []) out.push(`- ${n}`);
  let s = out.join('\n') + '\n' + table('Parámetros de ruta', e.pathParams) + table('Parámetros de consulta', e.query) + table('Cuerpo (JSON)', e.body);
  if (e.bodyExample) s += `\nEjemplo de cuerpo:\n\n\`\`\`json\n${json(e.bodyExample)}\n\`\`\`\n`;
  if (e.response !== undefined) s += `\nEjemplo de respuesta:\n\n\`\`\`json\n${json(e.response)}\n\`\`\`\n`;
  else if (e.responseNote) s += `\n${e.responseNote}\n`;
  return s;
}

const SITE = typeof location !== 'undefined' ? location.origin : '';

/** Documento Markdown listo para dárselo a un asistente de IA (CLAUDE.md, AGENTS.md, reglas de Cursor, etc.). */
export function buildAiMd(): string {
  const js = CLIENTS.find((c) => c.lang === 'js')?.code ?? '';
  const py = CLIENTS.find((c) => c.lang === 'python')?.code ?? '';
  return `# Integrar la API de Qhub en este proyecto

> Instrucciones para un asistente de programación (Claude Code, Codex, Cursor, Copilot…). Léelas completas antes de escribir código.
> Qué es Qhub: una API REST (JSON) para gestionar colas y turnos de espera, con avisos en tiempo real por WebSocket.
> Cómo usar este archivo: guárdalo en la raíz del proyecto como \`CLAUDE.md\` (Claude Code), \`AGENTS.md\` (Codex y otros) o añade su contenido a las reglas de tu herramienta.

## Tu tarea

Integra Qhub en **este** proyecto, respetando su lenguaje, framework, estructura y estilo. No cambies el stack ni reescribas lo que ya funciona. Antes de programar:

1. Revisa el proyecto: lenguaje, framework, cómo maneja la configuración (variables de entorno), cómo hace peticiones HTTP, dónde viven sus usuarios y roles.
2. Si algo no está claro, **pregunta** (no inventes). Lo mínimo que necesitas saber: qué quiere lograr la persona (sacar turnos, atender una fila, mostrar el estado de la cola, avisos…), qué usuarios existen en su sistema y cómo se mapean a los roles de Qhub (\`cliente\`, \`agente\`, \`admin\`).
3. Haz cambios pequeños y verificables: primero la configuración y un cliente reutilizable, luego un flujo completo, y solo después lo demás.

## Datos de conexión

| Dato | Valor |
|---|---|
| URL base | \`${API_BASE}\` |
| WebSocket | \`${WS_BASE}\` |
| Documentación completa | ${SITE ? `${SITE}/dev/docs` : 'sección /dev/docs del sitio de Qhub'} |
| Formato | JSON (\`Content-Type: application/json\`); las respuestas \`204\` no traen cuerpo |
| Fechas | ISO 8601 en UTC; la zona horaria de cada cola se define en su horario |

Variables de entorno (la persona debe definirlas; **nunca** escribas su valor real en el código ni en el repositorio):

\`\`\`
QHUB_API_KEY=<la API key de la cuenta>      # secreta; se genera en el panel de desarrolladores
QHUB_API_URL=${API_BASE}
\`\`\`

## Reglas que no debes romper

- La **API key es secreta y no vence**: úsala solo desde el servidor/backend. Jamás en una app móvil, en JavaScript de una página ni en un repositorio. Añade \`.env\` al \`.gitignore\`. Si falta o es inválida, la API responde 401.
- Todas las llamadas de negocio llevan la credencial en el header \`Authorization: Bearer <API key>\` (también vale \`X-Api-Key: <API key>\`). No hace falta pedir un token antes.
- Los endpoints de negocio exigen además **\`X-Usuario-Id\`** (quién actúa: el identificador estable que tenga esa persona en el sistema del proyecto, p. ej. su id o correo) y **\`X-Usuario-Rol\`** (\`cliente\`, \`agente\` o \`admin\`). Los pone el código, en cada petición, según quién esté actuando.
- Qhub **no** gestiona los usuarios finales del proyecto: los identifica el proyecto con \`X-Usuario-Id\`. No crees cuentas de Qhub por cada usuario final.
- Pon **timeout de 60 s** (la API puede tardar en responder si estuvo inactiva) y **reintenta solo 429 y 5xx** con espera creciente. Los 4xx son errores de la petición: reintentar no los arregla.
- No dejes la API key ni tokens en logs, en mensajes de error ni en el frontend.
- Valida los datos antes de enviarlos y muestra al usuario final el mensaje de \`detail\` cuando exista; no expongas errores técnicos crudos.

## Roles

| Rol | Para qué |
|---|---|
| \`cliente\` | Quien saca turnos: crea, consulta, pospone y cancela **los suyos**. |
| \`agente\` | Quien atiende: llama (\`atender\`), \`finalizar\` y marca \`no-show\`. Esas tres acciones exigen este rol. |
| \`admin\` | Quien administra: crea y configura colas y horarios; consulta todos los turnos. |

## Ciclo de un turno

| Estado | Significa | Cómo se llega |
|---|---|---|
| \`en_espera\` | Está en la fila | Al sacar el turno, o al posponerlo |
| \`atendiendo\` | Un agente lo llamó | \`PATCH /turnos/{id}/atender\` |
| \`finalizado\` | La atención terminó | \`PATCH /turnos/{id}/finalizar\` |
| \`cancelado\` | Se canceló (libera el cupo) | \`PATCH /turnos/{id}/cancelar\` |
| \`no_show\` | No se presentó (libera el cupo) | \`PATCH /turnos/{id}/no-show\` |

Un turno puede ser **en vivo** (sin \`franja_inicio\`) o **programado** para una franja futura. Posponer lo manda al final de **su misma franja**; para cambiar de franja se cancela y se saca uno nuevo.

## Flujo mínimo para probar (en este orden)

1. \`GET /colas\` (rol \`admin\`) → debe responder 200: confirma que la API key y la URL están bien.
2. \`POST /colas\` (rol \`admin\`) con \`{ "nombre": "Atención al cliente" }\` → guarda el \`id\` de la cola.
3. \`PUT /colas/{cola_id}/horario\` (rol \`admin\`) → define apertura, cierre, días y franjas.
4. \`POST /turnos\` (rol \`cliente\`) con \`{ "cola_id": "<id>" }\` → saca un turno.
5. \`PATCH /turnos/{id}/atender\` y \`/finalizar\` (rol \`agente\`) → recorre el ciclo.

## Cliente de referencia (JavaScript)

Úsalo como base si el proyecto es JavaScript/TypeScript; si no, tradúcelo al lenguaje del proyecto manteniendo la misma lógica (configuración desde el entorno, headers, timeout, error claro en 4xx/5xx).

\`\`\`js
${js}
\`\`\`

## Cliente de referencia (Python)

\`\`\`python
${py}
\`\`\`

## Tiempo real (WebSocket)

- \`${WS_BASE}/ws/turnos/{cola_id}\` — cada cambio en los turnos de esa cola.
- \`${WS_BASE}/ws/notificaciones\` — los avisos de la persona conectada.
- El navegador no permite headers en un WebSocket: la identidad va en el parámetro \`token\` con el formato \`credencial:usuario_id:rol\` (la credencial es la API key o un token de sesión), p. ej. \`?token=<API_KEY>:cliente-123:cliente\`. **Si el WebSocket se abre desde el navegador, no expongas la API key**: conéctate desde tu backend o usa un token de sesión de corta duración (\`POST /auth/token\` con \`X-Api-Key\`).
- Eventos de una cola (\`tipo\`): \`turno_creado\`, \`turno_llamado\`, \`turno_pospuesto\`, \`turno_cancelado\`, \`turno_no_show\`, \`cola_actualizada\`. Forma: \`{ "tipo": "...", "cola_id": "...", "payload": { ... } }\`.
- Notificaciones: \`{ "tipo": "notificacion", "notificacion": { "id", "turno_id", "mensaje", "leida", "tipo_aviso" } }\`; \`tipo_aviso\` ∈ \`turno_llamado\`, \`turno_pospuesto\`, \`turno_no_show\`, \`recordatorio\`.
- Ignora los mensajes de control (\`ping\`, \`conectado\`). Si se corta, reconecta con espera creciente (1 s, 2 s, 4 s…). Si cierra con el código \`4401\`, la credencial es inválida: no reintentes igual.

## Errores

${ERRORS.map((e) => `- **${e.status} ${e.name}:** ${e.desc}`).join('\n')}

Formato: \`{ "detail": "mensaje" }\`; en 422, \`detail\` es una lista con \`loc\` (campo), \`msg\` y \`type\`.

## Referencia de endpoints

${GROUPS.map((g) => `## ${g}\n\n${ENDPOINTS.filter((e) => e.group === g).map(endpoint).join('\n')}`).join('\n')}

## Lista de comprobación antes de dar la integración por terminada

- [ ] La API key sale de una variable de entorno y no está en el código, ni en el repositorio, ni en el frontend.
- [ ] Hay un único cliente/módulo que construye los headers (\`Authorization\`, \`X-Usuario-Id\`, \`X-Usuario-Rol\`), con timeout de 60 s y reintentos solo para 429/5xx.
- [ ] \`X-Usuario-Id\` es estable por persona y el rol se calcula en el servidor, no lo decide el navegador.
- [ ] Se manejan 401, 403, 404, 409 y 422 con mensajes claros para el usuario.
- [ ] \`GET /colas\` responde 200 en el entorno de la persona.
- [ ] Se probó el flujo completo: sacar turno → atender → finalizar (y cancelar/posponer).
- [ ] Si usa tiempo real: reconexión con espera creciente y sin exponer la API key al navegador.
- [ ] Se documentó en el README del proyecto qué variables hay que definir (\`QHUB_API_KEY\`, \`QHUB_API_URL\`).

---
Documentación interactiva y probador: ${SITE ? `${SITE}/dev` : 'sección /dev del sitio de Qhub'} · Este archivo se genera a partir de la misma especificación de la documentación.
`;
}
