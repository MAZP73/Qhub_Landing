import { useMemo, useState } from 'react';
import { API_BASE } from '@/lib/config';
import type { DevSession } from '@/lib/session';
import { CodeBlock } from '@/components/CodeBlock';
import { Button, Notice, TextField } from '@/components/ui';
import { buildSamples } from '@/docs/samples';
import { ENDPOINTS, GROUPS, type Endpoint } from '@/docs/spec';

interface Result { status: number; ms: number; body: string; network?: boolean }

export function Playground({ s }: { s: DevSession }) {
  const [id, setId] = useState('colas-listar');
  const ep = ENDPOINTS.find((e) => e.id === id)!;
  const [params, setParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [bodyErr, setBodyErr] = useState<string | null>(null);

  function pick(next: string) {
    const e = ENDPOINTS.find((x) => x.id === next)!;
    setId(next); setParams({}); setRes(null); setBodyErr(null);
    setBody(e.bodyExample ? JSON.stringify(e.bodyExample, null, 2) : '');
  }
  useMemo(() => { if (!body && ep.bodyExample) setBody(JSON.stringify(ep.bodyExample, null, 2)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pathNames = [...ep.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const query = ep.query ?? [];
  const needsAuth = ep.auth !== 'none';

  async function send() {
    setBodyErr(null);
    let payload: string | undefined;
    if (ep.body) {
      if (body.trim()) { try { payload = JSON.stringify(JSON.parse(body)); } catch { setBodyErr('El JSON del cuerpo no es válido.'); return; } }
    }
    const missing = pathNames.find((n) => !params[n]?.trim());
    if (missing) { setRes({ status: 0, ms: 0, body: `Falta el parámetro de ruta «${missing}».`, network: true }); return; }
    const path = ep.path.replace(/\{(\w+)\}/g, (_, n: string) => encodeURIComponent(params[n]!.trim()));
    const qs = new URLSearchParams(); for (const q of query) if (params[`q:${q.name}`]?.trim()) qs.set(q.name, params[`q:${q.name}`]!.trim());
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (payload) headers['Content-Type'] = 'application/json';
    if (needsAuth) { headers.Authorization = `Bearer ${s.token}`; headers['X-Usuario-Id'] = s.userId; headers['X-Usuario-Rol'] = ep.roles ?? s.role; }
    setBusy(true); const t0 = performance.now();
    try {
      const r = await fetch(`${API_BASE}${path}${qs.size ? `?${qs}` : ''}`, { method: ep.method, headers, body: payload });
      const text = await r.text(); let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* no es JSON */ }
      setRes({ status: r.status, ms: Math.round(performance.now() - t0), body: pretty || '(sin contenido)' });
    } catch { setRes({ status: 0, ms: 0, body: 'No pudimos conectar con la API. Si está despertando, espera unos segundos y reintenta.', network: true }); }
    setBusy(false);
  }

  const ok = res && res.status >= 200 && res.status < 300;
  return (
    <div className="flex flex-col gap-6">
      <div><p className="t-label m-0 uppercase text-text-secondary">Panel de desarrollador</p><h1 className="t-h1 m-0 mt-1">Probador</h1>
        <p className="t-body-long m-0 mt-2 max-w-[70ch] text-text-secondary">Llama a cualquier endpoint desde el navegador. Usa tu token y tu usuario/rol; las llamadas son <b>reales</b> y modifican tus datos.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 border border-border-subtle bg-layer-01 p-6" aria-label="Petición">
          <label className="t-label text-text-secondary" htmlFor="ep">Endpoint</label>
          <select id="ep" value={id} onChange={(e) => pick(e.target.value)} className="h-control-md w-full rounded-none border-0 border-b border-border-strong bg-field px-3">
            {GROUPS.map((g) => <optgroup key={g} label={g}>{ENDPOINTS.filter((e: Endpoint) => e.group === g).map((e) => <option key={e.id} value={e.id}>{e.method} {e.path}</option>)}</optgroup>)}
          </select>
          <p className="m-0 text-text-secondary">{ep.title}</p>
          {needsAuth && <p className="t-caption m-0 text-text-secondary">Enviará tu token, <code className="t-code-sm">X-Usuario-Id: {s.userId}</code> y <code className="t-code-sm">X-Usuario-Rol: {ep.roles ?? s.role}</code>.</p>}
          {pathNames.map((n) => <TextField key={n} label={`${n} (ruta)`} value={params[n] ?? ''} onChange={(e) => setParams((p) => ({ ...p, [n]: e.target.value }))} placeholder="uuid" />)}
          {query.map((q) => <TextField key={q.name} label={`${q.name} (consulta)`} value={params[`q:${q.name}`] ?? ''} onChange={(e) => setParams((p) => ({ ...p, [`q:${q.name}`]: e.target.value }))} helper={q.type} />)}
          {ep.body && (
            <div className="flex flex-col gap-1">
              <label htmlFor="body" className="t-label text-text-secondary">Cuerpo (JSON)</label>
              <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={Math.min(14, Math.max(5, body.split('\n').length + 1))} spellCheck={false}
                className="t-code-sm w-full resize-y rounded-none border-0 border-b border-border-strong bg-field p-3 text-text-primary" />
              {bodyErr && <span className="t-caption text-support-error">{bodyErr}</span>}
            </div>
          )}
          <Button icon="play" loading={busy} onClick={() => void send()} block>Enviar petición</Button>
        </section>
        <section className="flex min-w-0 flex-col gap-4" aria-label="Respuesta" aria-live="polite">
          {res ? (
            <>
              <div className="flex items-center gap-3"><span className={`t-label px-2 py-1 ${ok ? 'bg-state-serving text-text-on-accent' : 'bg-state-noshow text-text-on-color'}`}>{res.network ? 'Sin conexión' : res.status}</span>{!res.network && <span className="t-caption text-text-secondary">{res.ms} ms</span>}</div>
              {res.status === 401 && <Notice kind="warning" title="Tu token venció o no es válido">Vuelve a iniciar sesión para obtener uno nuevo.</Notice>}
              <CodeBlock samples={[{ lang: 'json', code: res.body }]} title="Respuesta" />
            </>
          ) : <div className="border border-dashed border-border-strong p-8 text-center text-text-secondary">La respuesta aparecerá aquí.</div>}
          <CodeBlock samples={buildSamples(ep, { token: s.token, userId: s.userId, role: s.role })} title="Equivalente en código" />
        </section>
      </div>
    </div>
  );
}
