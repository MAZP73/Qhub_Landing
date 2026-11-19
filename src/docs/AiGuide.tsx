import { useMemo, useState } from 'react';
import { Button, Icon, Notice } from '@/components/ui';
import { AI_MD_FILE, buildAiMd } from './ai-md';
import { Code, H2, P, Table } from './guides';

const kb = (s: string) => `${(new Blob([s]).size / 1024).toFixed(1)} KB`;

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Guía «Integrar con IA»: el .md listo para dárselo a un asistente, con vista previa, copia y descarga. */
export function AiGuide() {
  const md = useMemo(() => buildAiMd(), []);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const lines = md.split('\n');
  const shown = full ? md : lines.slice(0, 28).join('\n') + '\n…';
  async function copy() {
    try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sin permiso: la persona puede descargarlo */ }
  }
  return (
    <>
      <P>Descarga este archivo, ponlo en tu proyecto y pídele a tu asistente (Claude Code, Codex, Cursor, Copilot…) que integre Qhub. Trae la URL, la autenticación, los roles, el ciclo de un turno, un cliente de referencia, todos los endpoints con ejemplos, el tiempo real, los errores y una lista de comprobación; así la IA no tiene que adivinar nada. Si prefieres no descargarlo, puedes verlo o copiarlo aquí mismo.</P>

      <div className="my-6 max-w-[760px] border border-border-subtle bg-layer-01">
        <div className="flex flex-wrap items-center gap-4 border-b border-border-subtle p-4">
          <span aria-hidden className="inline-flex size-12 flex-none items-center justify-center bg-interactive text-text-on-color"><span className="t-label font-semibold">MD</span></span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{AI_MD_FILE}</div>
            <div className="t-caption text-text-secondary">Markdown · {kb(md)} · {lines.length} líneas · para asistentes de IA</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon="copy" kind="tertiary" onClick={() => void copy()}>{copied ? 'Copiado' : 'Copiar'}</Button>
            <Button icon="arrow-right" onClick={() => download('CLAUDE.md', md)}>Descargar CLAUDE.md</Button>
          </div>
        </div>
        <pre tabIndex={0} aria-label="Vista previa del archivo" className={`t-code-sm m-0 overflow-auto whitespace-pre-wrap break-words bg-layer-02 p-4 ${full ? 'max-h-[70vh]' : 'max-h-[360px]'}`}>{shown}</pre>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle p-3">
          <button type="button" onClick={() => setFull((v) => !v)} className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-1 text-link hover:underline"><Icon name={full ? 'chevron-down' : 'chevron-right'} />{full ? 'Ver menos' : 'Ver el archivo completo'}</button>
          <span className="flex flex-wrap gap-4">
            <button type="button" onClick={() => download('AGENTS.md', md)} className="cursor-pointer border-0 bg-transparent p-1 text-link hover:underline">Descargar como AGENTS.md</button>
            <button type="button" onClick={() => download(AI_MD_FILE, md)} className="cursor-pointer border-0 bg-transparent p-1 text-link hover:underline">Descargar como {AI_MD_FILE}</button>
          </span>
        </div>
      </div>

      <H2>Cómo usarlo</H2>
      <Table head={['Herramienta', 'Qué haces con el archivo']} rows={[
        [<b key="1">Claude Code</b>, <>Guárdalo en la raíz de tu proyecto como <Code>CLAUDE.md</Code> y pídele: «Integra la API de Qhub siguiendo CLAUDE.md».</>],
        [<b key="2">Codex y otros agentes</b>, <>Guárdalo como <Code>AGENTS.md</Code> en la raíz y pide lo mismo.</>],
        [<b key="3">Cursor, Copilot, Windsurf…</b>, <>Pega su contenido en las reglas del proyecto, o adjunta el archivo a la conversación.</>],
        [<b key="4">Chat sin acceso al proyecto</b>, <>Pulsa «Copiar», pégalo en el chat y cuéntale tu lenguaje y framework.</>],
      ]} />
      <P>Ya tiene una instrucción para que la IA revise tu proyecto, te pregunte lo que no sepa (qué usuarios tienes y qué rol les toca) y deje la configuración, un cliente reutilizable y un flujo completo probado.</P>
      <Notice kind="warning" title="Tu API key no va en el archivo">El archivo no incluye ninguna credencial: solo dice dónde va (la variable <Code>QHUB_API_KEY</Code>). Genera tu API key en tu <a href="/dev">panel</a> y ponla tú en el entorno; no se la pegues a la IA ni la subas a un repositorio.</Notice>
      <P>También está publicado como archivo estático, por si quieres bajarlo desde una terminal o dárselo a un agente por URL: <Code>/{AI_MD_FILE}</Code>.</P>
    </>
  );
}
