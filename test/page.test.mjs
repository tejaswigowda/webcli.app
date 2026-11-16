import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { thirdPartyReferences } from '../scripts/build.mjs';
import { ROOT, line, readJson, similarity, validate } from '../scripts/lib.mjs';
import { renderHome } from '../scripts/render.mjs';

const data = readJson('tools.json');
const page = (f) => readFileSync(path.join(ROOT, f), 'utf8');

test('I3, I5: twelve tools, each in a group, with three clauses and a state', () => {
  assert.equal(data.tools.length, 12);
  assert.deepEqual(validate(data), []);
});

test('I4: no two lines are substitutable', () => {
  for (let i = 0; i < data.tools.length; i++)
    for (let j = i + 1; j < data.tools.length; j++)
      assert.ok(similarity(data.tools[i], data.tools[j]) < 0.75, `${data.tools[i].name} and ${data.tools[j].name} read alike`);
  assert.equal(new Set(data.tools.map(line)).size, data.tools.length);
});

test('I5: a tool is "working" only if its gate table is linked, and the link is not a placeholder', () => {
  for (const t of data.tools.filter((x) => x.state === 'working')) assert.match(t.gates, /^https:\/\/github\.com\/[^/]+\/[^/]+#[a-z-]+$/);
});

test('the committed home page is what tools.json renders', () => {
  assert.equal(page('pages/home.md'), `${renderHome(data).trimEnd()}\n`);
});

test('the old navigation, tool cards and example are restored without browser rendering', () => {
  const html = page('index.html');
  for (const id of ['contract', 'tools', 'example', 'agents', 'privacy']) {
    assert.ok(html.includes(`href="#${id}"`), `missing navigation to ${id}`);
    assert.ok(html.includes(`id="${id}"`), `missing section ${id}`);
  }
  assert.equal((html.match(/<article class="tool"/g) || []).length, data.tools.length);
  for (const t of data.tools) {
    assert.ok(html.includes(`id="tool-${t.name}"`));
    if (t.thumb) {
      assert.ok(existsSync(path.join(ROOT, t.thumb.src)), `missing ${t.thumb.src}`);
      assert.ok(html.includes(`src="/${t.thumb.src}"`));
    }
  }
  for (const shot of data.example.shots) {
    assert.ok(existsSync(path.join(ROOT, shot.src)));
    assert.ok(html.includes(`src="/${shot.src}"`));
  }
  assert.ok(html.includes('Historical measurement'));
  assert.ok(html.includes('schema 3'));
});

test('tool-card data is HTML-escaped, not interpreted as markup', () => {
  const changed = structuredClone(data);
  changed.tools[0].line.in = '<script>alert("x")</script>';
  changed.tools[0].thumb.alt = '" onerror="alert(1)';
  const md = renderHome(changed);
  assert.ok(md.includes('&lt;script&gt;'));
  assert.ok(md.includes('&quot; onerror=&quot;'));
  assert.doesNotMatch(md, /<script>|alt="" onerror=/);
});

test('I1: a page that loads anything from another host is caught', () => {
  assert.deepEqual(thirdPartyReferences('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/x.css"><script src="//cdn.example/a.js"></script>').length, 2);
  assert.deepEqual(thirdPartyReferences('<style>@import url(https://fonts.example/a.css);</style>').length, 1);
  assert.deepEqual(thirdPartyReferences('<link rel="stylesheet" href="x.css"><link rel="canonical" href="https://webcli.app/"><a href="https://ffmpeg.webcli.app/">x</a><meta property="og:image" content="https://raw.githubusercontent.com/x.png">'), []);
});

test('I1, I12: the built pages reference nothing third-party and carry no script but JSON-LD', () => {
  for (const f of ['index.html', 'home/index.html', 'home-after/index.html']) {
    const html = page(f);
    assert.deepEqual(thirdPartyReferences(html), [], f);
    for (const m of html.matchAll(/<script\b([^>]*)>/gi)) assert.match(m[1], /type="application\/ld\+json"/, `${f} has a script that is not JSON-LD`);
    assert.doesNotMatch(html, /\son[a-z]+="/i, `${f} has an event handler`);
  }
});

test('I12: the front page unfurls', () => {
  const html = page('index.html');
  assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+\/images\/og\.png">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/webcli\.app\/">/);
  for (const t of data.tools) assert.ok(html.includes(t.origin), `${t.name} is not linked`);
});

test('I8, I9: the page quotes the ledger and the speed measurement it was built from', () => {
  const ledger = readJson('ledger.json');
  const measure = readJson('measure.json');
  assert.equal(Object.keys(ledger.tools).length, data.tools.length);
  const after = page('pages/home-after.md');
  assert.ok(after.includes(`**${measure.js_files} JavaScript files**`));
  assert.ok(after.includes(`${measure.lcp_ms} ms`));
  assert.ok(after.includes(ledger.method));
});
