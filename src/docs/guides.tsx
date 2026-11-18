import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, WS_BASE } from '@/lib/config';
import { CodeBlock } from '@/components/CodeBlock';
import { Notice } from '@/components/ui';
import { ERRORS } from './spec';
import { Md } from './ctx';
import { guideSamples } from './samples';
import { CLIENTS } from './clients';

export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => <h2 id={id} className="t-h3 mb-3 mt-10 scroll-mt-20 border-t border-border-subtle pt-8 font-semibold first:mt-0 first:border-0 first:pt-0">{children}</h2>;
export const P = ({ children }: { children: ReactNode }) => <p className="t-body-long my-3 max-w-[70ch] text-text-secondary">{children}</p>;
export const Code = ({ children }: { children: ReactNode }) => <code className="t-code-sm rounded-sm bg-layer-02 px-1 py-0.5 text-text-primary">{children}</code>;
const Li = ({ children }: { children: ReactNode }) => <li className="my-1">{children}</li>;
const UL = ({ children }: { children: ReactNode }) => <ul className="t-body-long my-3 max-w-[70ch] list-disc pl-6 text-text-secondary">{children}</ul>;
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-4 overflow-x-auto border border-border-subtle">
      <table className="w-full border-collapse text-left">
        <thead className="bg-layer-02"><tr>{head.map((h) => <th key={h} className="t-label border-b border-border-subtle px-4 py-3 font-medium text-text-secondary">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border-subtle last:border-0">{r.map((c, j) => <td key={j} className="px-4 py-3 align-top">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export interface Guide { id: string; title: string; lead: string; render: () => ReactNode }

export const GUIDES: Guide[] = [
  {
    id: 'introduccion', title: 'Introducción', lead: 'La API de Qhub te permite gestionar colas y turnos desde tu propio sistema.',
    render: () => (
      <>
        <P>Qhub es una API REST que habla JSON. Con ella creas colas, defines horarios y franjas, sacas y administras turnos, y recibes avisos en tiempo real, sin usar la plataforma web ni la app móvil.</P>
        <H2>URL base</H2>
        <CodeBlock samples={[{ lang: 'http', code: API_BASE }]} title="URL base" />
        <P>Todas las rutas de esta documentación son relativas a esa URL. La API responde siempre en JSON (salvo las respuestas <Code>204</Code>, que no tienen contenido).</P>
        <H2>Qué puedes hacer</H2>
        <UL>
          <Li><b>Colas y horarios:</b> crea colas y define apertura, cierre, días, franjas y puestos.</Li>
          <Li><b>Turnos:</b> saca turnos en vivo o programados, y llámalos, atiéndelos, finalízalos o márcalos como no-show.</Li>
          <Li><b>Notificaciones:</b> consulta los avisos de cada persona.</Li>
          <Li><b>Tiempo real:</b> escucha los cambios de una cola por WebSocket.</Li>
        </UL>
        <H2>Siguientes pasos</H2>
        <UL>
          <Li><Link to="/dev/docs/inicio-rapido">Inicio rápido</Link>: tu primer turno en cuatro pasos.</Li>
          <Li><Link to="/dev/docs/autenticacion">Autenticación</Link>: cómo funcionan el token y los headers.</Li>
          <Li><Link to="/dev/docs/registro">Referencia de la API</Link>: cada endpoint con ejemplos.</Li>
        </UL>
      </>
    ),
  },
  {
    id: 'inicio-rapido', title: 'Inicio rápido', lead: 'De cero a tu primer turno en cuatro pasos.',
    render: () => (
      <>
        <P>Necesitas una cuenta de API (créala desde <Link to="/acceso?tipo=dev&modo=registro">aquí</Link>). Elige tu lenguaje en las pestañas de cualquier ejemplo: la elección se aplica a toda la documentación. Tu API key va directo en cada petición. Para dejar todo bien configurado (variables de entorno y un cliente reutilizable), mira la guía <Link to="/dev/docs/configuracion">Configuración</Link>.</P>
        <H2>1. Genera tu API key</H2>
        <P>Inicia sesión en tu <Link to="/dev">panel</Link> y pulsa «Generar API key». Cópiala (se muestra una sola vez) y guárdala en una variable de entorno:</P>
        <CodeBlock samples={[{ lang: 'curl', code: 'export QHUB_API_KEY="pega-aquí-tu-api-key"' }]} title="Terminal" />
        <H2>2. Crea una cola</H2>
        <CodeBlock samples={guideSamples('POST', '/colas', { userId: 'admin-1', role: 'admin', body: { nombre: 'Atención al cliente' } })} />
        <H2>3. Define su horario</H2>
        <CodeBlock samples={guideSamples('PUT', '/colas/<cola_id>/horario', { userId: 'admin-1', role: 'admin', body: { hora_apertura: '08:00:00', hora_cierre: '17:00:00', duracion_franja_minutos: 60, dias_atencion: [1, 2, 3, 4, 5], duracion_turno_minutos: 15, dias_anticipacion_maxima: 14, zona_horaria: 'America/Guayaquil' } })} />
        <H2>4. Saca un turno</H2>
        <CodeBlock samples={guideSamples('POST', '/turnos', { userId: 'cliente-123', role: 'cliente', body: { cola_id: '<cola_id>' } })} />
        <Notice kind="info" title="¿Prefieres probar sin escribir código?">En tu <Link to="/dev/probar">probador</Link> puedes llamar a cualquier endpoint desde el navegador con tu sesión ya puesta.</Notice>
      </>
    ),
  },
  {
    id: 'configuracion', title: 'Configuración', lead: 'Deja tu proyecto listo para hablar con Qhub: variables de entorno, URL base, headers y un cliente reutilizable.',
    render: () => (
      <>
        <P>Todo lo que tu sistema necesita para integrarse son <b>tres datos</b>. Guárdalos como configuración (variables de entorno), no escritos en el código:</P>
        <Table head={['Variable', 'Qué es', 'Valor']} rows={[
          [<Code key="1">QHUB_API_KEY</Code>, <>Tu API key permanente. La generas en tu <Link to="/dev">panel</Link>.</>, 'Obligatoria. Secreta.'],
          [<Code key="2">QHUB_API_URL</Code>, 'URL base de la API.', <Code key="u">{API_BASE}</Code>],
          [<><Code>X-Usuario-Id</Code> y <Code>X-Usuario-Rol</Code></>, 'Quién actúa en tu sistema y con qué rol. Cambian en cada petición.', <>Los pone tu código. Ver <Link to="/dev/docs/autenticacion#headers">Usuario y rol</Link>.</>],
        ]} />
        <H2>1. Define las variables de entorno</H2>
        <Table head={['Dónde', 'Cómo']} rows={[
          ['Linux / macOS (terminal)', <Code key="1">export QHUB_API_KEY="tu-api-key"</Code>],
          ['Windows (PowerShell)', <Code key="2">setx QHUB_API_KEY "tu-api-key"</Code>],
          ['Archivo .env', <>Una línea por variable (ver abajo). Añade <Code>.env</Code> a tu <Code>.gitignore</Code>.</>],
          ['Docker / Compose', <><Code>environment:</Code> o <Code>--env-file .env</Code></>],
          ['Hosting (Vercel, Render, Railway…)', 'Sección «Environment Variables» del proyecto. Vuelve a desplegar después de cambiarlas.'],
        ]} />
        <CodeBlock samples={[{ lang: 'http', code: `# .env  (no lo subas a git)\nQHUB_API_KEY=pega-aquí-tu-api-key\nQHUB_API_URL=${API_BASE}` }]} title=".env" />
        <Notice kind="warning" title="La API key es secreta">Úsala solo desde tu servidor o backend. Nunca la pongas en una app móvil, en JavaScript de una página ni en un repositorio público. Si se filtra, rótala o revócala desde tu panel.</Notice>
        <H2>2. Prepara un cliente reutilizable</H2>
        <P>Este archivo lee la configuración del entorno, añade los headers por ti y lanza un error claro cuando la API responde 4xx o 5xx. Elige tu lenguaje y cópialo a tu proyecto; después solo llamas a <Code>qhub(...)</Code>.</P>
        <CodeBlock samples={CLIENTS} title="Cliente reutilizable" />
        <H2>3. Ajustes que conviene dejar puestos</H2>
        <UL>
          <Li><b>Timeout de 60 segundos.</b> Si la API estuvo inactiva puede tardar en responder la primera vez. Ya viene en los clientes de arriba.</Li>
          <Li><b>Reintentos solo en 429 y 5xx</b>, con espera creciente. Los 4xx son errores de tu petición: repetirlos no los arregla.</Li>
          <Li><b>Zona horaria.</b> Se define por cola con <Code>PUT /colas/{'{cola_id}'}/horario</Code> (por ejemplo <Code>America/Guayaquil</Code>). Las fechas de la API vienen en UTC.</Li>
          <Li><b>Identidad.</b> Usa un <Code>X-Usuario-Id</Code> estable por persona (tu id de usuario o su correo) para que sus turnos y avisos queden asociados.</Li>
          <Li><b>Entornos.</b> Usa una API key distinta para pruebas y para producción, y cámbiala solo con la variable de entorno.</Li>
        </UL>
        <H2>4. Comprueba que funciona</H2>
        <P>Con las variables definidas, esta llamada debe devolver <Code>200</Code> y la lista de tus colas (vacía si aún no creaste ninguna):</P>
        <CodeBlock samples={guideSamples('GET', '/colas', { userId: 'admin-1', role: 'admin' })} title="Probar la conexión" />
        <Notice kind="info" title="Errores comunes">
          <Code>401</Code>: la API key falta, está mal copiada o fue revocada. <Code>403</Code>: el rol de <Code>X-Usuario-Rol</Code> no permite esa acción. <Code>422</Code>: algún dato del cuerpo no cumple el formato. Más en <Link to="/dev/docs/errores">Errores</Link>.
        </Notice>
      </>
    ),
  },
  {
    id: 'autenticacion', title: 'Autenticación', lead: 'Cómo identificarte ante la API: tu API key, el usuario y el rol.',
    render: () => (
      <>
        <H2 id="credenciales">Tu API key</H2>
        <P>Tu credencial es la <b>API key</b> de tu cuenta: una llave que <b>no vence</b> y que mandas directamente en cada petición. Se genera una vez en tu <Link to="/dev">panel</Link> (inicias sesión y confirmas tu contraseña; se muestra una sola vez). No hay que pedir tokens.</P>
        <CodeBlock samples={guideSamples('GET', '/colas', { userId: 'admin-1', role: 'admin' })} title="Llamar a la API con tu API key" />
        <P>También vale el header <Code>X-Api-Key: &lt;API key&gt;</Code> en lugar de <Code>Authorization: Bearer</Code>. Funciona igual en los endpoints REST y en el WebSocket.</P>
        <Notice kind="warning" title="Cuida tu API key">Equivale a una contraseña que no caduca: guárdala en una variable de entorno o gestor de secretos y úsala solo desde tu servidor, nunca en el código ni en apps o páginas que ejecuten tus clientes. Si se filtra, rótala o revócala desde el panel: deja de funcionar de inmediato.</Notice>
        <H2 id="token">Token de sesión (opcional)</H2>
        <P>Si prefieres una credencial de corta duración (por ejemplo, para usarla desde un navegador), cámbiala por un token con <Code>POST /auth/token</Code>, enviando tu API key en <Code>X-Api-Key</Code> o tu usuario y contraseña. El <Code>access_token</Code> se usa igual: <Code>Authorization: Bearer &lt;access_token&gt;</Code>.</P>
        <CodeBlock samples={[{ lang: 'curl', code: `curl -X POST "${API_BASE}/auth/token" \\\n  -H "X-Api-Key: $QHUB_API_KEY"` }]} title="Cambiar la API key por un token" />
        <Notice kind="info" title="Los tokens vencen">Dura poco (el campo <Code>expires_in</Code> dice cuántos segundos) y no se renueva: al vencer la API responde 401 y pides otro. Tu panel muestra el token de tu sesión, listo para copiar.</Notice>
        <H2 id="headers">Usuario y rol</H2>
        <P>Qhub no gestiona los usuarios finales de tu sistema: tú los identificas. Los endpoints de negocio piden dos headers además de tu credencial:</P>
        <Table head={['Header', 'Qué es']} rows={[
          [<Code key="a">X-Usuario-Id</Code>, 'Identificador de la persona que actúa en tu sistema (el que tú quieras: un id, un correo…). Los turnos y notificaciones se asocian a él.'],
          [<Code key="b">X-Usuario-Rol</Code>, <>Su rol: <Code>admin</Code>, <Code>agente</Code> o <Code>cliente</Code>.</>],
        ]} />
        <Table head={['Rol', 'Para qué']} rows={[
          [<Code key="1">cliente</Code>, 'Quien saca turnos: crea, consulta, pospone y cancela los suyos.'],
          [<Code key="2">agente</Code>, 'Quien atiende: llama (atender), finaliza y marca no-show. Estas tres acciones exigen este rol.'],
          [<Code key="3">admin</Code>, 'Quien administra: crea y configura colas, horarios y consulta todos los turnos.'],
        ]} />
        <P>Los endpoints públicos (<Code>/auth/*</Code>, <Code>/</Code> y <Code>/listo</Code>) no llevan <Code>X-Usuario-Id</Code> ni <Code>X-Usuario-Rol</Code>.</P>
        <H2 id="api-key">Qué se acepta dónde</H2>
        <Table head={['Credencial', 'Dónde vale']} rows={[
          [<b key="1">API key</b>, 'En todos los endpoints de negocio y en el WebSocket. También en POST /auth/token para obtener un token.'],
          [<b key="2">Token de sesión</b>, 'En todos los endpoints de negocio, el WebSocket y la gestión de tu API key (generar, rotar, revocar).'],
          [<b key="3">Contraseña</b>, 'Solo en POST /auth/token y para confirmar la emisión de una API key. Nunca en el resto de endpoints.'],
        ]} />
      </>
    ),
  },
  {
    id: 'ciclo-de-turnos', title: 'Ciclo de un turno', lead: 'Los estados por los que pasa un turno y qué acción lo mueve.',
    render: () => (
      <>
        <Table head={['Estado', 'Significa', 'Cómo se llega']} rows={[
          [<Code key="a">en_espera</Code>, 'Está en la fila, esperando.', 'Al sacar el turno, o al posponerlo.'],
          [<Code key="b">atendiendo</Code>, 'Un agente lo llamó.', <Md key="b2">{'`PATCH /turnos/{id}/atender`'}</Md>],
          [<Code key="c">finalizado</Code>, 'La atención terminó.', <Md key="c2">{'`PATCH /turnos/{id}/finalizar`'}</Md>],
          [<Code key="d">cancelado</Code>, 'Se canceló. Libera el cupo.', <Md key="d2">{'`PATCH /turnos/{id}/cancelar`'}</Md>],
          [<Code key="e">no_show</Code>, 'La persona no se presentó. Libera el cupo.', <Md key="e2">{'`PATCH /turnos/{id}/no-show`'}</Md>],
        ]} />
        <P>Solo <Code>cancelado</Code> y <Code>no_show</Code> liberan el cupo de la franja. Un turno puede ser <b>en vivo</b> (sin <Code>franja_inicio</Code>) o <b>programado</b> para una franja futura (<Code>programado: true</Code>).</P>
        <Notice kind="info" title="Posponer">Manda el turno al final de su franja, no a otra. Para cambiar de franja: cancela y saca uno nuevo.</Notice>
      </>
    ),
  },
  {
    id: 'tiempo-real', title: 'Tiempo real (WebSocket)', lead: 'Recibe los cambios de una cola y los avisos de una persona sin consultar cada vez.',
    render: () => (
      <>
        <P>Además de HTTP, la API publica eventos por WebSocket. Hay dos canales:</P>
        <Table head={['Canal', 'Ruta', 'Qué envía']} rows={[
          ['Turnos de una cola', <Code key="1">/ws/turnos/{'{cola_id}'}</Code>, 'Cada cambio en los turnos de esa cola.'],
          ['Notificaciones', <Code key="2">/ws/notificaciones</Code>, 'Los avisos de la persona conectada.'],
        ]} />
        <H2>Conectarse</H2>
        <P>El navegador no permite headers en un WebSocket, así que la identidad va en el parámetro <Code>token</Code>, con el formato <Code>credencial:usuario_id:rol</Code>, donde la credencial es tu API key o un token de sesión:</P>
        <CodeBlock samples={[
          { lang: 'js', code: `const id = "cliente-123", rol = "cliente";\n// credencial: tu API key (o un token de sesión)\nconst ws = new WebSocket(\n  \`${WS_BASE}/ws/turnos/<cola_id>?token=\${encodeURIComponent(\`\${process.env.QHUB_API_KEY}:\${id}:\${rol}\`)}\`\n);\n\nws.onmessage = (e) => {\n  const msg = JSON.parse(e.data);\n  if (msg.tipo === "ping" || msg.tipo === "conectado") return; // control\n  console.log(msg.tipo, msg.payload);\n};` },
          { lang: 'python', code: `import asyncio, json, websockets\n\nasync def main():\n    url = f"${WS_BASE}/ws/turnos/<cola_id>?token={API_KEY}:cliente-123:cliente"  # tu API key o un token\n    async with websockets.connect(url) as ws:\n        async for raw in ws:\n            msg = json.loads(raw)\n            if msg.get("tipo") not in ("ping", "conectado"):\n                print(msg["tipo"], msg.get("payload"))\n\nasyncio.run(main())` },
        ]} />
        <H2>Eventos de una cola</H2>
        <CodeBlock samples={[{ lang: 'json', code: '{\n  "tipo": "turno_llamado",\n  "cola_id": "3f6c1b2e-8a54-4c0e-9d1a-5b7e2c9f4a10",\n  "payload": { "id": "9b1d7c42-…", "numero": 12, "estado": "atendiendo" }\n}' }]} title="Ejemplo de evento" />
        <Table head={['tipo', 'Cuándo ocurre']} rows={[
          [<Code key="1">turno_creado</Code>, 'Alguien sacó un turno.'], [<Code key="2">turno_llamado</Code>, 'Un agente llamó un turno.'], [<Code key="3">turno_pospuesto</Code>, 'Se pospuso un turno.'],
          [<Code key="4">turno_cancelado</Code>, 'Se canceló un turno.'], [<Code key="5">turno_no_show</Code>, 'Se marcó un no-show.'], [<Code key="6">cola_actualizada</Code>, 'Cambió la cola o su horario.'],
        ]} />
        <H2>Notificaciones</H2>
        <CodeBlock samples={[{ lang: 'json', code: '{\n  "tipo": "notificacion",\n  "notificacion": {\n    "id": "5a2e9c10-…",\n    "turno_id": "9b1d7c42-…",\n    "mensaje": "Es tu turno: pasa al puesto 2.",\n    "leida": false,\n    "tipo_aviso": "turno_llamado",\n    "creada_en": "2026-11-20T14:05:00Z"\n  }\n}' }]} title="Ejemplo de aviso" />
        <P>Los valores de <Code>tipo_aviso</Code> son <Code>turno_llamado</Code>, <Code>turno_pospuesto</Code>, <Code>turno_no_show</Code> y <Code>recordatorio</Code>.</P>
        <H2>Reconexión</H2>
        <P>El servidor envía mensajes de control (<Code>ping</Code>, <Code>conectado</Code>) que debes ignorar. Si se corta la conexión, reconecta con espera creciente (1 s, 2 s, 4 s…). Si el servidor cierra con el código <Code>4401</Code>, el token es inválido o la cola no es tuya: no reintentes, vuelve a iniciar sesión.</P>
      </>
    ),
  },
  {
    id: 'errores', title: 'Errores', lead: 'Cómo responde la API cuando algo falla.',
    render: () => (
      <>
        <P>Los errores usan códigos HTTP estándar y un cuerpo JSON con el campo <Code>detail</Code>:</P>
        <CodeBlock samples={[{ lang: 'json', code: '{ "detail": "Esa franja ya no tiene cupos." }' }]} title="Error con mensaje" />
        <CodeBlock samples={[{ lang: 'json', code: '{\n  "detail": [\n    { "loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error" }\n  ]\n}' }]} title="Error de validación (422)" />
        <Table head={['Código', 'Nombre', 'Qué hacer']} rows={ERRORS.map((e) => [<Code key={e.status}>{e.status}</Code>, e.name, <Md key={e.status + 'd'}>{e.desc}</Md>])} />
        <Notice kind="info" title="Reintentos">Reintenta solo los 429 y 5xx, con espera creciente. Los 4xx no se arreglan repitiendo la misma petición.</Notice>
      </>
    ),
  },
];
