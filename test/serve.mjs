// Dev/CI static server: serves the repo root as-is and applies _headers, so tests see what production sends.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
};

export function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) { cur = null; continue; }
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: {} }; rules.push(cur); continue; }
    const i = line.indexOf(':');
    if (cur && i > 0) cur.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return rules;
}

const matches = (pattern, p) => pattern === '/*' || pattern === p;

export function createServer() {
  const rules = parseHeaders(fs.readFileSync(path.join(root, '_headers'), 'utf8'));
  return http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(root, rel);
    const served = !rel.startsWith('/test/') && !rel.startsWith('/node_modules/') && !rel.startsWith('/.git');
    if (!file.startsWith(root) || !served) { res.writeHead(404); return res.end('Not found'); }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
      const headers = { 'content-type': types[path.extname(file)] || 'application/octet-stream' };
      for (const r of rules) if (matches(r.pattern, rel)) Object.assign(headers, r.headers);
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    });
  });
}

export function listen(port = 0) {
  const server = createServer();
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { origin } = await listen(Number(process.env.PORT) || 8080);
  console.log(origin);
}
