import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { apiLogin, apiRecover, apiRegister, type RegisterBody } from '@/lib/api';
import { PLATFORM_URL } from '@/lib/config';
import { sessionStore, useDevSession } from '@/lib/session';
import { cx } from '@/lib/cx';
import { Button, ButtonLink, Icon, Logo, Notice, TextField } from '@/components/ui';

type Mode = 'login' | 'registro' | 'recuperar';
const TITLE: Record<Mode, string> = { login: 'Inicia sesión en la API', registro: 'Crea tu cuenta de API', recuperar: 'Recupera tu acceso' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER = /^[a-z0-9][a-z0-9._-]{2,49}$/;

export function DevAccess() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const session = useDevSession();
  const [mode, setMode] = useState<Mode>(params.get('modo') === 'registro' ? 'registro' : 'login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [f, setF] = useState({ identifier: '', password: '', again: '', first: '', last: '', username: '', email: '', company: '', country: 'Ecuador', city: '', terms: false });
  const [kind, setKind] = useState<'usuario' | 'empresa'>('usuario');
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  if (session) return <Navigate to="/dev" replace />;

  function go(m: Mode) { setMode(m); setErrs({}); setError(null); setInfo(null); }

  async function login(identifier: string, password: string) {
    const r = await apiLogin(identifier.trim(), password);
    if (!r.ok) { setError(r.message); return false; }
    sessionStore.start(r.value.access_token, r.value.expires_in, identifier.trim());
    nav('/dev', { replace: true });
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const reg = mode === 'registro';
    const next: Record<string, string | null> = {
      identifier: mode === 'login' && !f.identifier.trim() ? 'Escribe tu correo o nombre de usuario.' : null,
      email: (reg || mode === 'recuperar') && !EMAIL.test(f.email.trim()) ? 'Escribe un correo válido.' : null,
      password: mode === 'login' ? (f.password ? null : 'Escribe tu contraseña.') : reg ? (f.password.length < 8 ? 'Mínimo 8 caracteres.' : null) : null,
      again: reg && f.again !== f.password ? 'Las contraseñas no coinciden.' : null,
      first: reg && !f.first.trim() ? 'Escribe tu nombre.' : null,
      last: reg && !f.last.trim() ? 'Escribe tu apellido.' : null,
      username: reg && !USER.test(f.username.trim()) ? '3 a 50 caracteres: minúsculas, números, punto, guion.' : null,
      company: reg && kind === 'empresa' && !f.company.trim() ? 'Escribe el nombre de la empresa.' : null,
      city: reg && !f.city.trim() ? 'Escribe tu ciudad.' : null,
      terms: reg && !f.terms ? 'Debes aceptar los términos para continuar.' : null,
    };
    setErrs(next); setError(null); setInfo(null);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    if (mode === 'login') { await login(f.identifier, f.password); }
    else if (mode === 'recuperar') {
      const r = await apiRecover(f.email.trim());
      if (!r.ok) setError(r.message); else setInfo('Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva. Revisa también el spam.');
    } else {
      const body: RegisterBody = {
        tipo_cuenta: kind, ...(kind === 'empresa' ? { nombre_empresa: f.company.trim() } : {}), nombre: f.first.trim(), apellido: f.last.trim(),
        nombre_usuario: f.username.trim().toLowerCase(), email: f.email.trim(), password: f.password, pais: f.country.trim(), ciudad: f.city.trim(), acepto_terminos: true,
      };
      const r = await apiRegister(body);
      if (!r.ok) setError(r.message);
      else await login(body.nombre_usuario, f.password) || go('login');   // cuenta creada: entra directo al panel
    }
    setBusy(false);
  }

  const link = (label: string, m: Mode) => <a href="#" onClick={(e) => { e.preventDefault(); go(m); }}>{label}</a>;

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[2fr_3fr]">
      <main id="contenido" className="flex min-h-screen flex-col bg-layer-01 px-6 py-8 sm:px-12 md:px-16">
        <Link to="/" aria-label="Qhub, inicio" className="inline-flex self-start"><Logo height={32} /></Link>
        <form className="my-auto flex w-full max-w-[460px] flex-col gap-4 py-10" onSubmit={(e) => void submit(e)} noValidate aria-label={TITLE[mode]}>
          <div>
            <span className="t-label mb-3 inline-flex items-center gap-2 bg-layer-02 px-2 py-1 text-text-secondary"><Icon name="code" />Cuenta de desarrollador · solo API</span>
            <h1 className="t-h1 mb-2 mt-2">{TITLE[mode]}</h1>
            <span className="text-text-secondary">
              {mode === 'login' && <>¿Aún no tienes cuenta? {link('Créala aquí', 'registro')}</>}
              {mode === 'registro' && <>¿Ya tienes cuenta? {link('Inicia sesión', 'login')}</>}
              {mode === 'recuperar' && <>Te enviaremos un enlace por correo. {link('Volver', 'login')}</>}
            </span>
          </div>
          {error && <Notice kind="error" title={error} />}
          {info && <Notice kind="success" title={info} />}
          {mode === 'login' && <TextField label="Correo o nombre de usuario" value={f.identifier} onChange={(e) => set('identifier', e.target.value)} error={errs.identifier} autoComplete="username" large />}
          {mode === 'registro' && (
            <>
              <fieldset className="m-0 grid grid-cols-1 gap-2 border-0 p-0 sm:grid-cols-2">
                <legend className="t-label mb-1 text-text-secondary">Tipo de cuenta de API</legend>
                {([['usuario', 'Individual', 'user', 'Para integrar tu propio sistema.'], ['empresa', 'Empresa', 'building', 'Para una organización o equipo.']] as const).map(([v, l, ic, h]) => (
                  <label key={v} className={cx('flex cursor-pointer flex-col gap-1 border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus', kind === v ? 'border-interactive bg-layer-02' : 'border-border-subtle bg-layer-01 hover:bg-layer-hover')}>
                    <input type="radio" name="tipo" value={v} checked={kind === v} onChange={() => setKind(v)} className="sr-only" />
                    <span className="flex items-center gap-2 font-medium"><Icon name={ic} />{l}{kind === v && <span className="ml-auto text-interactive"><Icon name="check" /></span>}</span>
                    <span className="t-caption text-text-secondary">{h}</span>
                  </label>
                ))}
              </fieldset>
              {kind === 'empresa' && <TextField label="Nombre de la empresa" value={f.company} onChange={(e) => set('company', e.target.value)} error={errs.company} autoComplete="organization" />}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextField label="Nombre" value={f.first} onChange={(e) => set('first', e.target.value)} error={errs.first} autoComplete="given-name" />
                <TextField label="Apellido" value={f.last} onChange={(e) => set('last', e.target.value)} error={errs.last} autoComplete="family-name" />
              </div>
              <TextField label="Nombre de usuario" value={f.username} onChange={(e) => set('username', e.target.value.toLowerCase())} error={errs.username} helper="Lo usarás para iniciar sesión (o tu correo)." autoComplete="username" />
            </>
          )}
          {mode !== 'login' && <TextField label="Correo" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errs.email} placeholder="nombre@ejemplo.com" autoComplete="email" large />}
          {mode !== 'recuperar' && <TextField label="Contraseña" type="password" revealable value={f.password} onChange={(e) => set('password', e.target.value)} error={errs.password} helper={mode === 'registro' ? 'Mínimo 8 caracteres.' : undefined} autoComplete={mode === 'registro' ? 'new-password' : 'current-password'} large />}
          {mode === 'registro' && (
            <>
              <TextField label="Repite la contraseña" type="password" revealable value={f.again} onChange={(e) => set('again', e.target.value)} error={errs.again} autoComplete="new-password" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextField label="País" value={f.country} onChange={(e) => set('country', e.target.value)} autoComplete="country-name" />
                <TextField label="Ciudad" value={f.city} onChange={(e) => set('city', e.target.value)} error={errs.city} autoComplete="address-level2" />
              </div>
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={f.terms} onChange={(e) => set('terms', e.target.checked)} className="mt-1 size-4 accent-[var(--interactive)]" />
                <span>Acepto los términos de uso de la API de Qhub.{errs.terms && <span className="t-caption block text-support-error">{errs.terms}</span>}</span>
              </label>
            </>
          )}
          <Button type="submit" size="lg" block icon="arrow-right" loading={busy}>{mode === 'registro' ? 'Crear cuenta y entrar' : mode === 'recuperar' ? 'Enviar enlace' : 'Entrar al panel'}</Button>
          {mode === 'login' && <div>{link('¿Olvidaste tu contraseña?', 'recuperar')}</div>}
          {mode === 'recuperar' && <Button kind="tertiary" size="lg" block icon="chevron-left" onClick={() => go('login')}>Volver a iniciar sesión</Button>}
        </form>
        <p className="t-caption m-0 flex items-start gap-2 text-text-secondary"><Icon name="info" /><span>¿Buscas la plataforma, no la API? <a href={`${PLATFORM_URL}/`}>Ir a la plataforma de Qhub</a>. Tu contraseña nunca se guarda en este navegador; solo tu token, mientras dure.</span></p>
      </main>
      <aside className="relative hidden items-center justify-center overflow-hidden bg-sidebar-bg bg-[radial-gradient(circle,rgba(255,255,255,0.13)_3px,transparent_3.5px)] bg-[length:64px_62px] bg-[position:32px_31px] p-12 md:flex" aria-label="Sobre la API">
        <div className="flex w-full max-w-[520px] flex-col gap-5 text-white">
          <p className="t-label m-0 uppercase text-sidebar-text">Qhub · API para desarrolladores</p>
          <h2 className="t-h1 m-0 text-white">Tu token, tu documentación, tu integración.</h2>
          <p className="t-body-long m-0 text-sidebar-text">Al entrar generas tu API key permanente, encuentras tu token de sesión, la referencia completa de la API con ejemplos en cURL, JavaScript y Python, y un probador para llamar a los endpoints desde el navegador.</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {['API key permanente: sin pedir tokens', 'Referencia de cada endpoint', 'Eventos en vivo por WebSocket', 'Probador de endpoints integrado'].map((t) => <li key={t} className="flex items-center gap-3"><span className="text-brand-mint"><Icon name="check" /></span>{t}</li>)}
          </ul>
          <ButtonLink to="/dev/docs" kind="secondary" className="self-start !bg-transparent !text-white">Ver la documentación sin cuenta</ButtonLink>
        </div>
      </aside>
    </div>
  );
}
