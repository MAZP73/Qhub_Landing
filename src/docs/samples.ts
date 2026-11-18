import type { Sample } from '@/components/CodeBlock';
import { API_BASE } from '@/lib/config';
import type { Endpoint } from './spec';

export interface SampleCtx { token: string | null; userId: string; role: string }
const pretty = (v: unknown) => JSON.stringify(v, null, 2);
export const fillPath = (p: string) => p.replace(/\{(\w+)\}/g, '<$1>');

type Hdr = [name: string, value: string, kind: 'token' | 'plain'];
export interface ReqSpec { method: string; url: string; headers: Hdr[]; body?: unknown; noContent?: boolean; real: string | null }

const jsonLit = (v: unknown) => JSON.stringify(v);
const sq = (t: string) => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;   // cadena entre comillas simples (PHP, Ruby)

/** Genera el mismo request en cada lenguaje. Sin credencial real, la API key se lee de la variable de entorno `QHUB_API_KEY`. */
export function requestSamples(r: ReqSpec): Sample[] {
  const { method, url, headers, body, real } = r;
  const hasBody = body !== undefined;
  const noKey = !real && headers.some((h) => h[2] === 'token');
  const val = (v: string, t: Hdr[2], tok: (v: string) => string) => (t === 'token' ? tok(v) : JSON.stringify(v));

  // cURL
  const curlH = headers.map(([k, v, t]) => `  -H "${k}: ${t === 'token' ? `${v}${real ?? '$QHUB_API_KEY'}` : v}"`);
  const curl = [`curl -X ${method} "${url}"`, ...curlH, ...(hasBody ? [`  -d '${jsonLit(body)}'`] : [])].join(' \\\n');

  // JavaScript
  const jsH = headers.map(([k, v, t]) => `    "${k}": ${val(v, t, (x) => (real ? `"${x}${real}"` : `\`${x}\${process.env.QHUB_API_KEY}\``))},`).join('\n');
  const js = [
    `const res = await fetch("${url}", {`, `  method: "${method}",`, ...(headers.length ? ['  headers: {', jsH, '  },'] : []),
    ...(hasBody ? [`  body: JSON.stringify(${pretty(body).replace(/\n/g, '\n  ')}),`] : []), '});',
    ...(r.noContent ? ['console.log(res.status); // 204'] : ['const data = await res.json();', 'console.log(data);']),
  ].join('\n');

  // Python
  const pyH = headers.map(([k, v, t]) => `        "${k}": ${val(v, t, (x) => (real ? `"${x}${real}"` : `f"${x}{os.environ['QHUB_API_KEY']}"`))},`).join('\n');
  const py = [
    ...(noKey ? ['import os'] : []), 'import requests', '',
    `res = requests.${method.toLowerCase()}(`, `    "${url}",`, ...(headers.length ? ['    headers={', pyH, '    },'] : []),
    ...(hasBody ? [`    json=${pretty(body).replace(/\n/g, '\n    ').replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')},`] : []), ')',
    ...(r.noContent ? ['print(res.status_code)  # 204'] : ['print(res.json())']),
  ].join('\n');

  // Java (11+)
  const javaH = headers.map(([k, v, t]) => `        .header("${k}", ${val(v, t, (x) => (real ? `"${x}${real}"` : `"${x}" + System.getenv("QHUB_API_KEY")`))})`);
  const java = [
    'import java.net.URI;', 'import java.net.http.HttpClient;', 'import java.net.http.HttpRequest;', 'import java.net.http.HttpResponse;', '',
    'public class Qhub {', '    public static void main(String[] args) throws Exception {',
    '        HttpRequest req = HttpRequest.newBuilder()', `        .uri(URI.create("${url}"))`.replace(/^/, '    '), ...javaH.map((l) => '    ' + l),
    hasBody
      ? `            .method("${method}", HttpRequest.BodyPublishers.ofString("""\n${pretty(body).split('\n').map((l) => '                ' + l).join('\n')}\n                """))`
      : `            .method("${method}", HttpRequest.BodyPublishers.noBody())`,
    '            .build();', '',
    '        HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());',
    '        System.out.println(res.statusCode());', ...(r.noContent ? [] : ['        System.out.println(res.body());']), '    }', '}',
  ].join('\n');

  // C# (.NET 6+)
  const csM = ({ GET: 'Get', POST: 'Post', PUT: 'Put', PATCH: 'Patch', DELETE: 'Delete' } as Record<string, string>)[method] ?? 'Get';
  const csH = headers.filter(([k]) => k !== 'Content-Type').map(([k, v, t]) => `req.Headers.Add("${k}", ${val(v, t, (x) => (real ? `"${x}${real}"` : `"${x}" + Environment.GetEnvironmentVariable("QHUB_API_KEY")`))});`);
  const cs = [
    'using System;', 'using System.Net.Http;', ...(hasBody ? ['using System.Text;'] : []), '',
    'var http = new HttpClient();', `var req = new HttpRequestMessage(HttpMethod.${csM}, "${url}");`, ...csH,
    ...(hasBody ? [`req.Content = new StringContent(@"${jsonLit(body).replace(/"/g, '""')}", Encoding.UTF8, "application/json");`] : []), '',
    'var res = await http.SendAsync(req);', 'Console.WriteLine((int)res.StatusCode);', ...(r.noContent ? [] : ['Console.WriteLine(await res.Content.ReadAsStringAsync());']),
  ].join('\n');

  // Go
  const goH = headers.map(([k, v, t]) => `\treq.Header.Set("${k}", ${val(v, t, (x) => (real ? `"${x}${real}"` : `"${x}"+os.Getenv("QHUB_API_KEY")`))})`);
  const goImports = ['fmt', 'io', 'net/http', ...(noKey ? ['os'] : []), ...(hasBody ? ['strings'] : [])].sort();
  const go = [
    'package main', '', 'import (', ...goImports.map((i) => `\t"${i}"`), ')', '', 'func main() {',
    ...(hasBody ? [`\tbody := strings.NewReader(\`${jsonLit(body)}\`)`] : []),
    `\treq, _ := http.NewRequest("${method}", "${url}", ${hasBody ? 'body' : 'nil'})`, ...goH, '',
    '\tres, err := http.DefaultClient.Do(req)', '\tif err != nil {', '\t\tpanic(err)', '\t}', '\tdefer res.Body.Close()',
    ...(r.noContent ? ['\tfmt.Println(res.StatusCode)'] : ['\tdata, _ := io.ReadAll(res.Body)', '\tfmt.Println(res.StatusCode, string(data))']), '}',
  ].join('\n');

  // PHP
  const phpH = headers.map(([k, v, t]) => `        "${k}: ${t === 'token' ? (real ? `${v}${real}` : `${v}" . getenv("QHUB_API_KEY") . "`) : v}",`).map((l) => l.replace(/ \. ""(,)$/, '$1').replace(/ \. "",$/, ','));
  const php = [
    '<?php', `$ch = curl_init("${url}");`, 'curl_setopt_array($ch, [', `    CURLOPT_CUSTOMREQUEST => "${method}",`, '    CURLOPT_RETURNTRANSFER => true,',
    ...(headers.length ? ['    CURLOPT_HTTPHEADER => [', ...phpH, '    ],'] : []),
    ...(hasBody ? [`    CURLOPT_POSTFIELDS => ${sq(jsonLit(body))},`] : []), ']);', '',
    '$body = curl_exec($ch);', 'echo curl_getinfo($ch, CURLINFO_HTTP_CODE), "\\n";', ...(r.noContent ? [] : ['echo $body, "\\n";']),
  ].join('\n');

  // Ruby
  const rbM = csM;
  const rbH = headers.map(([k, v, t]) => `req["${k}"] = ${t === 'token' ? (real ? `"${v}${real}"` : `"${v}#{ENV['QHUB_API_KEY']}"`) : JSON.stringify(v)}`);
  const ruby = [
    'require "net/http"', 'require "uri"', '', `uri = URI("${url}")`, `req = Net::HTTP::${rbM}.new(uri)`, ...rbH,
    ...(hasBody ? [`req.body = ${sq(jsonLit(body))}`] : []), '',
    'res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(req) }',
    'puts res.code', ...(r.noContent ? [] : ['puts res.body']),
  ].join('\n');

  return [
    { lang: 'curl', code: curl }, { lang: 'js', code: js }, { lang: 'python', code: py }, { lang: 'java', code: java },
    { lang: 'csharp', code: cs }, { lang: 'go', code: go }, { lang: 'php', code: php }, { lang: 'ruby', code: ruby },
  ];
}

/** Ejemplos de un endpoint de la especificación. */
export function buildSamples(ep: Endpoint, c: SampleCtx): Sample[] {
  const headers: Hdr[] = [];
  if (ep.auth !== 'none') headers.push(['Authorization', 'Bearer ', 'token']);
  if (ep.auth === 'actor') { headers.push(['X-Usuario-Id', c.userId, 'plain']); headers.push(['X-Usuario-Rol', ep.roles ?? c.role, 'plain']); }
  if (ep.bodyExample) headers.push(['Content-Type', 'application/json', 'plain']);
  return requestSamples({ method: ep.method, url: `${API_BASE}${fillPath(ep.path)}`, headers, body: ep.bodyExample, noContent: ep.status === 204, real: c.token });
}

/** Ejemplos para las guías: una llamada de negocio con usuario y rol fijos. */
export function guideSamples(method: string, path: string, o: { userId?: string; role?: string; body?: unknown } = {}): Sample[] {
  const headers: Hdr[] = [['Authorization', 'Bearer ', 'token']];
  if (o.role) { headers.push(['X-Usuario-Id', o.userId ?? 'admin-1', 'plain']); headers.push(['X-Usuario-Rol', o.role, 'plain']); }
  if (o.body !== undefined) headers.push(['Content-Type', 'application/json', 'plain']);
  return requestSamples({ method, url: `${API_BASE}${path}`, headers, body: o.body, real: null });
}

export function responseSample(ep: Endpoint): string {
  const head = `HTTP/1.1 ${ep.status}`;
  return ep.response === undefined ? `${head}${ep.responseNote ? `\n\n// ${ep.responseNote}` : ''}` : `${head}\n\n${pretty(ep.response)}`;
}
