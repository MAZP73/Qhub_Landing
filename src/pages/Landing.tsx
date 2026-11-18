import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORM_URL } from '@/lib/config';
import type { IconName } from '@/lib/icons.generated';
import { CodeBlock } from '@/components/CodeBlock';
import { SiteFooter, SiteHeader } from '@/components/Chrome';
import { ButtonLink, Eyebrow, Icon } from '@/components/ui';

/** Fondo geométrico plano del héroe: cuadrícula y torres de fila (no figurativo). Solo tokens del design system. */
function Backdrop() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 1000 800" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 size-full">
      <defs><pattern id="rejilla" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" className="stroke-border-subtle" strokeWidth="1" /></pattern></defs>
      <rect width="1000" height="800" fill="url(#rejilla)" />
      <g className="fill-sidebar-bg"><rect x="640" y="470" width="90" height="330" /><rect x="760" y="380" width="90" height="420" /></g>
      <g className="fill-interactive"><rect x="880" y="300" width="90" height="500" /><rect x="520" y="560" width="90" height="240" /></g>
      <g className="fill-brand-mint"><rect x="880" y="300" width="90" height="14" /><rect x="760" y="380" width="90" height="14" /><rect x="640" y="470" width="90" height="14" /><rect x="520" y="560" width="90" height="14" /></g>
    </svg>
  );
}

/** Ilustración del héroe: Qhub al centro y sus tres formas de uso (app móvil, plataforma web y API). Plana, solo tokens del design system. Decorativa. */
function HeroVisual() {
  const label = { font: '500 14px var(--font-sans)' } as const;
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 560 420" className="mx-auto h-auto w-full">
      {/* conexiones */}
      <g fill="none" className="stroke-interactive" strokeWidth="2">
        <polyline points="280,210 280,96 124,96" /><polyline points="280,210 280,314 190,314" /><polyline points="280,210 370,210" />
      </g>
      <g className="fill-brand-mint"><rect x="119" y="91" width="10" height="10" /><rect x="185" y="309" width="10" height="10" /><rect x="365" y="205" width="10" height="10" /></g>

      {/* app móvil */}
      <rect x="60" y="40" width="64" height="112" className="fill-sidebar-bg" style={{ rx: 12 }} />
      <rect x="66" y="50" width="52" height="92" className="fill-layer-01" style={{ rx: 6 }} />
      <text x="92" y="82" textAnchor="middle" className="fill-interactive" style={{ font: '500 20px var(--font-mono)' }}>A24</text>
      <rect x="74" y="92" width="36" height="4" className="fill-border-strong" /><rect x="74" y="102" width="26" height="4" className="fill-border-subtle" />
      <rect x="74" y="120" width="36" height="14" className="fill-brand-mint" />
      <text x="92" y="178" textAnchor="middle" className="fill-text-secondary" style={label}>App móvil</text>

      {/* plataforma web */}
      <rect x="40" y="262" width="150" height="104" className="fill-layer-01 stroke-border-strong" strokeWidth="1.5" />
      <rect x="40" y="262" width="150" height="20" className="fill-sidebar-bg" />
      <g className="fill-brand-mint"><rect x="48" y="269" width="6" height="6" /></g><g className="fill-text-on-color"><rect x="58" y="269" width="6" height="6" /><rect x="68" y="269" width="6" height="6" /></g>
      <g className="fill-interactive"><rect x="56" y="326" width="18" height="30" /><rect x="82" y="312" width="18" height="44" /><rect x="108" y="298" width="18" height="58" /></g>
      <rect x="134" y="306" width="40" height="50" className="fill-brand-mint" />
      <text x="115" y="392" textAnchor="middle" className="fill-text-secondary" style={label}>Plataforma web</text>

      {/* API */}
      <rect x="370" y="158" width="150" height="104" className="fill-sidebar-bg" />
      <rect x="370" y="158" width="150" height="20" className="fill-sidebar-active" />
      <text x="382" y="173" className="fill-brand-mint" style={{ font: '500 12px var(--font-mono)' }}>POST /turnos</text>
      <g><rect x="382" y="192" width="46" height="5" className="fill-link-on-ink" /><rect x="434" y="192" width="60" height="5" className="fill-brand-mint" />
        <rect x="394" y="208" width="70" height="5" className="fill-text-on-color" /><rect x="394" y="224" width="40" height="5" className="fill-brand-mint" /><rect x="440" y="224" width="30" height="5" className="fill-link-on-ink" />
        <rect x="382" y="240" width="24" height="5" className="fill-text-on-color" /></g>
      <text x="445" y="288" textAnchor="middle" className="fill-text-secondary" style={label}>API</text>

      {/* Qhub al centro */}
      <circle cx="280" cy="210" r="58" className="fill-sidebar-bg" />
      <g transform="translate(250 180)">
        {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={c * 22} y={r * 22} width="16" height="16" className={r === 1 && c === 1 ? 'fill-text-on-color' : 'fill-interactive'} />
        )))}
      </g>
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-layer-02">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-1/2 lg:block"><Backdrop /></div>
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div className="flex flex-col gap-6">
          <Eyebrow>Qhub · Gestión de turnos</Eyebrow>
          <h1 className="t-display m-0 max-sm:!text-[40px] max-sm:!leading-[48px]">Cada turno, <span className="font-semibold">en su lugar.</span></h1>
          <p className="t-body-long m-0 max-w-[52ch] text-text-secondary">
            Qhub organiza las filas de tu negocio en tiempo real: tus clientes sacan turno desde el celular, tu equipo los atiende desde la plataforma, y si prefieres integrarlo a tu propio sistema, tienes una API completa.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={`${PLATFORM_URL}/`} size="lg" icon="arrow-right">Usar la plataforma</ButtonLink>
            <ButtonLink to="/acceso?tipo=dev" size="lg" kind="secondary" icon="code">Soy desarrollador</ButtonLink>
          </div>
          <ul className="t-caption m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-text-secondary">
            {([['live', 'Fila en vivo'], ['calendar', 'Horarios y franjas'], ['bell', 'Avisos al instante']] as const).map(([i, t]) => <li key={t} className="flex items-center gap-2"><span className="text-link"><Icon name={i} /></span>{t}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-[560px] border border-border-subtle bg-layer-01 p-4 sm:p-6"><HeroVisual /></div>
      </div>
    </section>
  );
}

function PathCard({ icon, tag, title, text, points, cta, to, kind }: { icon: IconName; tag: string; title: string; text: string; points: string[]; cta: string; to: string; kind: 'primary' | 'secondary' }) {
  return (
    <article className="flex min-w-0 flex-col gap-4 border border-border-subtle bg-layer-01 p-6 sm:p-8">
      <div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center bg-interactive text-text-on-color"><Icon name={icon} size={20} /></span><Eyebrow>{tag}</Eyebrow></div>
      <h3 className="t-h2 m-0">{title}</h3>
      <p className="t-body-long m-0 text-text-secondary">{text}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {points.map((p) => <li key={p} className="flex items-start gap-2"><span className="mt-0.5 text-support-success"><Icon name="check" /></span>{p}</li>)}
      </ul>
      <div className="mt-auto pt-4"><ButtonLink to={to} size="lg" kind={kind} icon="arrow-right" block>{cta}</ButtonLink></div>
    </article>
  );
}

function Paths() {
  return (
    <section id="empezar" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-8 flex flex-col gap-2"><Eyebrow>Empieza</Eyebrow><h2 className="t-h1 m-0">¿Cómo quieres usar Qhub?</h2><p className="t-body-long m-0 max-w-[60ch] text-text-secondary">Elige tu camino. Cada uno tiene su propia cuenta y su propio acceso.</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <PathCard icon="user" tag="Personas y organizaciones" title="Usar la plataforma"
          text="Administra tus filas desde el navegador y deja que tus clientes saquen turno desde la app móvil."
          points={['Colas, horarios y franjas en minutos', 'Fila en vivo, equipo y clientes', 'Métricas, historial y exportación', 'App móvil para tus clientes']}
          cta="Crear cuenta en la plataforma" to={`${PLATFORM_URL}/`} kind="primary" />
        <PathCard icon="code" tag="Desarrolladores" title="Integrar con la API"
          text="Consume Qhub directamente desde tu código. Sin plataforma ni app: solo la API, su token y su documentación."
          points={['API REST con respuestas JSON', 'Eventos en tiempo real por WebSocket', 'API key permanente desde tu panel', 'Documentación completa con ejemplos']}
          cta="Crear cuenta de API" to="/acceso?tipo=dev&modo=registro" kind="secondary" />
      </div>
      <p className="t-caption mt-4 text-text-secondary">Las cuentas de la plataforma y las de la API son independientes: una cuenta de desarrollador solo accede a la API.</p>
    </section>
  );
}

const FEATURES: ReadonlyArray<{ icon: IconName; title: string; text: string }> = [
  { icon: 'live', title: 'Fila en vivo', text: 'Mira quién espera y quién se atiende, y llama al siguiente turno con un clic. Todo se actualiza solo.' },
  { icon: 'calendar', title: 'Horarios y franjas', text: 'Define apertura, cierre, días de atención, duración del trámite y puestos. Qhub calcula los cupos por ti.' },
  { icon: 'ticket', title: 'Turnos en vivo o programados', text: 'Tus clientes sacan turno al llegar o reservan una franja futura, sin carreras ni números repetidos.' },
  { icon: 'bell', title: 'Avisos al instante', text: 'Notificaciones cuando llaman al turno, lo posponen o se acerca la hora, dentro de la app y por la API.' },
  { icon: 'chart', title: 'Métricas y exportación', text: 'Tiempos de espera, atendidos por día e historial completo, listo para exportar a CSV.' },
  { icon: 'building', title: 'Equipo y organizaciones', text: 'Invita a tu equipo, asigna quién atiende y administra varias colas bajo una misma organización.' },
];

function Features() {
  return (
    <section id="funciones" className="border-y border-border-subtle bg-layer-01">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="mb-8 flex flex-col gap-2"><Eyebrow>Funciones</Eyebrow><h2 className="t-h1 m-0">Todo lo que necesita una fila bien llevada</h2></div>
        <div className="grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-layer-01 p-6">
              <span className="text-interactive"><Icon name={f.icon} size={24} /></span>
              <h3 className="t-h4 m-0">{f.title}</h3>
              <p className="m-0 text-text-secondary">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 border-t-4 border-interactive bg-layer-01 p-6">
      <span className="t-turn text-text-secondary">{n}</span><h3 className="t-h4 m-0">{title}</h3><p className="m-0 text-text-secondary">{children}</p>
    </li>
  );
}

function How() {
  return (
    <section id="como-funciona" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-8 flex flex-col gap-2"><Eyebrow>Cómo funciona</Eyebrow><h2 className="t-h1 m-0">De la fila al turno, en tres pasos</h2></div>
      <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        <Step n="01" title="Crea tu cola">Ponle nombre, define el horario y la duración de cada trámite. Qhub genera las franjas y sus cupos.</Step>
        <Step n="02" title="Tus clientes sacan turno">Desde la app móvil, o desde tu propio sistema con la API, en vivo o para una franja futura.</Step>
        <Step n="03" title="Atiende en tiempo real">Tu equipo llama, atiende y finaliza turnos; cada cambio llega al instante a quien espera.</Step>
      </ol>
    </section>
  );
}

const SNIPPET = `# Tu API key (no vence) va directo en cada petición.
# Sacar un turno:
curl -X POST https://qhub-api-a5yf.onrender.com/turnos \\
  -H "Authorization: Bearer $QHUB_API_KEY" \\
  -H "X-Usuario-Id: cliente-123" \\
  -H "X-Usuario-Rol: cliente" \\
  -H "Content-Type: application/json" \\
  -d '{"cola_id": "<id-de-la-cola>"}'`;

function ApiSection() {
  return (
    <section id="api" className="border-y border-border-subtle bg-layer-02">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Eyebrow>Para desarrolladores</Eyebrow>
          <h2 className="t-h1 m-0">Qhub también es una API</h2>
          <p className="t-body-long m-0 text-text-secondary">Integra la gestión de turnos en tu propio sistema. Crea una cuenta de API, inicia sesión en tu panel, genera tu API key y empieza a llamar a los endpoints: sin pasos intermedios.</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {['REST con JSON y autenticación por token (Bearer)', 'Colas, horarios, franjas, turnos y notificaciones', 'Eventos en vivo por WebSocket', 'Esquema OpenAPI público'].map((t) => <li key={t} className="flex items-start gap-2"><span className="mt-0.5 text-support-success"><Icon name="check" /></span>{t}</li>)}
          </ul>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/acceso?tipo=dev&modo=registro" size="lg" icon="arrow-right">Crear cuenta de API</ButtonLink>
            <ButtonLink to="/dev/docs" size="lg" kind="secondary">Ver la documentación</ButtonLink>
          </div>
        </div>
        <CodeBlock samples={[{ lang: 'curl', code: SNIPPET }]} title="Primeros pasos" />
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-sidebar-bg text-text-on-color">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div><h2 className="t-h1 m-0 text-white">Empieza hoy con Qhub</h2><p className="t-body-long mt-2 text-sidebar-text">Elige plataforma o API. Puedes empezar en minutos.</p></div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to={`${PLATFORM_URL}/`} size="lg" kind="accent" icon="arrow-right">Usar la plataforma</ButtonLink>
          <Link to="/acceso?tipo=dev&modo=registro" className="inline-flex min-h-control-lg items-center gap-2 rounded-sm px-4 text-white no-underline shadow-[inset_0_0_0_1px_#ffffff] hover:bg-white/10">Soy desarrollador <Icon name="code" /></Link>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="contenido"><Hero /><Paths /><Features /><How /><ApiSection /><FinalCta /></main>
      <SiteFooter />
    </>
  );
}
