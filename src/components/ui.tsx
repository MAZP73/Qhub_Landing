import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { icons, type IconName } from '@/lib/icons.generated';
import { cx } from '@/lib/cx';

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return <span aria-hidden className="inline-flex flex-none" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: icons[name].replace('<svg ', `<svg width="${size}" height="${size}" `) }} />;
}

export function Logo({ height = 28, symbol }: { height?: number; symbol?: boolean }) {
  if (symbol) return <img src="/qhub-simbolo.svg" alt="Qhub" height={height} style={{ height }} />;
  return (
    <span className="inline-flex" role="img" aria-label="Qhub">
      <img className="qh-logo-light" src="/qhub-horizontal.svg" alt="" style={{ height }} />
      <img className="qh-logo-dark" src="/qhub-horizontal-negativo.svg" alt="" style={{ height }} />
    </span>
  );
}

type Kind = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'accent' | 'danger';
const KIND: Record<Kind, string> = {
  primary: 'bg-interactive text-text-on-color hover:bg-interactive-hover active:bg-interactive-active',
  secondary: 'bg-layer-02 text-text-primary shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-layer-hover',
  tertiary: 'bg-transparent text-link shadow-[inset_0_0_0_1px_var(--link)] hover:bg-layer-hover',
  ghost: 'bg-transparent text-link hover:bg-layer-hover',
  accent: 'bg-brand-mint text-text-on-accent hover:opacity-90',
  danger: 'bg-support-error text-text-on-color hover:opacity-90',
};
const SIZE = { sm: 'min-h-control-sm', md: 'min-h-control-md', lg: 'min-h-control-lg' } as const;
export const btn = (kind: Kind = 'primary', size: keyof typeof SIZE = 'md', block = false) =>
  cx('inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border-0 px-4 text-center no-underline focus-visible:shadow-[inset_0_0_0_1px_var(--focus-inset)] disabled:cursor-not-allowed disabled:bg-layer-selected disabled:text-text-disabled disabled:shadow-none',
    KIND[kind], SIZE[size], block ? 'w-full py-2' : 'whitespace-nowrap');

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> { kind?: Kind; size?: keyof typeof SIZE; icon?: IconName; block?: boolean; loading?: boolean; children: ReactNode }
export function Button({ kind, size, icon, block, loading, children, className, disabled, ...rest }: BtnProps) {
  return (
    <button type="button" {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={cx(btn(kind, size, block), className)}>
      <span>{children}</span>{loading ? <span aria-hidden>…</span> : icon ? <Icon name={icon} /> : null}
    </button>
  );
}
export function ButtonLink({ kind, size, icon, block, children, className, to, ...rest }: Omit<LinkProps, 'to'> & { to: string; kind?: Kind; size?: keyof typeof SIZE; icon?: IconName; block?: boolean }) {
  const external = /^https?:/.test(to);
  const inner = <><span>{children}</span>{icon && <Icon name={icon} />}</>;
  const cls = cx(btn(kind, size, block), className);
  return external ? <a href={to} className={cls}>{inner}</a> : <Link to={to} {...rest} className={cls}>{inner}</Link>;
}

export function TextField({ label, error, helper, revealable, large, className, ...rest }: { label: string; error?: string | null; helper?: string; revealable?: boolean; large?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  const type = revealable && show ? 'text' : rest.type;
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="t-label text-text-secondary">{label}</label>
      <div className="relative">
        <input id={id} {...rest} type={type} aria-invalid={!!error || undefined} aria-describedby={error || helper ? `${id}-d` : undefined}
          className={cx('w-full rounded-none border-0 border-b bg-field px-3 text-text-primary placeholder:text-text-placeholder', large ? 'h-control-lg' : 'h-control-md', error ? 'border-b-2 border-support-error' : 'border-border-strong', revealable && 'pr-12')} />
        {revealable && (
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show}
            className="absolute right-0 top-0 h-full w-12 cursor-pointer border-0 bg-transparent text-xs text-link">{show ? 'Ocultar' : 'Ver'}</button>
        )}
      </div>
      {(error || helper) && <span id={`${id}-d`} className={cx('t-caption', error ? 'text-support-error' : 'text-text-secondary')}>{error || helper}</span>}
    </div>
  );
}

export function SelectField({ label, children, ...rest }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="t-label text-text-secondary">{label}</label>
      <select id={id} {...rest} className="h-control-md w-full rounded-none border-0 border-b border-border-strong bg-field px-3">{children}</select>
    </div>
  );
}

const TONE = { info: 'border-l-support-info text-support-info', success: 'border-l-support-success text-support-success', warning: 'border-l-support-warning text-support-warning', error: 'border-l-support-error text-support-error' } as const;
const NICON = { info: 'info', success: 'check', warning: 'warning', error: 'error' } as const;
export function Notice({ kind = 'info', title, children }: { kind?: keyof typeof TONE; title?: string; children?: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={cx('flex gap-3 border border-l-4 border-border-subtle bg-layer-01 p-3', TONE[kind])}>
      <Icon name={NICON[kind]} size={20} />
      <div className="text-text-primary">{title && <div className="font-semibold">{title}</div>}{children && <div className="text-text-secondary">{children}</div>}</div>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) { return <p className="t-label m-0 uppercase text-text-secondary">{children}</p>; }

export function LiveDot({ label }: { label: string }) {
  return <span className="t-caption inline-flex items-center gap-2 text-text-secondary"><span aria-hidden className="animate-live size-2 rounded-full bg-brand-mint" />{label}</span>;
}
