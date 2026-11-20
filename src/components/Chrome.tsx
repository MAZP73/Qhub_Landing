import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { applyTheme, loadTheme, type Theme } from '@/lib/theme';
import { PLATFORM_URL, APP_URL } from '@/lib/config';
import { useDevSession } from '@/lib/session';
import { cx } from '@/lib/cx';
import { ButtonLink, Icon, Logo } from './ui';

export function ThemeToggle({ className }: { className?: string }) {
  const [t, setT] = useState<Theme>(loadTheme);
  useEffect(() => { applyTheme(t); }, [t]);
  const next: Theme = t === 'system' ? 'dark' : t === 'dark' ? 'light' : 'system';
  const label = t === 'system' ? 'Tema: automático' : t === 'dark' ? 'Tema: oscuro' : 'Tema: claro';
  return (
    <button type="button" onClick={() => setT(next)} title={`${label} (clic para cambiar)`} aria-label={`${label}. Cambiar`}
      className={cx('t-caption inline-flex h-control-md cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-3 text-text-secondary hover:bg-layer-hover', className)}>
      <Icon name="settings" />{t === 'system' ? 'Auto' : t === 'dark' ? 'Oscuro' : 'Claro'}
    </button>
  );
}

export function SiteHeader() {
  const dev = useDevSession();
  const [open, setOpen] = useState(false);
  const nav = [['Funciones', '/#funciones'], ['Cómo funciona', '/#como-funciona'], ['API', '/#api']] as const;
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-layer-01">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
        <Link to="/" aria-label="Qhub, inicio" className="inline-flex"><Logo height={28} /></Link>
        <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 lg:flex">
          {nav.map(([l, h]) => <a key={h} href={h} className="rounded-sm px-3 py-2 text-text-secondary no-underline hover:bg-layer-hover hover:text-text-primary">{l}</a>)}
          <NavLink to="/dev/docs" className="rounded-sm px-3 py-2 text-text-secondary no-underline hover:bg-layer-hover hover:text-text-primary">Documentación</NavLink>
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <ButtonLink to={dev ? '/dev' : '/acceso?tipo=dev'} kind="secondary">{dev ? 'Mi panel de desarrollador' : 'Soy desarrollador'}</ButtonLink>
          <ButtonLink to={`${PLATFORM_URL}/`} icon="arrow-right">Usar la plataforma</ButtonLink>
        </div>
        <button type="button" className="ml-auto inline-flex size-10 cursor-pointer items-center justify-center border-0 bg-transparent text-text-primary lg:hidden" aria-label="Menú" aria-expanded={open} onClick={() => setOpen((v) => !v)}><Icon name={open ? 'close' : 'menu'} size={20} /></button>
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t border-border-subtle bg-layer-01 p-6 lg:hidden" onClick={() => setOpen(false)}>
          {nav.map(([l, h]) => <a key={h} href={h} className="py-2 text-text-primary no-underline">{l}</a>)}
          <Link to="/dev/docs" className="py-2 text-text-primary no-underline">Documentación</Link>
          <ButtonLink to={dev ? '/dev' : '/acceso?tipo=dev'} kind="secondary" block>{dev ? 'Mi panel de desarrollador' : 'Soy desarrollador'}</ButtonLink>
          <ButtonLink to={`${PLATFORM_URL}/`} icon="arrow-right" block>Usar la plataforma</ButtonLink>
          <ThemeToggle className="self-start" />
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-layer-01">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo height={28} />
          <p className="m-0 max-w-[36ch] text-text-secondary">Turnos sin filas: plataforma, app móvil y API para gestionar cada fila en tiempo real.</p>
        </div>
        <FooterCol title="Producto" links={[['Funciones', '/#funciones'], ['Cómo funciona', '/#como-funciona'], ['Plataforma web', PLATFORM_URL], ['App móvil (Expo Go)', APP_URL]]} />
        <FooterCol title="Desarrolladores" links={[['Panel de desarrollador', '/dev'], ['Documentación', '/dev/docs'], ['Crear cuenta de API', '/acceso?tipo=dev&modo=registro']]} />
      </div>
      <p className="t-caption m-0 border-t border-border-subtle px-6 py-4 text-center text-text-secondary">© Qhub 2026. Todos los derechos reservados.</p>
    </footer>
  );
}
function FooterCol({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }): ReactNode {
  return (
    <nav aria-label={title} className="flex flex-col gap-2">
      <h2 className="t-label m-0 uppercase text-text-secondary">{title}</h2>
      {links.map(([l, h]) => (/^(https?|exp):/.test(h) || h.includes('#') ? <a key={l} href={h}>{l}</a> : <Link key={l} to={h}>{l}</Link>))}
    </nav>
  );
}
