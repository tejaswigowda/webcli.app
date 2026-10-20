// Browser checks (Playwright drives the real page; dev/CI only, never part of the site).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { listen, root } from './serve.mjs';

const data = JSON.parse(fs.readFileSync(path.join(root, 'tools.json'), 'utf8'));
let server, origin, browser;
before(async () => {
  ({ server, origin } = await listen());
  try { browser = await chromium.launch(); } catch (e) { server.close(); throw e; }
});
after(async () => { await browser?.close(); server.close(); });

const DONE = 'body[data-webcli-status=done], body[data-webcli-status=error]';

test('egress: loading the page and sitting on it makes requests to its own origin only', async () => {
  const ctx = await browser.newContext();
  const seen = [];
  await ctx.route('**/*', route => {
    const r = route.request();
    seen.push({ url: r.url(), method: r.method(), body: r.postData() });
    return new URL(r.url()).origin === origin ? route.continue() : route.abort();
  });
  const page = await ctx.newPage();
  const violations = [];
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector(DONE);
  await page.waitForTimeout(3000);
  const foreign = seen.filter(s => new URL(s.url).origin !== origin);
  assert.deepEqual(foreign, [], 'requests to other origins');
  assert.ok(seen.every(s => s.method === 'GET' && !s.body), 'every request is a GET with no body');
  assert.deepEqual(violations, [], 'CSP violations');
  assert.deepEqual(await ctx.cookies(), [], 'no cookies');
  const stored = await page.evaluate(() => localStorage.length + sessionStorage.length);
  assert.equal(stored, 0, 'no storage');
  assert.equal((await page.evaluate(() => window.__webcli_result)).ok, true);
  await ctx.close();
});

test('CSP is enforced, not merely declared', async () => {
  const ctx = await browser.newContext();
  await ctx.route(u => new URL(u).origin !== origin, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const outcome = await page.evaluate(() => new Promise(resolve => {
    const events = [];
    document.addEventListener('securitypolicyviolation', e => events.push(e.violatedDirective));
    const s = document.createElement('script');
    s.src = 'https://example.com/x.js';
    document.head.append(s);
    fetch('https://example.com/').then(() => resolve({ events, fetched: true }), () => setTimeout(() => resolve({ events, fetched: false }), 100));
  }));
  assert.equal(outcome.fetched, false);
  assert.ok(outcome.events.some(d => d.startsWith('script-src')), 'script-src violation');
  assert.ok(outcome.events.some(d => d.startsWith('connect-src')), 'connect-src violation');
  const inline = await page.evaluate(() => { window.__x = 0; const s = document.createElement('script'); s.textContent = 'window.__x = 1'; document.head.append(s); return window.__x; });
  assert.equal(inline, 0, 'inline script is blocked');
  const res = await page.request.get(origin + '/');
  assert.match(res.headers()['content-security-policy'], /default-src 'none'.*frame-ancestors 'none'/);
  await ctx.close();
});

test('one source: changing an origin in tools.json changes the rendered page', async () => {
  const changed = structuredClone(data);
  const t = changed.tools.find(t => t.name === 'bodyrig');
  t.origin = 'https://elsewhere.example/';
  changed.tools[0].role = 'A role that exists only in the data file.';
  const ctx = await browser.newContext();
  await ctx.route('**/tools.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(changed) }));
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  assert.equal(await page.getAttribute('[data-testid=tool-bodyrig] h3 a', 'href'), 'https://elsewhere.example/');
  assert.match(await page.textContent('[data-testid=example-url]'), /^https:\/\/elsewhere\.example\/index\.html\?character=/);
  assert.match(await page.textContent('[data-testid=example-script]'), /https:\/\/elsewhere\.example\/index\.html/);
  assert.match(await page.textContent(`[data-testid=tool-${changed.tools[0].name}]`), /only in the data file/);
  await ctx.close();
});

test('renders one card per live tool, planned work separately and without links', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  assert.equal(await page.locator('[data-testid^=tool-]').count(), data.tools.length);
  for (const t of data.tools) {
    assert.equal(await page.getAttribute(`[data-testid=tool-${t.name}] h3 a`, 'href'), t.origin);
  }
  assert.equal(await page.locator('[data-testid=planned] a').count(), 0);
  const planned = await page.textContent('[data-testid=planned]');
  for (const p of data.planned) assert.ok(planned.includes(p.name), p.name);
  for (const p of data.planned) assert.equal(await page.locator(`[data-testid=tool-${p.name}]`).count(), 0, `${p.name} must not be a tool card`);
  assert.ok(!(await page.textContent('[data-testid=tools-list]')).includes('facebind'), 'facebind is not in the tool list');
  assert.deepEqual((await page.evaluate(() => window.__webcli_result)).meta.tools, data.tools.map(t => t.name));
  await ctx.close();
});

test('failure path: a missing tools.json shows a message and sets status=error', async () => {
  const ctx = await browser.newContext();
  await ctx.route('**/tools.json', r => r.fulfill({ status: 500, body: '' }));
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  assert.equal(await page.getAttribute('body', 'data-webcli-status'), 'error');
  assert.match(await page.textContent('[data-testid=tools-list]'), /Could not load/);
  await ctx.close();
});

test('no-JS: the noscript list names every live tool with a working link', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  const links = id => page.$$eval(`[data-testid=${id}] a`, as => as.map(a => [a.textContent, a.href]));
  assert.deepEqual(await links('noscript-tools'), data.tools.filter(t => t.kind === 'artifact').map(t => [t.name, t.origin]));
  assert.deepEqual(await links('noscript-streams'), data.tools.filter(t => t.kind === 'stream').map(t => [t.name, t.origin]));
  assert.ok(await page.isVisible('[data-testid=noscript-tools]'));
  await ctx.close();
});

for (const width of [320, 360, 390]) {
  test(`mobile: no horizontal scroll at ${width}px`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height: 740 }, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(origin + '/');
    await page.waitForSelector(DONE);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, font: parseFloat(getComputedStyle(document.body).fontSize) }));
    assert.ok(m.sw <= m.cw, `scrollWidth ${m.sw} > clientWidth ${m.cw}`);
    assert.ok(m.font >= 16);
    await ctx.close();
  });
}

test('the worked example on the page is built from the data and shows the documented result', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const url = await page.textContent('[data-testid=example-url]');
  const u = new URL(url);
  const tool = data.tools.find(t => t.name === data.example.tool);
  assert.equal(u.origin + '/', tool.origin);
  assert.equal(u.searchParams.get('run'), 'bake');
  assert.deepEqual(JSON.parse(await page.textContent('[data-testid=example-result]')), data.example.result);
  await ctx.close();
});

test('syntax highlighting: every code block is highlighted and its text is unchanged', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const blocks = await page.$$eval('pre code', cs => cs.map(c => ({
    lang: c.getAttribute('data-lang'), hl: c.getAttribute('data-hl'), tokens: c.querySelectorAll('span[class^=tok-]').length, text: c.textContent,
  })));
  assert.ok(blocks.length === 5, 'expected the static and generated code blocks');
  for (const b of blocks) {
    assert.ok(b.lang, 'every code block declares a language');
    assert.equal(b.hl, b.lang, `${b.lang} block was not highlighted`);
    assert.ok(b.tokens > 0, `${b.lang} block has no tokens`);
  }
  const byLang = l => blocks.filter(b => b.lang === l);
  assert.deepEqual(new Set(blocks.map(b => b.lang)), new Set(['js', 'json', 'bash', 'url']));
  // the highlighter must not alter what a user would copy
  assert.deepEqual(JSON.parse(byLang('json')[0].text), data.example.result);
  assert.match(byLang('url')[0].text, /^https:\/\/bodyrig\.webcli\.app\/index\.html\?character=https:\/\/cdn\.jsdelivr\.net\/gh\/miver-player\/miver\.xyz%40b5c05aed/);
  const colours = await page.$$eval('code span[class^=tok-]', ss => new Set(ss.map(s => getComputedStyle(s).color)).size);
  assert.ok(colours >= 4, 'token classes are styled with distinct colours');
  await ctx.close();
});

test('highlighting still works when tools.json fails (static blocks)', async () => {
  const ctx = await browser.newContext();
  await ctx.route('**/tools.json', r => r.fulfill({ status: 500, body: '' }));
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  assert.equal(await page.locator('[data-testid=agent-surface] code[data-hl=js] span[class^=tok-]').count() > 0, true);
  assert.equal(await page.locator('[data-testid=machine-path] code[data-hl=bash] span[class^=tok-]').count() > 0, true);
  await ctx.close();
});

test('cards declare egress and fetches; streams get their own shelf; the agent line is computed from the data', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const artifacts = data.tools.filter(t => t.kind === 'artifact'), streams = data.tools.filter(t => t.kind === 'stream');
  assert.equal(await page.locator('[data-testid=tools-list] [data-testid^=tool-]').count(), artifacts.length);
  assert.equal(await page.locator('[data-testid=streams-list] [data-testid^=tool-]').count(), streams.length);
  for (const t of streams) {
    assert.equal(await page.locator(`[data-testid=tools-list] [data-testid=tool-${t.name}]`).count(), 0, `${t.name} is not in the artifact list`);
    assert.match(await page.textContent(`[data-testid=tool-${t.name}]`), /websocket URL you supply/);
  }
  for (const t of data.tools) {
    const text = await page.textContent(`[data-testid=tool-${t.name}]`);
    for (const f of t.fetches ?? []) assert.ok(text.includes(f), `${t.name} card lists ${f}`);
    if (t.fetches === null) assert.match(text, /not audited yet/);
  }
  const agents = data.tools.filter(t => t.agent);
  const line = await page.textContent('[data-testid=agent-status]');
  assert.ok(line.includes(`${agents.length} of ${data.tools.length} tools`) && agents.every(t => line.includes(t.name)), line);
  const planned = await page.textContent('[data-testid=planned]');
  assert.match(planned, /glb-fbx.*cloud tier would be non-zero-egress/);
  await ctx.close();
});

test('copy buttons: every code block has one, it copies exactly the code, and it falls back when the clipboard is denied', async () => {
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const blocks = page.locator('.codeblock');
  assert.equal(await blocks.count(), 5);
  assert.equal(await page.locator('pre:not(.codeblock pre)').count(), 0, 'no code block without a copy bar');
  for (let i = 0; i < 5; i++) {
    const block = blocks.nth(i);
    const want = await block.locator('pre code').textContent();
    await block.locator('button.copy').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), want, `block ${i}`);
    assert.equal(await block.locator('.copy-status').textContent(), 'Copied');
    const box = await block.locator('button.copy').boundingBox();
    assert.ok(box.height >= 40 && box.width >= 44, 'tap target');
  }
  await ctx.close();

  const denied = await browser.newContext();
  await denied.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }); });
  const p2 = await denied.newPage();
  await p2.goto(origin + '/');
  await p2.waitForSelector(DONE);
  await p2.locator('[data-testid=agent-surface]').locator('xpath=..').locator('button.copy').click();
  assert.match(await p2.locator('[data-testid=agent-surface]').locator('xpath=..').locator('.copy-status').textContent(), /Ctrl\/Cmd\+C/);
  assert.match(await p2.evaluate(() => getSelection().toString()), /waitForSelector/);
  await denied.close();
});

test('layout: the column is centred on a wide screen', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const { left, right } = await page.evaluate(() => { const r = document.body.getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right }; });
  assert.ok(left > 100 && Math.abs(left - right) <= 1, `left ${left}, right ${right}`);
  await ctx.close();
});

const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const rgb = c => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

for (const scheme of ['light', 'dark']) {
  test(`contrast: text meets WCAG AA (4.5:1) in ${scheme} mode`, async () => {
    const ctx = await browser.newContext({ colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(origin + '/');
    await page.waitForSelector(DONE);
    const pairs = await page.evaluate(() => {
      const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; } return 'rgb(255,255,255)'; };
      const out = [];
      for (const sel of ['.lead', '.tool dt', '.tool .meta', '.caveat', '.badge.no', '.badge.yes', 'a', 'footer', '.codebar .lang', '.copy', 'pre code', 'h2', '.tool p']) {
        for (const e of document.querySelectorAll(sel)) { out.push([sel, getComputedStyle(e).color, bgOf(e)]); }
      }
      for (const e of document.querySelectorAll('pre [class^=tok-]')) out.push(['.' + e.className, getComputedStyle(e).color, bgOf(e)]);
      return out;
    });
    assert.ok(pairs.length > 40);
    const bad = pairs.filter(([, fg, bg]) => ratio(rgb(fg), rgb(bg)) < 4.5).map(([sel, fg, bg]) => `${sel} ${fg} on ${bg} = ${ratio(rgb(fg), rgb(bg)).toFixed(2)}`);
    assert.deepEqual([...new Set(bad)], []);
    await ctx.close();
  });
}

test('sentinels render as plain words, posecast states where its stream goes', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(origin + '/');
  await page.waitForSelector(DONE);
  const mocap = await page.textContent('[data-testid=tool-mocap]');
  assert.match(mocap, /source: private repository/);
  assert.match(mocap, /licence: not published yet/);
  assert.match(await page.textContent('[data-testid=tool-chat]'), /licence: not published yet/);
  const pc = await page.textContent('[data-testid=tool-posecast]');
  assert.match(pc, /websocket URL you supply \(default: on your own machine\)/);
  assert.match(pc, /leaves the device only if you point it off the device/);
  assert.match(await page.textContent('[data-testid=licences]'), /mocap: not published yet/);
  // the "only bodyrig" caveat sits directly under the agent-surface heading
  const next = await page.evaluate(() => document.querySelector('#contract h3').nextElementSibling.id);
  assert.equal(next, 'agent-status');
  await ctx.close();
});
