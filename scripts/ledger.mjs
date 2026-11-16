#!/usr/bin/env node
// Gate I8: the family ledger, measured from outside. For each tool in tools.json: load its origin in a fresh Chrome profile with the cache off,
// leave it idle, cut the network, leave it again, and count what it sent. Writes ledger.json, which the page quotes.
//
// What this does and does not show: it shows what a tool does between load and idle, with the requests it makes while loading listed by
// host (the first stated exception). It does not operate the tool. A representative operation per tool (drop a file, press the button)
// needs that tool's own UI automation; `operations` in ledger.json counts how many exist, and is 0 until they are written.
//
//   node scripts/ledger.mjs [--assert] [tool ...]     (--assert: exit 1 unless every tool loaded and read zero; with names, prints instead of writing)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launch, openPage, sleep } from './cdp.mjs';
import { ROOT, readJson } from './lib.mjs';

const LOAD_IDLE_MS = 8000;
const CUT_IDLE_MS = 5000;

async function cspOf(origin) {
  try {
    const res = await fetch(origin, { signal: AbortSignal.timeout(20000) });
    const html = await res.text();
    const header = res.headers.get('content-security-policy');
    const metas = [...html.matchAll(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi)].map((m) => (m[0].match(/content="([^"]*)"/i) || m[0].match(/content='([^']*)'/i) || [])[1]);
    const policy = [header, ...metas].filter(Boolean).join('; ');
    const connect = (policy.match(/connect-src\s+([^;]+)/i) || [])[1];
    return { present: Boolean(policy), connect_src: connect ? connect.trim() : policy ? '(inherits default-src)' : null };
  } catch {
    return { present: false, connect_src: null };
  }
}

async function measure(tool) {
  const own = new URL(tool.origin).host;
  const chrome = await launch();
  try {
    const page = await openPage(chrome);
    const seen = [];
    let cut = false;
    let afterCut = 0;
    page.on('Network.requestWillBeSent', (p) => {
      const u = p.request.url;
      if (/^(data|blob):/.test(u)) return;
      if (cut) afterCut++;
      else seen.push({ host: new URL(u).host, method: p.request.method, body: p.request.hasPostData ? (p.request.postData || '').length || 1 : 0 });
    });
    await page.send('Network.enable');
    await page.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.send('Page.enable');
    let navError = null;
    try {
      const nav = await page.send('Page.navigate', { url: tool.origin });
      if (nav.errorText) navError = nav.errorText;
    } catch (e) {
      navError = e.message;
    }
    if (navError) return { status: `did not load: ${navError}` };
    await sleep(LOAD_IDLE_MS);
    cut = true;
    await page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await sleep(CUT_IDLE_MS);
    return {
      status: 'loaded',
      requests: seen.length,
      third_party_hosts: [...new Set(seen.map((r) => r.host).filter((h) => h !== own))].sort(),
      non_get: seen.filter((r) => r.method !== 'GET').length,
      body_bytes: seen.reduce((a, r) => a + r.body, 0),
      after_cut_requests: afterCut,
    };
  } finally {
    chrome.close();
  }
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const data = readJson('tools.json');
const result = { measured: new Date().toISOString().slice(0, 10), operations: 0, method: '', tools: {} };
for (const tool of data.tools) {
  if (only.length && !only.includes(tool.name)) continue;
  process.stderr.write(`${tool.name} ... `);
  const [m, csp] = await Promise.all([measure(tool), cspOf(tool.origin)]);
  result.tools[tool.name] = { ...m, csp };
  process.stderr.write(`${m.status}${m.requests !== undefined ? `, ${m.requests} requests` : ''}\n`);
}
result.method = `Each tool's origin was loaded in a fresh Chrome profile with the cache off, left idle for ${LOAD_IDLE_MS / 1000} s, then the network was cut and it was left idle for ${CUT_IDLE_MS / 1000} s more; every request was logged from the DevTools protocol. Hosts other than the tool's own are what it fetched while loading, the first exception above. Non-GET and body bytes count anything that is not a bodiless GET. No tool was operated (that is 0 of ${data.tools.length} representative operations written), so this is load and idle, not use.`;
if (!only.length) writeFileSync(path.join(ROOT, 'ledger.json'), `${JSON.stringify(result, null, 2)}\n`);
else console.log(JSON.stringify(result, null, 2));

// The property, across the family: nothing that is not a bodiless GET, and nothing at all once the network is cut.
const failures = Object.entries(result.tools).flatMap(([name, r]) =>
  r.status !== 'loaded' ? [`${name}: ${r.status}`]
    : [r.non_get && `${name}: ${r.non_get} non-GET request(s)`, r.body_bytes && `${name}: ${r.body_bytes} body byte(s) sent`, r.after_cut_requests && `${name}: ${r.after_cut_requests} request(s) after the network was cut`].filter(Boolean));
if (failures.length) console.error(`ledger is not zero:\n  ${failures.join('\n  ')}`);
if (process.argv.includes('--assert') && failures.length) process.exit(1);
