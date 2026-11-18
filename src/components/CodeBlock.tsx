import { useState } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from './ui';

export type Lang = 'curl' | 'js' | 'python' | 'json' | 'http';
export const LANG_LABEL: Record<Lang, string> = { curl: 'cURL', js: 'JavaScript', python: 'Python', json: 'JSON', http: 'HTTP' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = /\b(const|let|await|async|import|from|return|print|def|if|new|true|false|null|None|True|False)\b/g;

/** Resaltado mínimo (cadenas, comentarios, números, palabras clave) sin dependencias. */
export function highlight(code: string, lang: Lang): string {
  const out: string[] = [];
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)/g;
  let last = 0; let m: RegExpExecArray | null;
  const plain = (t: string) => (lang === 'json' || lang === 'http' ? esc(t) : esc(t).replace(KW, '<span class="tok-k">$1</span>'));
  while ((m = re.exec(code))) {
    out.push(plain(code.slice(last, m.index)));
    if (m[1]) out.push(lang === 'json' ? esc(m[1]) : `<span class="tok-c">${esc(m[1])}</span>`);
    else if (m[2]) out.push(`<span class="tok-s">${esc(m[2])}</span>`);
    else out.push(`<span class="tok-n">${esc(m[3]!)}</span>`);
    last = m.index + m[0].length;
  }
  out.push(plain(code.slice(last)));
  return out.join('');
}

export function CopyButton({ text, label = 'Copiar', className }: { text: string | (() => string); label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    const v = typeof text === 'function' ? text() : text;
    try { await navigator.clipboard.writeText(v); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* sin permiso de portapapeles */ }
  }
  return (
    <button type="button" onClick={() => void copy()} aria-live="polite"
      className={cx('inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent px-2 py-1 text-xs text-[#b4b9cc] hover:bg-white/10 hover:text-white', className)}>
      <Icon name={done ? 'check' : 'copy'} size={14} />{done ? 'Copiado' : label}
    </button>
  );
}

export interface Sample { lang: Lang; code: string }

/** Bloque de código con pestañas por lenguaje y botón de copiar. */
export function CodeBlock({ samples, title, copyText }: { samples: Sample[]; title?: string; copyText?: (s: Sample) => string }) {
  const [i, setI] = useState(0);
  const cur = samples[Math.min(i, samples.length - 1)]!;
  return (
    <figure className="code-surface m-0 overflow-hidden rounded-sm border border-border-subtle">
      <div className="flex items-center justify-between border-b border-white/10 pl-1 pr-1">
        <div role="tablist" aria-label={title ?? 'Lenguaje'} className="flex">
          {samples.length > 1 ? samples.map((s, k) => (
            <button key={s.lang} role="tab" aria-selected={k === i} type="button" onClick={() => setI(k)}
              className={cx('cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2 text-xs', k === i ? 'border-b-brand-mint text-white' : 'border-b-transparent text-[#9aa0b8] hover:text-white')}>{LANG_LABEL[s.lang]}</button>
          )) : <span className="px-3 py-2 text-xs text-[#9aa0b8]">{title ?? LANG_LABEL[cur.lang]}</span>}
        </div>
        <CopyButton text={() => (copyText ? copyText(cur) : cur.code)} />
      </div>
      <pre className="t-code-sm m-0 overflow-x-auto p-4" tabIndex={0}><code dangerouslySetInnerHTML={{ __html: highlight(cur.code, cur.lang) }} /></pre>
    </figure>
  );
}
