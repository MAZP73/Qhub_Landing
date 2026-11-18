import type { Sample } from '@/components/CodeBlock';
import { API_BASE } from '@/lib/config';
import type { Endpoint } from './spec';

export interface SampleCtx { token: string | null; userId: string; role: string }
const pretty = (v: unknown) => JSON.stringify(v, null, 2);
export const fillPath = (p: string) => p.replace(/\{(\w+)\}/g, '<$1>');

/** Ejemplos de llamada (cURL, JavaScript, Python). Sin credencial real usa una variable de entorno `QHUB_API_KEY`. */
export function buildSamples(ep: Endpoint, c: SampleCtx): Sample[] {
  const url = `${API_BASE}${fillPath(ep.path)}`;
  const headers: Array<[string, string, 'token' | 'plain']> = [];
  if (ep.auth !== 'none') headers.push(['Authorization', 'Bearer ', 'token']);
  if (ep.auth === 'actor') { headers.push(['X-Usuario-Id', c.userId, 'plain']); headers.push(['X-Usuario-Rol', ep.roles ?? c.role, 'plain']); }
  if (ep.bodyExample) headers.push(['Content-Type', 'application/json', 'plain']);
  const real = c.token;

  const curlH = headers.map(([k, v, t]) => `  -H "${k}: ${t === 'token' ? `${v}${real ?? '$QHUB_API_KEY'}` : v}"`);
  const curl = [`curl -X ${ep.method} "${url}"`, ...curlH, ...(ep.bodyExample ? [`  -d '${JSON.stringify(ep.bodyExample)}'`] : [])].join(' \\\n');

  const jsTok = (v: string) => (real ? `"${v}${real}"` : `\`${v}\${process.env.QHUB_API_KEY}\``);
  const jsH = headers.map(([k, v, t]) => `    "${k}": ${t === 'token' ? jsTok(v) : `"${v}"`},`).join('\n');
  const js = [
    `const res = await fetch("${url}", {`, `  method: "${ep.method}",`, ...(headers.length ? ['  headers: {', jsH, '  },'] : []),
    ...(ep.bodyExample ? [`  body: JSON.stringify(${pretty(ep.bodyExample).replace(/\n/g, '\n  ')}),`] : []), '});',
    ...(ep.status === 204 ? ['console.log(res.status); // 204'] : ['const data = await res.json();', 'console.log(data);']),
  ].join('\n');

  const pyTok = (v: string) => (real ? `"${v}${real}"` : `f"${v}{os.environ['QHUB_API_KEY']}"`);
  const pyH = headers.map(([k, v, t]) => `        "${k}": ${t === 'token' ? pyTok(v) : `"${v}"`},`).join('\n');
  const needsOs = !real && ep.auth !== 'none';
  const py = [
    ...(needsOs ? ['import os'] : []), 'import requests', '',
    `res = requests.${ep.method.toLowerCase()}(`, `    "${url}",`, ...(headers.length ? ['    headers={', pyH, '    },'] : []),
    ...(ep.bodyExample ? [`    json=${pretty(ep.bodyExample).replace(/\n/g, '\n    ').replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')},`] : []), ')',
    ...(ep.status === 204 ? ['print(res.status_code)  # 204'] : ['print(res.json())']),
  ].join('\n');
  return [{ lang: 'curl', code: curl }, { lang: 'js', code: js }, { lang: 'python', code: py }];
}

export function responseSample(ep: Endpoint): string {
  const head = `HTTP/1.1 ${ep.status}`;
  return ep.response === undefined ? `${head}${ep.responseNote ? `\n\n// ${ep.responseNote}` : ''}` : `${head}\n\n${pretty(ep.response)}`;
}
