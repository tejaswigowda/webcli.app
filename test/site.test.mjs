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

test('tools.json validates against schema/1.json', () => {
  const validate = new Ajv({ strict: false }).compile(JSON.parse(read('schema/1.json')));
  assert.ok(validate(data), JSON.stringify(validate.errors, null, 2));
  assert.equal(data.schema, 1);
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

test('noscript list names every live tool with its origin', () => {
  const block = html.match(/<ul data-testid="noscript-tools">([\s\S]*?)<\/ul>/)?.[1] ?? '';
  const hrefs = [...block.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(m => [m[2], m[1]]);
  assert.deepEqual(hrefs, data.tools.map(t => [t.name, t.origin]));
});

test('static contract text agrees with tools.json contract', () => {
  const c = data.contract;
  assert.ok(html.includes(`<code>${c.run_param}=</code>`));
  assert.ok(html.includes(c.result_handle));
  assert.ok(html.includes(c.status_values.join(' | ')));
  assert.ok(html.includes('data-webcli-status'));
});

test('privacy section names every planned non-zero-egress tool', () => {
  const section = html.match(/<section id="privacy">([\s\S]*?)<\/section>/)[1];
  for (const p of data.planned.filter(p => p.egress)) assert.ok(section.includes(`<code>${p.name}</code>`), p.name);
});

test('the audit link in the HTML matches tools.json', () => {
  assert.ok(html.includes(`id="audit-link" href="${data.audit.url}"`));
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
  for (const f of ['app.js']) assert.doesNotMatch(read(f), /localStorage|sessionStorage|indexedDB|document\.cookie|XMLHttpRequest|WebSocket|sendBeacon|import\s*\(|https?:\/\/(?!json-schema)/, f);
  assert.doesNotMatch(read('style.css'), /@import|url\(\s*["']?(https?:)?\/\//);
});

test('no build step: no bundler config, no lockfile-driven runtime deps', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
  assert.ok(!pkg.scripts?.build);
});
