import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { apiReady } from '@/lib/api';
import { sessionStore, useDevSession } from '@/lib/session';
import { cx } from '@/lib/cx';
import { DocsContext } from '@/docs/ctx';
import { GUIDES } from '@/docs/guides';
import { GROUPS, ENDPOINTS } from '@/docs/spec';
import { ThemeToggle } from '@/components/Chrome';
import { ButtonLink, Icon, LiveDot, Logo } from '@/components/ui';

function Status() {
  const [s, setS] = useState<'ok' | 'degraded' | 'down' | null>(null);
  useEffect(() => { let on = true; void apiReady().then((v) => on && setS(v)); return () => { on = false; }; }, []);
  if (!s) return <span className="t-caption text-text-secondary">Comprobando API…</span>;
  return s === 'ok' ? <LiveDot label="API operativa" /> : <span className="t-caption inline-flex items-center gap-2 text-support-warning"><Icon name="warning" />{s === 'down' ? 'API sin respuesta' : 'API degradada'}</span>;
}

const link = ({ isActive }: { isActive: boolean }) => cx('flex items-center gap-2 border-l-2 px-4 py-2 no-underline', isActive ? 'border-l-brand-mint bg-sidebar-active text-sidebar-text-active' : 'border-l-transparent text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active');

export function DevLayout() {
  const session = useDevSession();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => { if (!session) setMine(false); }, [session]);
  const ctx = useMemo(() => ({ token: session?.token ?? null, userId: session?.userId ?? 'cliente-123', role: session?.role ?? 'cliente', useMine: mine && !!session }), [session, mine]);

  const nav = (
    <nav aria-label="Panel de desarrollador" className="flex flex-col gap-1 py-4">
      <NavLink to="/dev" end className={link}><Icon name="dashboard" />Mi panel</NavLink>
      <NavLink to="/dev/probar" className={link}><Icon name="play" />Probador</NavLink>
      <p className="t-label m-0 px-4 pb-1 pt-5 uppercase text-sidebar-text">Guías</p>
      {GUIDES.map((g) => <NavLink key={g.id} to={`/dev/docs/${g.id}`} className={link}>{g.title}</NavLink>)}
      {GROUPS.map((gr) => (
        <div key={gr}>
          <p className="t-label m-0 px-4 pb-1 pt-5 uppercase text-sidebar-text">{gr}</p>
          {ENDPOINTS.filter((e) => e.group === gr).map((e) => (
            <NavLink key={e.id} to={`/dev/docs/${e.id}`} className={link}>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
              <span className="t-code-sm opacity-70" style={{ fontSize: 10 }}>{e.method}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <DocsContext.Provider value={ctx}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle bg-layer-01 px-4">
          <button type="button" className="inline-flex size-10 cursor-pointer items-center justify-center border-0 bg-transparent text-text-primary lg:hidden" aria-label="Menú de documentación" aria-expanded={open} onClick={() => setOpen((v) => !v)}><Icon name={open ? 'close' : 'menu'} size={20} /></button>
          <Link to="/" aria-label="Qhub, inicio" className="inline-flex"><Logo height={26} /></Link>
          <Link to="/" className="hidden items-center gap-1 whitespace-nowrap no-underline sm:inline-flex"><Icon name="chevron-left" />Volver al inicio</Link>
          <span className="t-label hidden bg-layer-02 px-2 py-1 text-text-secondary sm:inline">API · Desarrolladores</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block"><Status /></span>
            <ThemeToggle />
            {session ? (
              <>
                <span className="t-caption hidden max-w-[180px] truncate text-text-secondary md:block" title={session.identifier}>{session.identifier}</span>
                <button type="button" onClick={() => sessionStore.clear()} className="inline-flex h-control-md cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-3 text-link hover:bg-layer-hover"><Icon name="logout" />Salir</button>
              </>
            ) : <ButtonLink to="/acceso?tipo=dev" size="sm">Iniciar sesión</ButtonLink>}
          </div>
        </header>
        <div className="flex flex-1">
          <aside className={cx('fixed inset-y-14 left-0 z-20 w-[280px] overflow-y-auto bg-sidebar-bg lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-56px)] lg:[@media(max-height:480px)]:static lg:[@media(max-height:480px)]:h-auto', open ? 'block' : 'hidden')}>{nav}</aside>
          <main id="contenido" className="min-w-0 flex-1 px-6 py-8 lg:px-12">
            <div className="mx-auto max-w-[1100px]">
              {session && (
                <label className="t-caption mb-6 flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="size-4 accent-[var(--interactive)]" />
                  Usar mi token de sesión en los ejemplos de código <span className="text-text-disabled">(se copiará con tu token real; tu API key no se puede mostrar de nuevo)</span>
                </label>
              )}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DocsContext.Provider>
  );
}
