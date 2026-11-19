import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const SRC = fileURLToPath(new URL('./src', import.meta.url));
const AI_MD = 'qhub-api.md';

/** Publica /qhub-api.md (el .md para asistentes de IA) generado desde la misma especificación de la documentación. */
function aiMarkdown(): Plugin {
  let cfg: ResolvedConfig;
  async function generate(): Promise<string> {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg.env)) if (k.startsWith('VITE_')) env[k] = String(v);
    const out = await build({
      entryPoints: [`${SRC}/docs/ai-md.ts`], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
      alias: { '@': SRC }, define: { 'import.meta.env': JSON.stringify(env) },
    });
    const code = out.outputFiles[0]!.text;
    const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`) as { buildAiMd: () => string };
    return mod.buildAiMd();
  }
  return {
    name: 'qhub-ai-markdown',
    configResolved(c) { cfg = c; },
    configureServer(server) {
      server.middlewares.use(`/${AI_MD}`, (_req, res, next) => {
        generate().then((md) => { res.setHeader('Content-Type', 'text/markdown; charset=utf-8'); res.end(md); }, next);
      });
    },
    async generateBundle() { this.emitFile({ type: 'asset', fileName: AI_MD, source: await generate() }); },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiMarkdown()],
  resolve: { alias: { '@': SRC } },
});
