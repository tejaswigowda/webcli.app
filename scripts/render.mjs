#!/usr/bin/env node
// tools.json (+ ledger.json, measure.json) -> pages/home.md and pages/home-after.md, the markdown blog-webCLI turns into the page.
// Writes canonical markdown (one line per paragraph) so `blog-webcli fmt` has nothing to change.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, readJson, validate } from './lib.mjs';

const exists = (f) => existsSync(path.join(ROOT, f));
const num = (n) => n.toLocaleString('en-US');
const html = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function card(t) {
  const row = (label, value) => `<dt>${label}</dt><dd>${value}</dd>`;
  const code = (value) => `<code>${html(value)}</code>`;
  const fetches = t.fetches === null ? 'not audited yet' : t.fetches.length ? t.fetches.join(', ') : 'nothing';
  const optional = t.fetches_optional.length ? `; if enabled: ${t.fetches_optional.join(', ')}` : '';
  const measurement = { measured: 'measured', partial: 'partially measured', pending: 'pending' }[t.measured];
  const repro = { verified: 'same input, same bytes (tested)', unverified: 'not verified', 'n/a': 'n/a' };
  const params = t.params.map((p) => {
    const text = `${p.name}=${p.values ? p.values.join('|') : ''}${p.repeatable ? ' (repeatable)' : ''}`;
    return code(p.required ? text : `[${text}]`);
  }).join(' ');
  const source = t.source_status === 'public'
    ? `<a href="https://github.com/${html(t.repository)}">source</a>`
    : html(`source: ${t.source_status}`);
  const toolLink = t.origin
    ? `<a href="${html(t.origin)}">${html(t.name)}</a>`
    : `<span>${html(t.name)}</span> <span class="badge no">no live URL</span>`;
  const live = t.live === 'none' ? 'none (not deployed)' : `<a href="${html(t.live)}">${html(t.live)}</a>`;
  return [
    `<article class="tool" id="tool-${html(t.name)}">`,
    t.thumb && t.origin ? `<a class="thumb" href="${html(t.origin)}"><img src="/${html(t.thumb.src)}" width="600" height="400" alt="${html(t.thumb.alt)}"></a>` : '',
    `<h4>${toolLink} <span class="badge ${t.agent ? 'yes' : 'no'}">${t.agent ? 'run= yes' : 'no run= yet'}</span> <span class="badge ${t.state === 'working' ? 'yes' : 'no'}">${html(t.state)}</span></h4>`,
    '<dl>',
    row('version', html(t.version)),
    row('live', live),
    row('measurement', html(measurement)),
    row('in', html(t.line.in)),
    row('out', html(t.line.out)),
    row('not', html(`${t.line.not.tool}, which ${t.line.not.why}`)),
    row('egress', html(t.egress === 'none' ? 'none: your content stays on the device' : t.egress)),
    row('fetches', html(fetches + optional)),
    row('repro', html(repro[t.deterministic])),
    params ? row('params', params) : '',
    t.result ? row('result', code(`${t.result.handle} = ${t.result.shape}`)) : '',
    t.testids.length ? row('testids', html(t.testids.join(', '))) : '',
    '</dl>',
    t.limits ? `<p class="caveat">${html(t.limits)}</p>` : '',
    `<p class="boundary"><strong>Boundary:</strong> ${html(t.boundary)}</p>`,
    `<p class="meta">${source} · ${html(t.licence)}${t.gates ? ` · <a href="${html(t.gates)}">passing gates</a>` : ''}</p>`,
    '</article>',
  ].join('');
}

export function renderHome(data) {
  const out = [
    '---', 'slug: home', 'title: webCLI', 'status: published', 'noindex: true', '---', '',
    '# webCLI', '',
    `{.lead} A family of browser tools that take a URL or a file and return an artifact, with your content processed on your device and no account; [the paper](${data.paper.url}) explains the architecture. Loading code and models, and publishing to a repository, are the two declared exceptions below.`, '',
    'This index is itself built with [blog-webCLI](https://blog.webcli.app/), from the [webcli.app repository](https://github.com/tejaswigowda/webcli.app).', '',
    'drop, chess and rtc share [only-connect](https://github.com/tejaswigowda/only-connect.js#this-does-not-fix-client-isolated-networks), which does not work across client-isolated networks; no TURN server is deployed.', '',
    '<div class="section-nav" aria-label="Sections"><a href="#contract">Contract</a><a href="#tools">Tools</a><a href="#example">Example</a><a href="#agents">Agents and scripts</a><a href="#privacy">Privacy</a></div>', '',
    '<h2 id="contract">The contract</h2>', '',
    '- **URL in, artifact out.**',
    '- **GET-only for loading.** Input URLs, code and models are fetched with GET requests.',
    '- **On-device processing.** Your content stays on your device unless you explicitly publish it.',
    '- **No account to process a file.** Publishing tools require access to your repository.', '',
    'Zero-egress is about your content, not about downloading the application. Each card declares what the tool fetches; hls and blog also publish to a repository when you ask them to.', '',
    '### The agent surface', '',
    `Implemented today by ${data.tools.filter((t) => t.agent).map((t) => t.name).join(', ')} (${data.tools.filter((t) => t.agent).length} of ${data.tools.length} tools). The other tools do not have it yet.`, '',
    '- `run=` in the URL starts the operation where supported.',
    '- `window.__webcli_result` holds the result: `{ ok, op, artifact, error, meta }`.',
    '- `[data-webcli-status]` on the body reports `idle`, `loading`, `running`, `done` or `error`.',
    '- Stable test ids for each tool are listed on its card.', '',
    '```js',
    '// wait for the operation to finish, then read the handle',
    "await page.waitForSelector('body[data-webcli-status=done], body[data-webcli-status=error]');",
    'const result = await page.evaluate(() => window.__webcli_result);',
    '```', '',
    '<h2 id="tools">Tools</h2>', '',
    `{.small} ${data.tools.length} tools, grouped by what they transform. Every entry states its version, live URL or none, licence and measurement status.`, '',
  ];
  for (const g of data.groups) {
    out.push(`## ${g.title}`, '');
    for (const t of data.tools.filter((x) => x.group === g.id)) {
      out.push(card(t), '');
    }
  }
  if (data.libraries?.length) {
    out.push('## Libraries (not tools)', '');
    for (const library of data.libraries) {
      const live = library.live === 'none' ? 'none' : `[${html(library.live)}](${html(library.live)})`;
      out.push(
        `<article class="library" id="library-${html(library.id)}"><h4>${html(library.name)}</h4><p>${html(library.description)}</p><dl><dt>kind</dt><dd>library (no UI or command surface)</dd><dt>version</dt><dd>${html(library.version)}</dd><dt>live</dt><dd>${live}</dd><dt>licence</dt><dd>${html(library.licence)}</dd><dt>measurement</dt><dd>${html({ measured: 'measured', partial: 'partially measured', pending: 'pending' }[library.measured])}</dd></dl><p class="boundary"><strong>Boundary:</strong> ${html(library.boundary)}</p><p class="meta"><a href="${html(library.repo)}">source</a></p></article>`,
        '',
      );
    }
  }
  const ex = data.example;
  out.push(
    '<h2 id="example">A worked example</h2>', '',
    ex.title, '',
    ...ex.shots.flatMap((s) => [`<figure><img src="/${html(s.src)}" width="${s.width}" height="${s.height}" alt="${html(s.alt)}"><figcaption>${html(s.alt)}</figcaption></figure>`, '']),
    ex.requests, '',
    `{.small} Historical measurement, verified ${ex.verified}; not a new audit of the current application. ${ex.verify} ${ex.note}`, '',
  );
  return `${out.join('\n')}`;
}

export function renderAfter(data, ledger, measure) {
  const tools = data.tools;
  const open = tools.filter((t) => t.source_status === 'public').length;
  const closed = tools.filter((t) => t.source_status !== 'public').map((t) => t.name);
  const agents = tools.filter((t) => t.agent).map((t) => t.name);
  const rows = ledger ? tools.map((t) => ledger.tools[t.name]).filter(Boolean) : [];
  const clean = rows.filter((r) => r.status === 'loaded' && r.non_get === 0 && r.body_bytes === 0 && r.after_cut_requests === 0).length;
  const withCsp = rows.filter((r) => r.csp?.present).length;
  const connectNone = rows.filter((r) => r.csp?.connect_src === "'none'").length;

  const out = [
    '---', 'slug: home-after', 'title: What the tools share', 'status: published', 'noindex: true', '---', '',
    '## What the tools share', '',
    'Stated once here, so it cannot drift across the family. The left column is the claim; the right is what has been measured, and where nothing has been measured it says so.', '',
    '| Claim | Measured today |', '| --- | --- |',
    ledger
      ? `| A persistent egress ledger that reads zero | ${clean} of ${tools.length} made no non-GET request, sent no request body and made no request after the network was cut, from load to idle (${ledger.measured}). A representative operation is written for ${ledger.operations} of ${tools.length}. |`
      : '| A persistent egress ledger that reads zero | Not yet measured. |',
    ledger
      ? `| connect-src 'none' once loaded | ${connectNone} of ${tools.length}. ${withCsp} ship a Content-Security-Policy at all. |`
      : "| connect-src 'none' once loaded | Not yet measured. |",
    '| No credentials reachable from a worker | Not measured. |',
    '| Refusals by name rather than silent approximation | Not measured across the family. |',
    `| An open licence | ${open} of ${tools.length}${closed.length ? `; the source of ${closed.join(', ')} is not public yet` : ''}. |`,
    '| Operates offline once loaded | Not measured. |', '',
    '**Two exceptions, and they are part of the claim.** Loading is egress: fetching the WebAssembly core and any model is a request, always a GET with no body, and each tool\'s `fetches` in [tools.json](tools.json) names what it fetches. Publishing is egress the user starts: [hls](https://hls.webcli.app/) and [blog](https://blog.webcli.app/) commit to a repository, and nothing is sent until you press Publish; [hls says so in its Privacy and Egress section](https://github.com/tejaswigowda/hls-webCLI#privacy--egress).', '',
  ];

  if (ledger) {
    out.push(
      '## The ledger, per tool', '',
      `${ledger.method}`, '',
      '| Tool | Requests at load | Hosts other than its own | Non-GET | Body bytes | After the cut |', '| --- | --- | --- | --- | --- | --- |',
    );
    for (const t of tools) {
      const r = ledger.tools[t.name];
        if (!r) {
          out.push(`| ${t.name} | not measured yet | — | — | — | — |`);
          continue;
        }
      if (r.status !== 'loaded') out.push(`| ${t.name} | did not load (${r.status}) | | | | |`);
      else out.push(`| ${t.name} | ${num(r.requests)} | ${r.third_party_hosts.length ? r.third_party_hosts.join(', ') : 'none'} | ${r.non_get} | ${num(r.body_bytes)} | ${r.after_cut_requests} |`);
    }
    out.push('');
  }

  out.push('## Measured on this page', '');
  out.push('This page makes no request to any other host; CI loads it with a cold cache and fails on the first request that is not to its own origin, and the same check can be repeated in DevTools, Network, with Disable cache on.', '');
  if (measure) {
    out.push(
      `Lab measurement of this page, median of ${measure.runs}: **${measure.js_files} JavaScript files**, ${measure.requests} requests, ${measure.transfer_kb} KB transferred, first contentful paint ${measure.fcp_ms} ms, largest contentful paint **${measure.lcp_ms} ms**, total blocking time **${measure.tbt_ms} ms**.`, '',
      `Method: ${measure.method}`, '',
    );
  } else out.push('Speed has not been measured yet.', '');

  out.push(
    '<h2 id="agents">For agents and scripts</h2>', '',
    `The tools are meant to be driven by a URL and to return an artifact; ${agents.length} of ${tools.length} (${agents.join(', ')}) have the \`${data.contract.run_param}=\` surface today. [tools.json](tools.json) is the machine-readable index of this page: for each tool its origin, what it fetches and, where it has one, that surface (parameters, \`${data.contract.result_handle}\`, test ids). Nothing here needs an account; the two tools that publish are the exception stated above.`, '',
    '```bash',
    'curl -s https://webcli.app/tools.json',
    "curl -s https://webcli.app/tools.json | jq -r '.tools[] | select(.agent) | .origin'",
    '```', '',
    `The machine-readable index carries schema ${data.schema}. A breaking change bumps that number; each entry declares its origin, state, inputs, outputs, egress, fetches and agent surface.`, '',
    '<h2 id="privacy">Privacy and licences</h2>', '',
    'Processing happens on your device. Loading can fetch code, models and input URLs; publishing is an explicit action that sends content to your repository. Each card names its boundary. This index itself makes no third-party requests and runs no JavaScript.', '',
    '**How the claim is checked:**', '',
    ...data.audits.map((a) => `- [${a.title}](${a.url})`), '',
    '### Licences', '',
    ...tools.map((t) => `- \`${t.name}\` (tool): ${t.licence}${t.source_status !== 'public' ? ` (source ${t.source_status})` : ''}`),
    ...(data.libraries || []).map((library) => `- \`${library.name}\` (library): ${library.licence}`), '',
    'Vendored components keep their own notices.', '',
    `{.small} Index updated ${data.updated}. [tools.json](/tools.json) · [the paper (arXiv)](${data.paper.url})`, '',
  );
  return out.join('\n');
}

export function writePages() {
  const data = readJson('tools.json');
  const problems = validate(data);
  if (problems.length) throw new Error(`tools.json is not valid:\n  ${problems.join('\n  ')}`);
  const ledger = exists('ledger.json') ? readJson('ledger.json') : null;
  const measure = exists('measure.json') ? readJson('measure.json') : null;
  mkdirSync(path.join(ROOT, 'pages'), { recursive: true });
  writeFileSync(path.join(ROOT, 'pages/home.md'), `${renderHome(data).trimEnd()}\n`);
  writeFileSync(path.join(ROOT, 'pages/home-after.md'), `${renderAfter(data, ledger, measure).trimEnd()}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writePages();
  console.log('wrote pages/home.md and pages/home-after.md');
}
