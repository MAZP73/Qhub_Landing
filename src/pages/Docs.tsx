import { Link, Navigate, useParams } from 'react-router-dom';
import { CodeBlock } from '@/components/CodeBlock';
import { Icon } from '@/components/ui';
import { cx } from '@/lib/cx';
import { buildSamples, responseSample } from '@/docs/samples';
import { ENDPOINTS, STATUS_TEXT, type Endpoint, type Field, type Method } from '@/docs/spec';
import { GUIDES, P, Table, Code } from '@/docs/guides';
import { Md, sampleToken, useDocsCtx } from '@/docs/ctx';

export const METHOD_STYLE: Record<Method, string> = {
  GET: 'bg-state-serving text-text-on-accent', POST: 'bg-interactive text-text-on-color', PUT: 'bg-state-waiting text-text-on-accent',
  PATCH: 'bg-state-waiting text-text-on-accent', DELETE: 'bg-state-noshow text-text-on-color',
};
export const MethodTag = ({ m }: { m: Method }) => <span className={cx('t-code-sm inline-block min-w-[58px] rounded-sm px-2 py-0.5 text-center font-medium', METHOD_STYLE[m])}>{m}</span>;

function Fields({ title, fields }: { title: string; fields?: Field[] }) {
  if (!fields?.length) return null;
  return (
    <>
      <h3 className="t-h4 mb-2 mt-6">{title}</h3>
      <Table head={['Campo', 'Tipo', 'Descripción']} rows={fields.map((f) => [
        <span key="n" className="whitespace-nowrap"><Code>{f.name}</Code>{f.required && <span className="t-caption ml-2 text-support-error">requerido</span>}</span>,
        <span key="t" className="t-code-sm text-text-secondary">{f.type}</span>, <Md key="d">{f.desc}</Md>,
      ])} />
    </>
  );
}

function EndpointDoc({ ep }: { ep: Endpoint }) {
  const c = useDocsCtx();
  const samples = buildSamples(ep, { token: sampleToken(c), userId: c.userId, role: c.role });
  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-3"><MethodTag m={ep.method} /><code className="t-code break-all">{ep.path}</code></div>
      <h1 className="t-h1 m-0">{ep.title}</h1>
      <P><Md>{ep.summary}</Md></P>
      {ep.notes && <ul className="t-body-long my-3 max-w-[70ch] list-disc pl-6 text-text-secondary">{ep.notes.map((n) => <li key={n} className="my-1"><Md>{n}</Md></li>)}</ul>}
      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h3 className="t-h4 mb-2">Autenticación</h3>
          <p className="m-0 text-text-secondary">
            {ep.auth === 'none' && 'Pública: no requiere token.'}
            {ep.auth === 'bearer' && <>Requiere <Code>Authorization: Bearer</Code>.</>}
            {ep.auth === 'actor' && <>Requiere <Code>Authorization: Bearer</Code>, <Code>X-Usuario-Id</Code> y <Code>X-Usuario-Rol</Code>{ep.roles ? <>; rol <Code>{ep.roles}</Code></> : null}. <Link to="/dev/docs/autenticacion">Más información</Link>.</>}
          </p>
          <Fields title="Parámetros de ruta" fields={ep.pathParams} />
          <Fields title="Parámetros de consulta" fields={ep.query} />
          <Fields title="Cuerpo (JSON)" fields={ep.body} />
          {ep.errors && (
            <>
              <h3 className="t-h4 mb-2 mt-6">Errores posibles</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{ep.errors.map((e) => <li key={e} className="t-caption border border-border-subtle bg-layer-02 px-2 py-1"><b className="t-code-sm">{e}</b> {STATUS_TEXT[e]}</li>)}</ul>
            </>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4 xl:self-start xl:[@media(min-height:720px)]:sticky xl:[@media(min-height:720px)]:top-20">
          <CodeBlock samples={samples} title="Ejemplo de petición" />
          <CodeBlock samples={[{ lang: 'json', code: responseSample(ep) }]} title={`Respuesta · ${ep.status} ${STATUS_TEXT[ep.status] ?? ''}`} />
          <p className="t-caption m-0 text-text-secondary">Los datos de los ejemplos son ilustrativos.</p>
        </div>
      </div>
    </>
  );
}

export function DocsPage() {
  const { id = 'introduccion' } = useParams();
  const guide = GUIDES.find((g) => g.id === id);
  const ep = ENDPOINTS.find((e) => e.id === id);
  const all = [...GUIDES.map((g) => ({ id: g.id, title: g.title })), ...ENDPOINTS.map((e) => ({ id: e.id, title: e.title }))];
  const idx = all.findIndex((x) => x.id === id);
  if (!guide && !ep) return <Navigate to="/dev/docs" replace />;
  const prev = all[idx - 1]; const next = all[idx + 1];
  return (
    <article>
      {guide ? (
        <>
          <h1 className="t-h1 m-0">{guide.title}</h1>
          <p className="t-body-long mb-8 mt-2 max-w-[70ch] text-text-secondary">{guide.lead}</p>
          {guide.render()}
        </>
      ) : <EndpointDoc ep={ep!} />}
      <nav aria-label="Anterior y siguiente" className="mt-14 flex items-center justify-between gap-4 border-t border-border-subtle pt-6">
        {prev ? <Link to={`/dev/docs/${prev.id}`} className="inline-flex items-center gap-2 no-underline"><Icon name="chevron-left" />{prev.title}</Link> : <span />}
        {next ? <Link to={`/dev/docs/${next.id}`} className="inline-flex items-center gap-2 no-underline">{next.title}<Icon name="chevron-right" /></Link> : <span />}
      </nav>
    </article>
  );
}
