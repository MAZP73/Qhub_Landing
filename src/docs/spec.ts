/** Especificación de la API de Qhub: se construye a partir del esquema OpenAPI público (GET /openapi.json). */
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface Field { name: string; type: string; required?: boolean; desc: string }
export type Auth = 'none' | 'bearer' | 'actor';   // none: público · bearer: solo token · actor: token + X-Usuario-Id / X-Usuario-Rol

export interface Endpoint {
  id: string; group: string; method: Method; path: string; title: string; summary: string; notes?: string[];
  auth: Auth; roles?: string;
  pathParams?: Field[]; query?: Field[]; body?: Field[]; bodyExample?: Record<string, unknown>;
  status: number; response?: unknown; responseNote?: string; errors?: number[];
}

export const GROUPS = ['Cuentas y acceso', 'Colas', 'Horarios y franjas', 'Turnos', 'Notificaciones', 'Sistema'] as const;

const UUID = '3f6c1b2e-8a54-4c0e-9d1a-5b7e2c9f4a10';
const TURNO = { id: '9b1d7c42-5e3a-4f08-a6b1-2c4d8e0f7a93', cola_id: UUID, propietario_tipo: 'empresa', propietario_id: '0c8a5e21-7d4b-4a93-b2f6-1e9d3c7a5b48', propietario_nombre: 'Clínica Andina', usuario_id: 'cliente-123', franja_inicio: '2026-11-20T14:00:00Z', franja_fecha: '2026-11-20', programado: true, numero: 12, estado: 'en_espera', posicion: 3, hora_creacion: '2026-11-18T15:02:11Z', hora_atencion: null, hora_finalizacion: null, agente_id: null };
const COLA = { id: UUID, propietario_tipo: 'empresa', propietario_id: '0c8a5e21-7d4b-4a93-b2f6-1e9d3c7a5b48', propietario_nombre: 'Clínica Andina', nombre: 'Atención al cliente', descripcion: 'Trámites generales', activa: true, rabbitmq_queue_name: 'cola.atencion-al-cliente' };
const HORARIO = { cola_id: UUID, zona_horaria: 'America/Guayaquil', hora_apertura: '08:00:00', hora_cierre: '17:00:00', duracion_franja_minutos: 60, dias_atencion: [1, 2, 3, 4, 5], duracion_turno_minutos: 15, puestos: 2, capacidad_diaria: 72, dias_anticipacion_maxima: 14, franjas_por_dia: 9, cupos_por_franja: 8, turnos_por_dia: 72 };
const NOTI = { id: '5a2e9c10-3b7d-4e68-8f14-0d6c1b9a7e52', propietario_tipo: 'empresa', propietario_id: '0c8a5e21-7d4b-4a93-b2f6-1e9d3c7a5b48', usuario_id: 'cliente-123', turno_id: TURNO.id, mensaje: 'Es tu turno: pasa al puesto 2.', leida: false, creada_en: '2026-11-20T14:05:00Z' };

const ID_COLA: Field = { name: 'cola_id', type: 'uuid', required: true, desc: 'Identificador de la cola.' };
const ID_TURNO: Field = { name: 'turno_id', type: 'uuid', required: true, desc: 'Identificador del turno.' };
const PAGE: Field[] = [
  { name: 'limite', type: 'integer', desc: 'Máximo de resultados a devolver.' },
  { name: 'desde', type: 'integer', desc: 'Cuántos resultados saltar (paginación).' },
];

export const ENDPOINTS: Endpoint[] = [
  // ───── Cuentas y acceso
  {
    id: 'registro', group: 'Cuentas y acceso', method: 'POST', path: '/auth/registro', title: 'Registrar cuenta', auth: 'none', status: 201,
    summary: 'Crea una cuenta que va a consumir la API. Después de registrarte, inicia sesión con POST /auth/token.',
    notes: ['`tipo_cuenta: "empresa"` sin sesión crea la empresa y su primera cuenta.', '`tipo_cuenta: "empresa"` con un token en `Authorization` agrega otra cuenta a la empresa de ese token (el `empresa_id` sale del token, nunca del body).', '`tipo_cuenta: "usuario"` crea una cuenta individual.'],
    body: [
      { name: 'tipo_cuenta', type: '"empresa" | "usuario"', desc: 'Tipo de cuenta. Por defecto `empresa`.' },
      { name: 'nombre_empresa', type: 'string', desc: 'Nombre de la empresa (1–200). Solo para `empresa`.' },
      { name: 'nombre', type: 'string', required: true, desc: 'Nombre (1–100).' },
      { name: 'apellido', type: 'string', required: true, desc: 'Apellido (1–100).' },
      { name: 'nombre_usuario', type: 'string', required: true, desc: 'Usuario para iniciar sesión (3–50).' },
      { name: 'email', type: 'string (email)', required: true, desc: 'Correo electrónico.' },
      { name: 'password', type: 'string', required: true, desc: 'Contraseña (8–128).' },
      { name: 'pais', type: 'string', required: true, desc: 'País (1–100).' },
      { name: 'ciudad', type: 'string', required: true, desc: 'Ciudad (1–100).' },
      { name: 'acepto_terminos', type: 'boolean', required: true, desc: 'Debe ser `true`.' },
    ],
    bodyExample: { tipo_cuenta: 'empresa', nombre_empresa: 'Clínica Andina', nombre: 'Ana', apellido: 'Pérez', nombre_usuario: 'ana.perez', email: 'ana@clinica.com', password: 'una-clave-segura', pais: 'Ecuador', ciudad: 'Quito', acepto_terminos: true },
    response: { propietario_tipo: 'empresa', propietario_id: '0c8a5e21-7d4b-4a93-b2f6-1e9d3c7a5b48', nombre_usuario: 'ana.perez', email: 'ana@clinica.com', nombre_empresa: 'Clínica Andina', limite_colas: 10, creada_en: '2026-11-18T15:00:00Z' },
    errors: [409, 422],
  },
  {
    id: 'token', group: 'Cuentas y acceso', method: 'POST', path: '/auth/token', title: 'Obtener token de acceso', auth: 'none', status: 200,
    summary: 'Inicia sesión y devuelve el `access_token` que usarás como `Authorization: Bearer` en el resto de endpoints. Es el único endpoint que acepta la contraseña.',
    notes: ['**Es opcional.** Los demás endpoints aceptan tu API key directamente (`X-Api-Key` o `Authorization: Bearer <API key>`); este endpoint sirve si prefieres usar un token de corta duración (p. ej. para tu navegador) o para entrar con usuario y contraseña.', 'Dos formas de identificarte (usa una, no ambas): `identificador` (usuario o correo, sin distinguir mayúsculas) y `password` en el body, o tu **API key** en el header `X-Api-Key` (sin body).', 'El token es de corta duración y no se renueva: pide otro con tu API key (o con tu contraseña).'],
    body: [
      { name: 'identificador', type: 'string', required: true, desc: 'Nombre de usuario o correo.' },
      { name: 'password', type: 'string', required: true, desc: 'Contraseña de la cuenta.' },
    ],
    bodyExample: { identificador: 'ana.perez', password: 'una-clave-segura' },
    response: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…', token_type: 'bearer', expires_in: 3600 }, errors: [401, 422, 429],
  },
  {
    id: 'api-key-estado', group: 'Cuentas y acceso', method: 'GET', path: '/auth/api-key', title: 'Estado de la API key', auth: 'bearer', status: 200,
    summary: 'Indica si tu cuenta tiene una API key activa y desde cuándo. Nunca devuelve la llave.',
    response: { activa: true, creada_en: '2026-11-18T14:49:28.737514Z' }, errors: [401],
  },
  {
    id: 'api-key-emitir', group: 'Cuentas y acceso', method: 'POST', path: '/auth/api-key', title: 'Generar o rotar API key', auth: 'bearer', status: 201,
    summary: 'Emite la API key permanente de tu cuenta. Si ya tenías una, la reemplaza: la anterior deja de valer.',
    notes: ['La API key **no vence** y se usa directamente en cada petición: `X-Api-Key: <API key>` o `Authorization: Bearer <API key>`. No hace falta pedir tokens.', 'La llave se muestra **una sola vez**, en esta respuesta. Guárdala: solo se conserva su huella y no se puede volver a consultar.', 'Requiere el token de tu sesión (no la propia API key) y confirmar tu contraseña; así una llave o un token robados no bastan para crear una credencial permanente.', 'Los tokens de sesión ya emitidos siguen valiendo hasta que caduquen.'],
    body: [{ name: 'identificador', type: 'string', required: true, desc: 'Tu usuario o correo.' }, { name: 'password', type: 'string', required: true, desc: 'Contraseña de tu cuenta.' }],
    bodyExample: { identificador: 'ana.perez', password: 'una-clave-segura' },
    response: { api_key: 'f3Jk9…(43 caracteres)', creada_en: '2026-11-18T14:49:28.501446Z' }, errors: [401, 422, 429],
  },
  {
    id: 'api-key-revocar', group: 'Cuentas y acceso', method: 'DELETE', path: '/auth/api-key', title: 'Revocar API key', auth: 'bearer', status: 204,
    summary: 'Revoca tu API key: deja de funcionar de inmediato. Los tokens de sesión ya emitidos siguen valiendo hasta que caduquen.', responseNote: 'Sin contenido.', errors: [401],
  },
  {
    id: 'recuperar', group: 'Cuentas y acceso', method: 'POST', path: '/auth/recuperar', title: 'Pedir enlace de recuperación', auth: 'none', status: 200,
    summary: 'Envía un enlace para elegir una contraseña nueva. Responde siempre lo mismo exista o no el correo, para no revelar qué correos están registrados.',
    body: [{ name: 'email', type: 'string (email)', required: true, desc: 'Correo de la cuenta.' }], bodyExample: { email: 'ana@clinica.com' },
    response: { detail: 'Si el correo está registrado, te enviamos un enlace.' }, errors: [422, 429],
  },
  {
    id: 'restablecer', group: 'Cuentas y acceso', method: 'POST', path: '/auth/restablecer', title: 'Restablecer contraseña', auth: 'none', status: 200,
    summary: 'Fija la contraseña nueva usando el token del enlace de recuperación.',
    body: [{ name: 'token', type: 'string', required: true, desc: 'Token recibido en el enlace.' }, { name: 'password', type: 'string', required: true, desc: 'Contraseña nueva (8–72).' }],
    bodyExample: { token: 'tok_…', password: 'otra-clave-segura' }, response: { detail: 'Contraseña actualizada.' }, errors: [401, 422],
  },
  {
    id: 'cambiar-clave', group: 'Cuentas y acceso', method: 'POST', path: '/auth/cambiar-clave', title: 'Cambiar contraseña', auth: 'none', status: 200,
    summary: 'Cambia la contraseña identificándote con la actual.',
    body: [{ name: 'identificador', type: 'string', required: true, desc: 'Usuario o correo.' }, { name: 'password_actual', type: 'string', required: true, desc: 'Contraseña actual.' }, { name: 'password_nueva', type: 'string', required: true, desc: 'Contraseña nueva (8–72).' }],
    bodyExample: { identificador: 'ana.perez', password_actual: 'una-clave-segura', password_nueva: 'otra-clave-segura' }, response: { detail: 'Contraseña actualizada.' }, errors: [401, 422],
  },

  // ───── Colas
  {
    id: 'colas-crear', group: 'Colas', method: 'POST', path: '/colas', title: 'Crear cola', auth: 'actor', status: 201,
    summary: 'Crea una cola para la cuenta del token. Puedes incluir el horario desde el inicio o definirlo después con PUT /colas/{cola_id}/horario.',
    notes: ['El límite de colas activas depende del tipo de cuenta; consúltalo con GET /colas/limite. Superarlo devuelve 409.', 'La zona horaria no se envía aquí: se fija con PUT /colas/{cola_id}/horario.'],
    body: [
      { name: 'nombre', type: 'string', required: true, desc: 'Nombre de la cola (1–120).' },
      { name: 'descripcion', type: 'string', desc: 'Descripción opcional.' },
      { name: 'hora_apertura', type: 'time', desc: 'Hora de apertura, `HH:MM:SS`.' },
      { name: 'hora_cierre', type: 'time', desc: 'Hora de cierre, `HH:MM:SS`.' },
      { name: 'duracion_franja_minutos', type: 'integer', desc: 'Duración de cada franja (5–480).' },
      { name: 'dias_atencion', type: 'integer[]', desc: 'Días de atención, ISO: 1 = lunes … 7 = domingo.' },
      { name: 'duracion_turno_minutos', type: 'integer', desc: 'Duración estimada de cada trámite (1–480).' },
      { name: 'puestos', type: 'integer', desc: 'Puestos de atención simultáneos (1–100).' },
      { name: 'capacidad_diaria', type: 'integer', desc: 'Tope diario de turnos (0 = sin tope extra).' },
      { name: 'dias_anticipacion_maxima', type: 'integer', desc: 'Con cuántos días de anticipación se puede reservar (0–365).' },
    ],
    bodyExample: { nombre: 'Atención al cliente', descripcion: 'Trámites generales' }, response: COLA, errors: [401, 403, 409, 422],
  },
  {
    id: 'colas-listar', group: 'Colas', method: 'GET', path: '/colas', title: 'Listar colas', auth: 'actor', status: 200,
    summary: 'Las colas de la cuenta. Sin filtro también devuelve las eliminadas (archivadas), marcadas con `activa: false`.',
    query: [{ name: 'activa', type: 'boolean', desc: '`true`: solo activas · `false`: solo archivadas.' }], response: [COLA], errors: [401, 403],
  },
  {
    id: 'colas-limite', group: 'Colas', method: 'GET', path: '/colas/limite', title: 'Límite de colas', auth: 'actor', status: 200,
    summary: 'Cuántas colas puede tener la cuenta y cuántas le quedan. Úsalo para no descubrir el tope chocando con un 409.',
    response: { propietario_tipo: 'empresa', limite: 10, activas: 3, disponibles: 7 }, errors: [401, 403],
  },
  { id: 'colas-obtener', group: 'Colas', method: 'GET', path: '/colas/{cola_id}', title: 'Obtener cola', auth: 'actor', status: 200, summary: 'Devuelve una cola por su id.', pathParams: [ID_COLA], response: COLA, errors: [401, 403, 404] },
  {
    id: 'colas-actualizar', group: 'Colas', method: 'PATCH', path: '/colas/{cola_id}', title: 'Actualizar cola', auth: 'actor', status: 200,
    summary: 'Cambia los datos básicos de la cola. El horario se cambia aparte, con PUT /colas/{cola_id}/horario.', pathParams: [ID_COLA],
    body: [{ name: 'nombre', type: 'string', desc: 'Nombre nuevo (1–120).' }, { name: 'descripcion', type: 'string', desc: 'Descripción nueva.' }, { name: 'activa', type: 'boolean', desc: 'Activa o archiva la cola.' }],
    bodyExample: { nombre: 'Atención preferente' }, response: { ...COLA, nombre: 'Atención preferente' }, errors: [401, 403, 404, 409, 422],
  },
  {
    id: 'colas-eliminar', group: 'Colas', method: 'DELETE', path: '/colas/{cola_id}', title: 'Eliminar cola', auth: 'actor', status: 204,
    summary: 'Archiva la cola (`activa: false`) sin borrar su historial de turnos, y libera un lugar contra el límite de colas.', pathParams: [ID_COLA], responseNote: 'Sin contenido.', errors: [401, 403, 404],
  },
  {
    id: 'colas-estado', group: 'Colas', method: 'GET', path: '/colas/{cola_id}/estado', title: 'Estado de la cola', auth: 'actor', status: 200,
    summary: 'Cuántos turnos esperan y cuántos se están atendiendo. No incluye cupos: eso vive en GET /colas/{cola_id}/franjas.', pathParams: [ID_COLA],
    response: { cola_id: UUID, turnos_en_espera: 4, turnos_atendiendo: 2 }, errors: [401, 403, 404],
  },

  // ───── Horarios y franjas
  { id: 'horario-obtener', group: 'Horarios y franjas', method: 'GET', path: '/colas/{cola_id}/horario', title: 'Obtener horario', auth: 'actor', status: 200, summary: 'Horario de atención de la cola, más `franjas_por_dia`, `cupos_por_franja` y `turnos_por_dia`, que Qhub calcula por ti.', pathParams: [ID_COLA], response: HORARIO, errors: [401, 403, 404] },
  {
    id: 'horario-definir', group: 'Horarios y franjas', method: 'PUT', path: '/colas/{cola_id}/horario', title: 'Definir horario', auth: 'actor', status: 200,
    summary: 'Define el horario y las franjas de la cola. Reemplaza el bloque completo (PUT), porque la franja, el rango y el cupo diario se validan entre sí.',
    notes: ['Los turnos ya creados no se mueven: si recortas el horario, los que queden fuera conservan su franja original.', 'Cupos por franja = `floor(duracion_franja_minutos / duracion_turno_minutos) × puestos`.'],
    pathParams: [ID_COLA],
    body: [
      { name: 'hora_apertura', type: 'time', required: true, desc: 'Apertura, `HH:MM:SS`.' }, { name: 'hora_cierre', type: 'time', required: true, desc: 'Cierre, `HH:MM:SS`.' },
      { name: 'duracion_franja_minutos', type: 'integer', required: true, desc: 'Duración de cada franja.' }, { name: 'dias_atencion', type: 'integer[]', required: true, desc: 'ISO: 1 = lunes … 7 = domingo.' },
      { name: 'duracion_turno_minutos', type: 'integer', required: true, desc: 'Duración de cada trámite.' }, { name: 'dias_anticipacion_maxima', type: 'integer', required: true, desc: 'Anticipación máxima de reserva, en días.' },
      { name: 'puestos', type: 'integer', desc: 'Puestos simultáneos. Por defecto 1.' }, { name: 'capacidad_diaria', type: 'integer', desc: 'Tope diario. Por defecto 0.' },
      { name: 'zona_horaria', type: 'string', desc: 'Zona IANA, p. ej. `America/Guayaquil`.' },
    ],
    bodyExample: { hora_apertura: '08:00:00', hora_cierre: '17:00:00', duracion_franja_minutos: 60, dias_atencion: [1, 2, 3, 4, 5], duracion_turno_minutos: 15, puestos: 2, dias_anticipacion_maxima: 14, zona_horaria: 'America/Guayaquil' },
    response: HORARIO, errors: [401, 403, 404, 422],
  },
  {
    id: 'franjas', group: 'Horarios y franjas', method: 'GET', path: '/colas/{cola_id}/franjas', title: 'Listar franjas', auth: 'actor', status: 200,
    summary: 'El calendario de la cola para un día: cada franja con sus cupos, cuántos están ocupados y cuántos quedan. Lista vacía si la fecha no es día de atención.',
    notes: ['`ocupados` cuenta los turnos que consumieron cupo: todos menos los cancelados y los no-show.'],
    pathParams: [ID_COLA], query: [{ name: 'fecha', type: 'date', desc: 'Día a consultar, `YYYY-MM-DD`.' }],
    response: [{ inicio: '2026-11-20T13:00:00Z', fin: '2026-11-20T14:00:00Z', cupos: 8, ocupados: 5, disponibles: 3 }], errors: [401, 403, 404],
  },

  // ───── Turnos
  {
    id: 'turnos-crear', group: 'Turnos', method: 'POST', path: '/turnos', title: 'Sacar turno', auth: 'actor', roles: 'cliente', status: 201,
    summary: 'Saca un turno, en vivo o programado para una franja futura. La numeración, la franja y los cupos se resuelven en una sola transacción: no hay números repetidos ni franjas sobrevendidas.',
    body: [{ name: 'cola_id', type: 'uuid', required: true, desc: 'Cola en la que sacas el turno.' }, { name: 'franja_inicio', type: 'date-time', desc: 'Inicio de la franja (ISO 8601). Si lo omites, el turno es en vivo.' }],
    bodyExample: { cola_id: UUID, franja_inicio: '2026-11-20T14:00:00Z' }, response: TURNO, errors: [401, 403, 404, 409, 422],
  },
  {
    id: 'turnos-listar', group: 'Turnos', method: 'GET', path: '/turnos', title: 'Listar turnos', auth: 'actor', status: 200,
    summary: 'Turnos de las colas de la cuenta, con filtros y paginación.',
    query: [{ name: 'cola_id', type: 'uuid', desc: 'Solo turnos de esta cola.' }, { name: 'estado', type: 'string', desc: '`en_espera`, `atendiendo`, `finalizado`, `cancelado` o `no_show`.' }, { name: 'fecha', type: 'date', desc: 'Fecha local de la franja, `YYYY-MM-DD`.' }, ...PAGE],
    response: [TURNO], errors: [401, 403],
  },
  { id: 'turnos-mios', group: 'Turnos', method: 'GET', path: '/turnos/mios', title: 'Mis turnos', auth: 'actor', roles: 'cliente', status: 200, summary: 'Los turnos de la persona que hace la petición (`X-Usuario-Id`).', query: PAGE, response: [TURNO], errors: [401, 403] },
  { id: 'turnos-obtener', group: 'Turnos', method: 'GET', path: '/turnos/{turno_id}', title: 'Obtener turno', auth: 'actor', status: 200, summary: 'Devuelve un turno por su id, con su posición actual en la fila.', pathParams: [ID_TURNO], response: TURNO, errors: [401, 403, 404] },
  { id: 'turnos-posponer', group: 'Turnos', method: 'PATCH', path: '/turnos/{turno_id}/posponer', title: 'Posponer turno', auth: 'actor', status: 200, summary: 'Manda el turno al final de su franja. No lo mueve a otra franja: para eso, cancélalo y saca uno nuevo.', pathParams: [ID_TURNO], response: { ...TURNO, posicion: 8 }, errors: [401, 403, 404, 409] },
  { id: 'turnos-cancelar', group: 'Turnos', method: 'PATCH', path: '/turnos/{turno_id}/cancelar', title: 'Cancelar turno', auth: 'actor', status: 200, summary: 'Cancela el turno y libera su cupo: otra persona puede tomar ese lugar.', pathParams: [ID_TURNO], response: { ...TURNO, estado: 'cancelado' }, errors: [401, 403, 404, 409] },
  { id: 'turnos-atender', group: 'Turnos', method: 'PATCH', path: '/turnos/{turno_id}/atender', title: 'Atender turno', auth: 'actor', roles: 'agente', status: 200, summary: 'Llama el turno y pasa a `atendiendo`. Genera el aviso al cliente.', notes: ['Requiere `X-Usuario-Rol: agente`.'], pathParams: [ID_TURNO], response: { ...TURNO, estado: 'atendiendo', hora_atencion: '2026-11-20T14:05:00Z', agente_id: 'agente-7' }, errors: [401, 403, 404, 409] },
  { id: 'turnos-finalizar', group: 'Turnos', method: 'PATCH', path: '/turnos/{turno_id}/finalizar', title: 'Finalizar turno', auth: 'actor', roles: 'agente', status: 200, summary: 'Cierra la atención del turno (`finalizado`).', notes: ['Requiere `X-Usuario-Rol: agente`.'], pathParams: [ID_TURNO], response: { ...TURNO, estado: 'finalizado', hora_finalizacion: '2026-11-20T14:19:00Z' }, errors: [401, 403, 404, 409] },
  { id: 'turnos-no-show', group: 'Turnos', method: 'PATCH', path: '/turnos/{turno_id}/no-show', title: 'Marcar no-show', auth: 'actor', roles: 'agente', status: 200, summary: 'Marca que la persona no se presentó. También libera el cupo de la franja.', notes: ['Requiere `X-Usuario-Rol: agente`.'], pathParams: [ID_TURNO], response: { ...TURNO, estado: 'no_show' }, errors: [401, 403, 404, 409] },

  // ───── Notificaciones
  { id: 'noti-listar', group: 'Notificaciones', method: 'GET', path: '/notificaciones', title: 'Listar notificaciones', auth: 'actor', status: 200, summary: 'Los avisos de la persona que hace la petición (`X-Usuario-Id`), del más nuevo al más viejo.', query: PAGE, response: [NOTI], errors: [401, 403] },
  { id: 'noti-leida', group: 'Notificaciones', method: 'PATCH', path: '/notificaciones/{notificacion_id}/leida', title: 'Marcar como leída', auth: 'actor', status: 200, summary: 'Marca una notificación como leída.', pathParams: [{ name: 'notificacion_id', type: 'uuid', required: true, desc: 'Identificador de la notificación.' }], response: { ...NOTI, leida: true }, errors: [401, 403, 404] },
  { id: 'noti-eliminar', group: 'Notificaciones', method: 'DELETE', path: '/notificaciones/{notificacion_id}', title: 'Eliminar notificación', auth: 'actor', status: 204, summary: 'Elimina una notificación.', pathParams: [{ name: 'notificacion_id', type: 'uuid', required: true, desc: 'Identificador de la notificación.' }], responseNote: 'Sin contenido.', errors: [401, 403, 404] },

  // ───── Sistema
  { id: 'salud', group: 'Sistema', method: 'GET', path: '/', title: 'Salud (liveness)', auth: 'none', status: 200, summary: 'El proceso está vivo. No consulta dependencias.', responseNote: 'Responde 200; el cuerpo no tiene un formato fijo.' },
  { id: 'listo', group: 'Sistema', method: 'GET', path: '/listo', title: 'Disponibilidad (readiness)', auth: 'none', status: 200, summary: 'La API puede atender de verdad: la base de datos responde y, si hay broker configurado, también la mensajería. Responde 503 si no.', response: { supabase: 'ok', rabbitmq: 'ok' }, errors: [503] },
];

export const ERRORS: Array<{ status: number; name: string; desc: string }> = [
  { status: 400, name: 'Solicitud no válida', desc: 'La petición está mal formada.' },
  { status: 401, name: 'No autenticado', desc: 'Falta el token, es inválido o venció. Vuelve a iniciar sesión.' },
  { status: 403, name: 'Sin permiso', desc: 'Tu rol (`X-Usuario-Rol`) no puede hacer esta acción, o el recurso es de otra cuenta.' },
  { status: 404, name: 'No encontrado', desc: 'El recurso no existe o no es tuyo.' },
  { status: 409, name: 'Conflicto', desc: 'La acción choca con el estado actual: límite de colas, franja llena, turno ya atendido, usuario o correo repetido…' },
  { status: 422, name: 'Validación', desc: 'Algún campo no cumple el formato. El detalle indica cuál en `detail[].loc`.' },
  { status: 429, name: 'Demasiadas solicitudes', desc: 'Espera un momento y reintenta.' },
  { status: 503, name: 'No disponible', desc: 'Una dependencia no responde. Reintenta con espera creciente.' },
];

export const STATUS_TEXT: Record<number, string> = { 200: 'OK', 201: 'Creado', 204: 'Sin contenido', 400: 'Solicitud no válida', 401: 'No autenticado', 403: 'Sin permiso', 404: 'No encontrado', 409: 'Conflicto', 422: 'Validación', 429: 'Demasiadas solicitudes', 503: 'No disponible' };
