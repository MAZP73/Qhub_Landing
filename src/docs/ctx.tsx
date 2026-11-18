import { createContext, useContext, type ReactNode } from 'react';

export interface DocsCtx { token: string | null; userId: string; role: string; useMine: boolean }
export const DocsContext = createContext<DocsCtx>({ token: null, userId: 'cliente-123', role: 'cliente', useMine: false });
export const useDocsCtx = () => useContext(DocsContext);
/** Token para mostrar en los ejemplos: solo el real si la persona lo pidió. */
export const sampleToken = (c: DocsCtx) => (c.useMine ? c.token : null);

/** Texto con `código` en línea (lo único de markdown que usa la especificación). */
export function Md({ children }: { children: string }): ReactNode {
  return <>{children.split(/(`[^`]+`)/g).map((p, i) => (p.startsWith('`') && p.endsWith('`') ? <code key={i} className="t-code-sm rounded-sm bg-layer-02 px-1 py-0.5 text-text-primary">{p.slice(1, -1)}</code> : <span key={i}>{p}</span>))}</>;
}
