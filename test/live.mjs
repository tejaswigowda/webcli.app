// Acceptance check that needs the real network: every origin, source repo, the audit link and the example's
// input URLs must resolve. Separate from `npm test` because it fails until each origin is actually live.
import fs from 'node:fs';
import path from 'node:path';
import { root } from './serve.mjs';

const data = JSON.parse(fs.readFileSync(path.join(root, 'tools.json'), 'utf8'));
const targets = [
  ...data.tools.map(t => [`${t.name} origin`, t.origin]),
  ...data.tools.filter(t => t.source).map(t => [`${t.name} source`, t.source]),
  [`audit`, data.audit.url],
  ...[].concat(data.example.params.character, data.example.params.motion).map((u, i) => [`example input ${i + 1}`, u]),
];

async function resolves(url) {
  const res = await fetch(url, { method: 'GET', redirect: 'follow', credentials: 'omit', signal: AbortSignal.timeout(20000) });
  await res.body?.cancel();
  return res.ok ? null : `HTTP ${res.status}`;
}

let bad = 0;
for (const [label, url] of targets) {
  let why;
  try { why = await resolves(url); } catch (e) { why = String(e.cause?.code || e.message); }
  if (why) bad++;
  console.log(`${why ? 'FAIL' : 'ok  '} ${label}: ${url}${why ? '  (' + why + ')' : ''}`);
}
const noSource = data.tools.filter(t => !t.source).map(t => t.name);
if (noSource.length) console.log(`note: no public source for ${noSource.join(', ')}`);
process.exit(bad ? 1 : 0);
