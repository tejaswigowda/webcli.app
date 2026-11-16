#!/usr/bin/env node
// Gate I10: each repository's GitHub description must equal its line in tools.json.
//   node scripts/check-descriptions.mjs            exit 1 on any difference (CI)
//   node scripts/check-descriptions.mjs --apply    set the descriptions with the gh CLI (your own repositories, needs write access)
import { spawnSync } from 'node:child_process';
import { line, readJson } from './lib.mjs';

const apply = process.argv.includes('--apply');
const headers = { accept: 'application/vnd.github+json', 'user-agent': 'webcli.app-check', ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
let failed = 0;
for (const t of readJson('tools.json').tools) {
  const want = line(t);
  const res = await fetch(`https://api.github.com/repos/${t.repository}`, { headers });
  if (res.status === 404 && t.source_status === 'private') {
    console.log(`skip  ${t.name}: the repository is private, so its description cannot be read here`);
    continue;
  }
  if (!res.ok) { console.error(`FAIL  ${t.name}: GitHub answered ${res.status} for ${t.repository}`); failed++; continue; }
  const have = (await res.json()).description || '';
  if (have === want) { console.log(`ok    ${t.name}`); continue; }
  if (apply) {
    const r = spawnSync('gh', ['api', '-X', 'PATCH', `repos/${t.repository}`, '-f', `description=${want}`], { stdio: ['ignore', 'ignore', 'inherit'] });
    console.log(r.status === 0 ? `set   ${t.name}` : `FAIL  ${t.name}: gh could not set it`);
    if (r.status !== 0) failed++;
  } else {
    console.error(`FAIL  ${t.name}: description differs\n        have: ${have || '(empty)'}\n        want: ${want}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
