// Renders tools.json. The only data this page reads is its own same-origin tools.json.
const body = document.body;
const $ = id => document.getElementById(id);

function setStatus(s) {
  body.setAttribute('data-webcli-status', s);
  if (s === 'running') window.__webcli_result = null;
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const k of kids) n.append(k);
  return n;
}

// Only https links from the data file become anchors.
function link(href, text) {
  if (!/^https:\/\//.test(href || '')) return el('span', { text });
  return el('a', { href, rel: 'noopener noreferrer', text });
}

function row(dl, label, node) {
  dl.append(el('dt', { text: label }), el('dd', {}, node));
}

const fetchText = list => (list === null ? 'not audited yet' : list.length ? list.join(', ') : 'nothing');
const REPRO = { verified: 'same input, same bytes (tested)', unverified: 'not verified', 'n/a': 'n/a (a stream)' };

const licenceText = t => (t.licence === 'unpublished' ? 'licence: not published yet' : t.licence + (t.licence_note ? ` (${t.licence_note})` : ''));
const SOURCE_STATUS = { private: 'source: private repository', unpublished: 'source: not published yet' };

function card(t) {
  const badge = el('span', { class: 'badge ' + (t.agent ? 'yes' : 'no'), text: t.agent ? 'run= ✓' : 'no run= yet' });
  const head = el('h3', {}, link(t.origin, t.name), badge);
  const dl = el('dl');
  row(dl, 'in', document.createTextNode(t.inputs.join('; ')));
  row(dl, 'out', document.createTextNode(t.outputs.join('; ')));
  row(dl, 'egress', el('span', { text: t.egress === 'none' ? 'none: your content stays on the device' : 'streamed to a websocket URL you supply (default: on your own machine)' }));
  const optional = t.fetches_optional && t.fetches_optional.length ? `; if enabled: ${t.fetches_optional.join(', ')}` : '';
  row(dl, 'fetches', document.createTextNode(fetchText(t.fetches) + optional));
  row(dl, 'repro', document.createTextNode(REPRO[t.deterministic]));
  if (t.params.length) {
    const fmt = p => {
      const core = p.name + '=' + (p.values ? p.values.join('|') : '') + (p.repeatable ? ' (repeatable)' : '');
      return p.required ? core : `[${core}]`;
    };
    row(dl, 'params', el('span', {}, ...t.params.flatMap((p, i) => [i ? ' ' : '', el('code', { text: fmt(p) })])));
  }
  if (t.result) row(dl, 'result', el('code', { 'data-lang': 'js', text: `${t.result.handle} = ${t.result.shape}` }));
  if (t.testids.length) row(dl, 'testids', document.createTextNode(t.testids.join(', ')));
  const meta = el('p', { class: 'meta' },
    t.source ? link(t.source, 'source') : document.createTextNode(SOURCE_STATUS[t.source_status]),
    ' · ',
    document.createTextNode(licenceText(t)));
  const art = el('article', { class: 'tool', 'data-testid': 'tool-' + t.name }, head, el('p', { text: t.role }), dl);
  if (t.caveat) art.append(el('p', { class: 'caveat', text: t.caveat }));
  art.append(meta);
  return art;
}

function exampleUrl(data) {
  const tool = data.tools.find(t => t.name === data.example.tool);
  const url = new URL(data.example.path, tool.origin);
  for (const [k, v] of Object.entries(data.example.params)) {
    for (const x of [].concat(v)) url.searchParams.append(k, x);
  }
  // ':' and '/' are legal in a query value; leaving them readable keeps the URL pasteable and short
  return url.href.replace(/%3A/g, ':').replace(/%2F/g, '/');
}

// Lets the page be copied into a script verbatim; the status selector and handle come from the contract.
function exampleScript(data) {
  const c = data.contract;
  const sel = c.status_values.filter(s => s === 'done' || s === 'error').map(s => `body[data-webcli-status=${s}]`).join(', ');
  return [
    `import { chromium } from 'playwright';`,
    ``,
    `const url = ${JSON.stringify(exampleUrl(data))};`,
    ``,
    `const browser = await chromium.launch();`,
    `const page = await browser.newPage();`,
    `await page.goto(url);`,
    `await page.waitForSelector(${JSON.stringify(sel)}, { timeout: 300000 });`,
    `const result = await page.evaluate(() => ${c.result_handle});`,
    `await browser.close();`,
    ``,
    `const { dataUrl, ...artifact } = result.artifact;`,
    `console.log(JSON.stringify({ ...result, artifact }, null, 2));`,
  ].join('\n');
}

function renderExample(data) {
  const ex = data.example;
  const box = $('example-body');
  box.replaceChildren(
    el('p', {}, 'Tool: ', el('code', { text: ex.tool }), '. Input: a character and a motion-capture clip, both public and pinned to a commit. The URL starts the bake with ', el('code', { text: 'run=bake' }), ':'),
    el('pre', { 'data-testid': 'example-url' }, el('code', { class: 'url', 'data-lang': 'url', text: exampleUrl(data) })),
    el('p', { text: 'Run it from a script (Node and Playwright):' }),
    el('pre', { 'data-testid': 'example-script' }, el('code', { 'data-lang': 'js', text: exampleScript(data) })),
    el('p', {}, 'It prints this object (', el('code', { text: 'dataUrl' }), ' is the GLB itself, elided here):'),
    el('pre', { 'data-testid': 'example-result' }, el('code', { 'data-lang': 'json', text: JSON.stringify(ex.result, null, 2) })),
    el('p', { class: 'meta' }, `The GLB's SHA-256 is ${ex.artifact_sha256}; the same inputs give the same bytes. Last verified: ${ex.verified}.`),
  );
}

function render(data) {
  const list = $('tools-list');
  list.replaceChildren(...data.tools.filter(t => t.kind === 'artifact').map(card));
  $('streams-list').replaceChildren(...data.tools.filter(t => t.kind === 'stream').map(card));

  const agents = data.tools.filter(t => t.agent).map(t => t.name);
  $('agent-status').textContent = agents.length
    ? `Implemented today by ${agents.join(', ')} (${agents.length} of ${data.tools.length} tools). The other tools do not have it yet.`
    : 'No tool implements it yet.';

  const planned = $('planned');
  planned.replaceChildren('Planned, not live: ');
  data.planned.forEach((p, i) => {
    planned.append(i ? '; ' : '', el('strong', { text: p.name }), ` (${p.note}${p.egress === 'cloud-tier' ? '; its cloud tier would be non-zero-egress and would be labelled as such' : ''})`);
  });
  planned.append('.');

  renderExample(data);
  enhance();

  const lic = $('licences');
  lic.replaceChildren(...data.tools.map(t => el('li', {}, el('code', { text: t.name }), ': ', licenceText(t).replace(/^licence: /, ''))));
  $('updated').textContent = 'Index updated ' + data.updated;
}

const highlight = () => { if (window.webcliHighlight) window.webcliHighlight(); };

// Wraps each <pre> in a small bar with a Copy button. The button sits outside the <pre>, so the code's text is untouched.
function addCopyButtons() {
  for (const pre of document.querySelectorAll('pre:not([data-copy])')) {
    const code = pre.querySelector('code');
    if (!code) continue;
    pre.setAttribute('data-copy', '');
    const lang = code.getAttribute('data-lang') || 'code';
    const btn = el('button', { type: 'button', class: 'copy', 'aria-label': `Copy ${lang} code`, 'data-testid': 'copy', text: 'Copy' });
    const status = el('span', { class: 'copy-status', role: 'status' });
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Copied';
      } catch {
        const sel = getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        sel.removeAllRanges();
        sel.addRange(range);
        status.textContent = 'Press Ctrl/Cmd+C to copy';
      }
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
    const bar = el('div', { class: 'codebar' }, el('span', { class: 'lang', text: lang }), status, btn);
    const wrap = el('div', { class: 'codeblock' });
    pre.replaceWith(wrap);
    wrap.append(bar, pre);
  }
}

const enhance = () => { highlight(); addCopyButtons(); };

async function main() {
  setStatus('running');
  enhance();
  try {
    const res = await fetch('tools.json', { method: 'GET', credentials: 'omit' });
    if (!res.ok) throw new Error('tools.json: HTTP ' + res.status);
    const data = await res.json();
    if (data.schema !== 2) throw new Error('unsupported tools.json schema ' + data.schema);
    render(data);
    window.__webcli_result = { ok: true, op: 'index', artifact: null, error: null, meta: { tools: data.tools.map(t => t.name), schema: data.schema } };
    setStatus('done');
  } catch (e) {
    $('tools-list').replaceChildren(el('p', {}, 'Could not load the tool list: ' + e.message + '. Read ', el('a', { href: 'tools.json', text: 'tools.json' }), ' directly.'));
    window.__webcli_result = { ok: false, op: 'index', artifact: null, error: String(e.message || e), meta: null };
    setStatus('error');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
