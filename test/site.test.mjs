// Static checks: no browser needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import { root, parseHeaders } from './serve.mjs';

const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const data = JSON.parse(read('tools.json'));
const html = read('index.html');

test('tools.json validates against schema/2.json', () => {
  const validate = new Ajv({ strict: false }).compile(JSON.parse(read('schema/2.json')));
  assert.ok(validate(data), JSON.stringify(validate.errors, null, 2));
  assert.equal(data.schema, 2);
});

test('/.well-known/webcli.json is an identical copy', () => {
  assert.equal(read('.well-known/webcli.json'), read('tools.json'));
});

test('tools: live only; planned entries carry no origin or link', () => {
  assert.ok(data.tools.length > 0);
  for (const t of data.tools) assert.equal(t.status, 'live', t.name);
  for (const p of data.planned) {
    assert.equal('origin' in p, false, p.name);
    assert.doesNotMatch(p.note, /https?:\/\//, p.name);
  }
  const names = new Set(data.tools.map(t => t.name));
  for (const p of data.planned) assert.equal(names.has(p.name), false, `${p.name} is both live and planned`);
});

test('tools: names and origins are unique; agent tools describe run=', () => {
  assert.equal(new Set(data.tools.map(t => t.name)).size, data.tools.length);
  assert.equal(new Set(data.tools.map(t => t.origin)).size, data.tools.length);
  for (const t of data.tools.filter(t => t.agent)) {
    assert.ok(t.params.some(p => p.name === data.contract.run_param), `${t.name} has no ${data.contract.run_param} param`);
    assert.ok(t.result?.handle === data.contract.result_handle, t.name);
  }
});

test('example: refers to an agent tool, and its params are declared by that tool', () => {
  const tool = data.tools.find(t => t.name === data.example.tool);
  assert.ok(tool?.agent);
  const declared = new Set(tool.params.map(p => p.name));
  for (const k of Object.keys(data.example.params)) assert.ok(declared.has(k), k);
  for (const p of tool.params.filter(p => p.required)) assert.ok(p.name in data.example.params, `missing required ${p.name}`);
  assert.equal(data.example.result.ok, true);
});

const noscriptLinks = id => {
  const block = html.match(new RegExp(`<ul data-testid="${id}">([\\s\\S]*?)</ul>`))?.[1] ?? '';
  return [...block.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(m => [m[2], m[1]]);
};

test('noscript lists name every live tool with its origin, artifacts and streams separately', () => {
  assert.deepEqual(noscriptLinks('noscript-tools'), data.tools.filter(t => t.kind === 'artifact').map(t => [t.name, t.origin]));
  assert.deepEqual(noscriptLinks('noscript-streams'), data.tools.filter(t => t.kind === 'stream').map(t => [t.name, t.origin]));
});

test('static contract text agrees with tools.json contract', () => {
  const c = data.contract;
  assert.ok(html.includes(`<code>${c.run_param}=</code>`));
  assert.ok(html.includes(c.result_handle));
  assert.ok(html.includes(c.status_values.join(' | ')));
  assert.ok(html.includes('data-webcli-status'));
});

test('privacy section: names every live stream tool and points at planned cloud tiers without naming them as live', () => {
  const section = html.match(/<section id="privacy">([\s\S]*?)<\/section>/)[1];
  for (const t of data.tools.filter(t => t.egress !== 'none')) assert.ok(section.includes(t.name), `${t.name} egress is disclosed in the privacy section`);
  if (data.planned.some(p => p.egress)) assert.ok(section.includes('data-testid="egress-exception"'));
  for (const p of data.planned) assert.ok(!section.includes(`<code>${p.name}</code>`), `${p.name} is planned and is not part of the privacy promise`);
});

test('audits and the paper are linked from the HTML, and match tools.json', () => {
  for (const a of data.audits) assert.ok(html.includes(`href="${a.url}"`), a.url);
  assert.ok(data.audits.some(a => a.listed), 'at least one audit targets a live tool');
  for (const a of data.audits) assert.equal(a.listed, data.tools.some(t => t.name === a.tool), `${a.tool} listed flag`);
  assert.ok(html.includes(`id="paper-link" href="${data.paper.url}"`));
  assert.ok(html.includes(`<a href="${data.paper.url}"`), 'paper linked in the lead');
});

test('nav labels match their section headings', () => {
  const nav = [...html.match(/<nav[\s\S]*?<\/nav>/)[0].matchAll(/<a href="#([^"]+)">([^<]+)<\/a>/g)];
  assert.ok(nav.length >= 5);
  for (const [, id, label] of nav) {
    const sec = html.match(new RegExp(`<section id="${id}">\\s*<h2>([^<]+)</h2>`));
    assert.ok(sec, `no section #${id}`);
    assert.ok(sec[1].toLowerCase().includes(label.toLowerCase()), `nav "${label}" vs heading "${sec[1]}"`);
  }
});

test('per-tool contract: stream tools are exactly the non-zero-egress tools, and nothing is promised globally', () => {
  assert.equal(data.contract.egress, 'declared-per-tool');
  for (const t of data.tools) assert.equal(t.kind === 'stream', t.egress !== 'none', t.name);
  for (const t of data.tools.filter(t => t.kind === 'stream')) assert.equal(t.agent, false);
  assert.ok(data.tools.some(t => t.deterministic === 'verified'));
  for (const t of data.tools.filter(t => t.deterministic === 'verified')) assert.equal(t.name, data.example.tool, 'verified determinism is backed by the worked example');
});

test('the schema rejects a manifest that overpromises', () => {
  const validate = new Ajv({ strict: false }).compile(JSON.parse(read('schema/2.json')));
  const mutate = f => { const d = structuredClone(data); f(d); return validate(d); };
  assert.equal(mutate(d => { d.contract.egress = 'none'; }), false, 'global egress const');
  assert.equal(mutate(d => { d.tools.find(t => t.kind === 'stream').egress = 'none'; }), false, 'a stream claiming zero egress');
  assert.equal(mutate(d => { d.tools.find(t => t.kind === 'artifact').egress = 'stream-to-endpoint'; }), false, 'an artifact tool streaming');
  assert.equal(mutate(d => { delete d.tools[0].fetches; }), false, 'fetches is required');
  assert.equal(mutate(d => { d.tools[0].fetches = ['code:somewhere else']; }), false, 'fetches vocabulary');
  assert.equal(mutate(d => { d.tools[0].agent = true; }), false, 'agent:true needs params and a result');
  assert.equal(mutate(d => { d.tools[0].deterministic = 'maybe'; }), false);
  assert.equal(mutate(d => { d.tools.find(t => t.licence === 'unpublished').licence = null; }), false, 'licence is a string, never null');
  assert.equal(mutate(d => { d.tools.find(t => t.source_status !== 'public').source_status = 'public'; }), false, 'public needs a source url');
  assert.equal(mutate(d => { d.tools.find(t => t.source_status === 'public').source = null; }), false, 'a null source needs a non-public status');
  assert.equal(mutate(d => { delete d.tools.find(t => t.kind === 'stream').endpoint; }), false, 'a stream says where it goes');
  assert.equal(mutate(d => { d.tools.find(t => t.kind === 'artifact').endpoint = { set_by: 'user', default: 'local' }; }), false, 'only streams have an endpoint');
  assert.equal(mutate(() => {}), true, 'unmodified manifest is valid');
});

test('CSP: meta tag and _headers agree, and are locked down', () => {
  const meta = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const header = parseHeaders(read('_headers')).find(r => r.pattern === '/*').headers['Content-Security-Policy'];
  const dirs = s => Object.fromEntries(s.split(';').map(d => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(' ')]));
  const m = dirs(meta), h = dirs(header);
  for (const [k, v] of Object.entries(m)) assert.equal(h[k], v, k);
  assert.equal(m['default-src'], "'none'");
  for (const k of ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src']) assert.equal(m[k], "'self'", k);
  assert.equal(h['frame-ancestors'], "'none'");
  assert.doesNotMatch(meta + header, /unsafe-|https?:|\*/);
});

test('page source: no third-party URLs in loaded resources, no inline script/style, no storage', () => {
  const loaded = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  const asset = loaded.filter(u => !/^#/.test(u));
  // anchors that navigate away are fine; resources loaded by the page must be same-origin
  for (const m of html.matchAll(/<(script|link|img|iframe|video|audio|source|embed|object)\b[^>]*>/g)) {
    const u = m[0].match(/\b(?:src|href)="([^"]+)"/)?.[1];
    if (u) assert.doesNotMatch(u, /^(https?:)?\/\//, m[0]);
  }
  assert.ok(asset.length > 0);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);
  assert.doesNotMatch(html, /<style/);
  assert.doesNotMatch(html, /\son[a-z]+=/);
  for (const f of ['app.js', 'highlight.js']) assert.doesNotMatch(read(f), /localStorage|sessionStorage|indexedDB|document\.cookie|XMLHttpRequest|WebSocket|sendBeacon|import\s*\(|https?:\/\/(?!json-schema)/, f);
  assert.doesNotMatch(read('style.css'), /@import|url\(\s*["']?(https?:)?\/\//);
});

test('no build step: no bundler config, no lockfile-driven runtime deps', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
  assert.ok(!pkg.scripts?.build);
});

test('machine fields carry the same intent as the page: explicit sentinels, no bare nulls for licence or source', () => {
  for (const t of data.tools) {
    assert.equal(typeof t.licence, 'string', t.name);
    assert.equal(t.source === null, t.source_status !== 'public', t.name);
  }
  assert.ok(data.tools.some(t => t.licence === 'unpublished'));
});
