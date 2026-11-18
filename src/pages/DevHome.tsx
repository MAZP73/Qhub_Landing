import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, PLATFORM_URL, WS_BASE } from '@/lib/config';
import { apiKeyIssue, apiKeyRevoke, apiKeyStatus, type ApiKeyState } from '@/lib/api';
import { sessionStore, type DevSession } from '@/lib/session';
import { CodeBlock, CopyButton } from '@/components/CodeBlock';
import { Button, ButtonLink, Icon, Notice, SelectField, TextField } from '@/components/ui';
import { buildSamples } from '@/docs/samples';
import { ENDPOINTS } from '@/docs/spec';

function useCountdown(until: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return Math.max(0, Math.floor((until - now) / 1000));
}
const fmt = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h ? `${h} h ` : ''}${m} min ${String(x).padStart(2, '0')} s`; };

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }) : null);

/** La API key permanente: no vence. Se muestra una sola vez al emitirla y para emitirla hay que confirmar la contraseña. */
function ApiKeyCard({ s }: { s: DevSession }) {
  const [state, setState] = useState<ApiKeyState | null | 'unavailable'>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  async function load() {
    const r = await apiKeyStatus(s.token);
    if (r.ok) setState(r.value); else if (r.status === 401) sessionStore.clear(); else setState('unavailable');
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function issue() {
    if (!pw) { setError('Escribe tu contraseña para confirmar.'); return; }
    setBusy(true); setError(null);
    const r = await apiKeyIssue(s.token, s.identifier, pw);
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    setFresh(r.value.api_key); setAsking(false); setPw(''); setState({ activa: true, creada_en: r.value.creada_en });
  }
  async function revoke() {
    setBusy(true); setError(null);
    const r = await apiKeyRevoke(s.token);
    setBusy(false); setConfirmRevoke(false);
    if (!r.ok) { setError(r.message); return; }
    setFresh(null); setState({ activa: false, creada_en: null });
  }

  const active = state !== null && state !== 'unavailable' && state.activa;
  return (
    <section aria-labelledby="ak" className="border border-border-subtle bg-layer-01 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="ak" className="t-h3 m-0">Tu API key</h2><p className="m-0 mt-1 max-w-[62ch] text-text-secondary">Llave permanente de tu cuenta: <b>no vence</b>. Tu sistema la manda en cada petición (<code className="t-code-sm">Authorization: Bearer &lt;API key&gt;</code> o <code className="t-code-sm">X-Api-Key</code>) y accede a toda la API, sin pedir tokens.</p></div>
        {state && state !== 'unavailable' && <span className={`t-label inline-flex items-center gap-1 px-2 py-1 ${active ? 'bg-state-serving text-text-on-accent' : 'bg-layer-02 text-text-secondary'}`}><Icon name={active ? 'check' : 'info'} size={14} />{active ? 'Activa' : 'Sin generar'}</span>}
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {state === null && <p className="m-0 text-text-secondary">Consultando…</p>}
        {state === 'unavailable' && <Notice kind="warning" title="La API key aún no está disponible en el servidor">Mientras tanto puedes usar el token temporal de abajo.</Notice>}
        {fresh && (
          <div className="flex flex-col gap-3">
            <Notice kind="success" title="Tu API key está lista. Cópiala ahora">No volverás a verla: por seguridad solo guardamos su huella. Si la pierdes, genera una nueva y la anterior deja de valer.</Notice>
            <div className="flex items-stretch border border-border-strong bg-layer-02"><code className="t-code-sm min-w-0 flex-1 overflow-x-auto whitespace-nowrap p-3" aria-label="API key">{fresh}</code><CopyButton text={fresh} className="!px-4 !text-link hover:!bg-layer-hover hover:!text-link" /></div>
          </div>
        )}
        {state && state !== 'unavailable' && active && !fresh && <p className="m-0 text-text-secondary">Generada el {fmtDate(state.creada_en) ?? 'una fecha anterior'}. Por seguridad no se puede volver a mostrar.</p>}
        {error && <Notice kind="error" title={error} />}
        {asking && (
          <form className="flex flex-col gap-3 border border-border-subtle bg-layer-02 p-4" onSubmit={(e) => { e.preventDefault(); void issue(); }}>
            <p className="m-0 text-text-secondary">{active ? 'Generar una nueva API key reemplaza la actual: la anterior deja de funcionar.' : 'Para generar tu API key, confirma tu contraseña.'}</p>
            <TextField label="Contraseña" type="password" revealable value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
            <div className="flex gap-2"><Button type="submit" loading={busy}>{active ? 'Reemplazar API key' : 'Generar API key'}</Button><Button kind="ghost" onClick={() => { setAsking(false); setPw(''); setError(null); }}>Cancelar</Button></div>
          </form>
        )}
        {confirmRevoke && (
          <div className="flex flex-col gap-3 border border-border-subtle bg-layer-02 p-4">
            <p className="m-0 text-text-secondary">Los sistemas que usen esta API key dejarán de funcionar de inmediato. ¿Revocarla?</p>
            <div className="flex gap-2"><Button kind="danger" loading={busy} onClick={() => void revoke()}>Sí, revocar</Button><Button kind="ghost" onClick={() => setConfirmRevoke(false)}>Cancelar</Button></div>
          </div>
        )}
        {state && state !== 'unavailable' && !asking && !confirmRevoke && (
          <div className="flex flex-wrap gap-2">
            <Button icon="plus" onClick={() => { setAsking(true); setError(null); }}>{active ? 'Rotar API key' : 'Generar API key'}</Button>
            {active && <Button kind="tertiary" icon="trash" onClick={() => { setConfirmRevoke(true); setError(null); }}>Revocar</Button>}
          </div>
        )}
      </div>
    </section>
  );
}

function Credential({ s }: { s: DevSession }) {
  const [reveal, setReveal] = useState(false);
  const left = useCountdown(s.expiresAt);
  const masked = `${s.token.slice(0, 10)}${'•'.repeat(24)}${s.token.slice(-6)}`;
  return (
    <section aria-labelledby="tok" className="border border-border-subtle bg-layer-01 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="tok" className="t-h3 m-0">Token de sesión (temporal)</h2><p className="m-0 mt-1 text-text-secondary">Es la credencial de tu sesión: la usan este panel y el probador. Dura poco. Para tu sistema usa tu API key.</p></div>
        <span className={left < 300 ? 't-label inline-flex items-center gap-1 bg-state-waiting px-2 py-1 text-text-on-accent' : 't-label inline-flex items-center gap-1 bg-layer-02 px-2 py-1 text-text-secondary'}><Icon name="clock" size={14} />Vence en {fmt(left)}</span>
      </div>
      <div className="mt-4 flex items-stretch border border-border-subtle bg-layer-02">
        <code className="t-code-sm min-w-0 flex-1 overflow-x-auto whitespace-nowrap p-3" aria-label="Token">{reveal ? s.token : masked}</code>
        <button type="button" onClick={() => setReveal((v) => !v)} aria-pressed={reveal} className="cursor-pointer border-0 border-l border-border-subtle bg-transparent px-3 text-link hover:bg-layer-hover">{reveal ? 'Ocultar' : 'Mostrar'}</button>
        <CopyButton text={s.token} className="!px-4 !text-link hover:!bg-layer-hover hover:!text-link" />
      </div>
      <Notice kind="warning" title="Trátalo como una contraseña">No lo pongas en código que ejecuten tus clientes ni lo subas a un repositorio.</Notice>
    </section>
  );
}

function Quick({ s }: { s: DevSession }) {
  const ep = ENDPOINTS.find((e) => e.id === 'colas-limite')!;
  return (
    <section aria-labelledby="pr" className="flex flex-col gap-3">
      <h2 id="pr" className="t-h3 m-0">Haz tu primera llamada</h2>
      <p className="m-0 text-text-secondary">Este ejemplo ya lleva el token de tu sesión. Con tu API key la llamada es igual: solo cambia la credencial.</p>
      <CodeBlock samples={buildSamples(ep, { token: s.token, userId: s.userId, role: s.role })} title="GET /colas/limite" />
    </section>
  );
}

export function DevHome({ s }: { s: DevSession }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="t-label m-0 uppercase text-text-secondary">Panel de desarrollador</p>
        <h1 className="t-h1 m-0 mt-1">Hola, {s.identifier}</h1>
        <p className="t-body-long m-0 mt-2 max-w-[70ch] text-text-secondary">Aquí generas tu API key, ves tu token de sesión, los datos de conexión y la documentación de la API de Qhub.</p>
      </div>
      <ApiKeyCard s={s} />
      <Credential s={s} />
      <section aria-labelledby="co" className="grid grid-cols-1 gap-6 border border-border-subtle bg-layer-01 p-6 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="lg:col-span-2"><h2 id="co" className="t-h3 m-0">Datos de conexión</h2></div>
        {([['URL base (HTTP)', API_BASE], ['URL base (WebSocket)', WS_BASE]] as const).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1"><span className="t-label text-text-secondary">{k}</span>
            <div className="flex items-center justify-between border border-border-subtle bg-layer-02"><code className="t-code-sm min-w-0 flex-1 overflow-x-auto whitespace-nowrap p-3">{v}</code><CopyButton text={v} className="!text-link hover:!bg-layer-hover hover:!text-link" /></div></div>
        ))}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <p className="m-0 text-text-secondary">Valores que se usan en los ejemplos y en el probador como <code className="t-code-sm">X-Usuario-Id</code> y <code className="t-code-sm">X-Usuario-Rol</code>. Cámbialos si quieres actuar como otra persona de tu sistema.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="X-Usuario-Id" value={s.userId} onChange={(e) => sessionStore.update({ userId: e.target.value })} />
            <SelectField label="X-Usuario-Rol" value={s.role} onChange={(e) => sessionStore.update({ role: e.target.value as DevSession['role'] })}>
              <option value="admin">admin</option><option value="agente">agente</option><option value="cliente">cliente</option>
            </SelectField>
          </div>
        </div>
      </section>
      <Quick s={s} />
      <section aria-labelledby="sg" className="flex flex-col gap-3">
        <h2 id="sg" className="t-h3 m-0">Siguientes pasos</h2>
        <div className="grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
          {([['Inicio rápido', 'Tu primer turno en cuatro pasos.', '/dev/docs/inicio-rapido', 'play'], ['Autenticación', 'Token, usuario y roles.', '/dev/docs/autenticacion', 'user'], ['Referencia', 'Cada endpoint con ejemplos.', '/dev/docs/registro', 'code'], ['Tiempo real', 'Eventos por WebSocket.', '/dev/docs/tiempo-real', 'live']] as const).map(([t, d, to, ic]) => (
            <Link key={to} to={to} className="flex flex-col gap-2 bg-layer-01 p-5 text-text-primary no-underline hover:bg-layer-hover"><span className="text-interactive"><Icon name={ic} size={20} /></span><span className="t-h4">{t}</span><span className="text-text-secondary">{d}</span></Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2"><ButtonLink to="/dev/probar" kind="secondary" icon="play">Abrir el probador</ButtonLink>
          <span className="t-caption text-text-secondary">¿Buscas la plataforma? <a href={`${PLATFORM_URL}/`}>Ir a la plataforma de Qhub</a> (cuenta distinta).</span></div>
      </section>
      <div><Button kind="ghost" icon="logout" onClick={() => sessionStore.clear()}>Cerrar sesión</Button></div>
    </div>
  );
}
