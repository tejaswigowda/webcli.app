// Proves the worked example on the page runs: takes the script text off the rendered page, points it at the
// example tool's origin (or EXAMPLE_ORIGIN, e.g. a local checkout), runs it as a script, and compares what
// it prints with the documented result; then hashes the GLB. Needs network for the pinned input URLs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { listen, root } from './serve.mjs';

const data = JSON.parse(fs.readFileSync(path.join(root, 'tools.json'), 'utf8'));
const tool = data.tools.find(t => t.name === data.example.tool);
const target = (process.env.EXAMPLE_ORIGIN || tool.origin).replace(/\/?$/, '/');

const { server, origin } = await listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(origin + '/');
await page.waitForSelector('body[data-webcli-status=done]');
const script = (await page.textContent('[data-testid=example-script]')).replaceAll(tool.origin, target);
const url = (await page.textContent('[data-testid=example-url]')).replace(tool.origin, target);
server.close();

const file = path.join(root, 'test', 'out', 'example-pasted.mjs');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, script);
const run = spawnSync(process.execPath, [file], { cwd: root, encoding: 'utf8', timeout: 600000 });
if (run.status !== 0) { console.error(run.stdout, run.stderr); await browser.close(); process.exit(1); }

const printed = JSON.parse(run.stdout);
const want = structuredClone(data.example.result);
delete want.artifact.dataUrl;
const same = JSON.stringify(printed) === JSON.stringify(want);
console.log(same ? 'pasted script prints the documented result' : 'MISMATCH\n' + JSON.stringify(printed, null, 2));

const p2 = await browser.newPage();
await p2.goto(url);
await p2.waitForSelector('body[data-webcli-status=done], body[data-webcli-status=error]', { timeout: 300000 });
const bytes = await p2.evaluate(async () => {
  const r = window.__webcli_result;
  return r?.artifact ? Array.from(new Uint8Array(await (await fetch(r.artifact.dataUrl)).arrayBuffer())) : null;
});
await browser.close();
const sha = bytes && crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
console.log(sha === data.example.artifact_sha256 ? 'artifact sha256 matches' : `SHA MISMATCH ${sha}`);
process.exit(same && sha === data.example.artifact_sha256 ? 0 : 1);
