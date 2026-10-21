// Renders tools.json. The only thing this page reads is its own same-origin tools.json.
const $ = id => document.getElementById(id);
const body = document.body;
const setStatus = s => { body.setAttribute('data-webcli-status', s); if (s === 'loading') window.__webcli_result = null; };

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
  }
  n.append(...kids);
  return n;
}

// Only https links from the data file become anchors.
const link = (href, text) => (/^https:\/\//.test(href || '') ? el('a', { href, rel: 'noopener noreferrer', text }) : el('span', { text }));

// ---- syntax highlighting (js, bash): wraps text in classed spans, never changes it ----
const RULES = {
  js: [['com', /\/\/[^\n]*/], ['str', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/],
    ['kw', /\b(?:import|from|const|let|var|await|async|new|return|function|if|else|for|of|in)\b/], ['lit', /\b(?:true|false|null|undefined)\b/],
    ['num', /\b\d+(?:\.\d+)?\b/], ['fn', /\b[A-Za-z_$][\w$]*(?=\()/], ['punct', /=>|\.\.\./]],
  bash: [['str', /'[^'\n]*'|"(?:\\.|[^"\\\n])*"/], ['com', /#[^\n]*/], ['url', /https?:\/\/[^\s'"]+/],
    ['fn', /\b(?:curl|jq|cat|grep|node|npm|git)\b/], ['kw', /(?<=\s)-{1,2}[A-Za-z][\w-]*/], ['punct', /[|&;]+/]],
};
const COMPILED = Object.fromEntries(Object.entries(RULES).map(([l, r]) => [l, { r, re: new RegExp(r.map(x => '(' + x[1].source + ')').join('|'), 'g') }]));
const tok = (cls, text) => el('span', { class: 'tok-' + cls, text });

function highlight() {
  for (const code of document.querySelectorAll('code[data-lang]:not([data-hl])')) {
    const lang = code.getAttribute('data-lang'), c = COMPILED[lang];
    if (!c) continue;
    const src = code.textContent, out = [];
    let last = 0, m;
    c.re.lastIndex = 0;
    while ((m = c.re.exec(src))) {
      if (!m[0]) { c.re.lastIndex++; continue; }
      if (m.index > last) out.push(src.slice(last, m.index));
      out.push(tok(c.r[m.slice(1).findIndex(g => g !== undefined)][0], m[0]));
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push(src.slice(last));
    code.replaceChildren(...out);
    code.setAttribute('data-hl', lang);
  }
}

// ---- copy buttons: a bar above each <pre>, outside it, so the code's text is untouched ----
function addCopyButtons() {
  for (const pre of document.querySelectorAll('pre:not([data-copy])')) {
    const code = pre.querySelector('code');
    if (!code) continue;
    pre.setAttribute('data-copy', '');
    const lang = code.getAttribute('data-lang') || 'code';
    const status = el('span', { class: 'copy-status', role: 'status' });
    const btn = el('button', { type: 'button', class: 'copy', 'aria-label': `Copy ${lang} code`, text: 'Copy' });
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        status.textContent = 'Press Ctrl/Cmd+C to copy';
      }
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
    const wrap = el('div', { class: 'codeblock' });
    pre.replaceWith(wrap);
    wrap.append(el('div', { class: 'codebar' }, el('span', { class: 'lang', text: lang }), status, btn), pre);
  }
}

// ---- cards ----
const fetchText = list => (list === null ? 'not audited yet' : list.length ? list.join(', ') : 'nothing');
const REPRO = { verified: 'same input, same bytes (tested)', unverified: 'not verified', 'n/a': 'n/a' };
const SOURCE_STATUS = { private: 'source: private repository', unpublished: 'source: not published yet' };
const licenceText = t => (t.licence === 'unpublished' ? 'licence: not published yet' : t.licence + (t.licence_note ? ` (${t.licence_note})` : ''));

function row(dl, label, node) { dl.append(el('dt', { text: label }), el('dd', {}, node)); }

function card(t) {
  const dl = el('dl');
  row(dl, 'in', document.createTextNode(t.inputs.join('; ')));
  row(dl, 'out', document.createTextNode(t.outputs.join('; ')));
  row(dl, 'egress', document.createTextNode(t.egress === 'none' ? 'none: your content stays on the device' : t.egress));
  const optional = t.fetches_optional && t.fetches_optional.length ? `; if enabled: ${t.fetches_optional.join(', ')}` : '';
  row(dl, 'fetches', document.createTextNode(fetchText(t.fetches) + optional));
  row(dl, 'repro', document.createTextNode(REPRO[t.deterministic]));
  if (t.params.length) {
    const fmt = p => { const core = p.name + '=' + (p.values ? p.values.join('|') : '') + (p.repeatable ? ' (repeatable)' : ''); return p.required ? core : `[${core}]`; };
    row(dl, 'params', el('span', {}, ...t.params.flatMap((p, i) => [i ? ' ' : '', el('code', { text: fmt(p) })])));
  }
  if (t.result) row(dl, 'result', el('code', { 'data-lang': 'js', text: `${t.result.handle} = ${t.result.shape}` }));
  if (t.testids.length) row(dl, 'testids', document.createTextNode(t.testids.join(', ')));
  const badge = el('span', { class: 'badge ' + (t.agent ? 'yes' : 'no'), text: t.agent ? 'run= ✓' : 'no run= yet' });
  const art = el('article', { class: 'tool', 'data-testid': 'tool-' + t.name }, el('h4', {}, link(t.origin, t.name), badge), el('p', { text: t.role }), dl);
  if (t.caveat) art.append(el('p', { class: 'caveat', text: t.caveat }));
  art.append(el('p', { class: 'meta' }, t.source ? link(t.source, 'source') : document.createTextNode(SOURCE_STATUS[t.source_status]), ' · ', document.createTextNode(licenceText(t))));
  return art;
}

function renderExample(data) {
  const ex = data.example;
  $('example-body').replaceChildren(
    el('p', { text: ex.title }),
    ...ex.shots.map(s => el('figure', {}, el('img', { src: s.src, width: s.width, height: s.height, alt: s.alt, loading: 'lazy' }))),
    el('p', { text: ex.requests }),
    el('p', { class: 'meta', text: `Check it yourself: ${ex.verify[0].toLowerCase() + ex.verify.slice(1)} ${ex.note} Verified ${ex.verified}.` }),
  );
}

function render(data) {
  const list = $('tools-list');
  list.replaceChildren();
  for (const g of data.groups) {
    const tools = data.tools.filter(t => t.group === g.id);
    if (tools.length) list.append(el('h3', { class: 'group', 'data-testid': 'group-' + g.id, text: g.title }), ...tools.map(card));
  }

  const planned = $('planned');
  planned.replaceChildren('Roadmap, not live: ');
  data.planned.forEach((p, i) => planned.append(i ? '; ' : '', el('strong', { text: p.name }), ` (${p.note}${p.egress === 'cloud-tier' ? '; its cloud tier would be non-zero-egress and would be labelled as such' : ''})`));
  planned.append('.');

  const agents = data.tools.filter(t => t.agent).map(t => t.name);
  $('agent-status').textContent = agents.length ? `Implemented today by ${agents.join(', ')} (${agents.length} of ${data.tools.length} tools). The other tools do not have it yet.` : 'No tool implements it yet.';

  renderExample(data);
  $('audits').replaceChildren(...data.audits.map(a => el('li', {}, link(a.url, a.title))));
  $('licences').replaceChildren(...data.tools.map(t => el('li', {}, el('code', { text: t.name }), ': ', licenceText(t).replace(/^licence: /, ''))));
  $('updated').textContent = 'Index updated ' + data.updated;
  highlight();
  addCopyButtons();
}

async function main() {
  setStatus('loading');
  highlight();
  addCopyButtons();
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
