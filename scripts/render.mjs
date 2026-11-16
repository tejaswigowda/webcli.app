#!/usr/bin/env node
// tools.json (+ ledger.json, measure.json) -> pages/home.md and pages/home-after.md, the markdown blog-webCLI turns into the page.
// Writes canonical markdown (one line per paragraph) so `blog-webcli fmt` has nothing to change.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, line, readJson, validate } from './lib.mjs';

const exists = (f) => existsSync(path.join(ROOT, f));
const num = (n) => n.toLocaleString('en-US');

export function renderHome(data) {
  const out = [
    '---', 'slug: home', 'title: webCLI', 'status: published', 'noindex: true', '---', '',
    '# webCLI', '',
    `{.lead} Twelve tools that each transform one kind of thing in a browser tab. What you give one is not uploaded, with two stated exceptions below; [the paper](${data.paper.url}) explains the architecture. Each is listed with what goes in, what comes out, what it is not, and a state that says how far to trust it.`, '',
  ];
  for (const g of data.groups) {
    out.push(`## ${g.title}`, '');
    for (const t of data.tools.filter((x) => x.group === g.id)) {
      out.push(`### [${t.name}](${t.origin})`, '');
      out.push(`**In:** ${t.line.in}. **Out:** ${t.line.out}. **Not:** ${t.line.not.tool}, which ${t.line.not.why}.`, '');
      const gates = t.gates ? ` [Its gates](${t.gates}) pass.` : '';
      out.push(`{.small} **${t.state}.**${gates} ${t.limits || ''}`.trimEnd(), '');
    }
  }
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
    '---', 'slug: home-after', 'title: What all twelve share', 'status: published', 'noindex: true', '---', '',
    '## What all twelve share', '',
    'Stated once here, so it cannot drift across twelve READMEs. The left column is the claim; the right is what has been measured, and where nothing has been measured it says so.', '',
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
      if (!r) continue;
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
    '## Agents and scripts', '',
    `The tools are meant to be driven by a URL and to return an artifact; ${agents.length} of ${tools.length} (${agents.join(', ')}) have the \`${data.contract.run_param}=\` surface today. [tools.json](tools.json) is the machine-readable index of this page: for each tool its origin, what it fetches and, where it has one, that surface (parameters, \`${data.contract.result_handle}\`, test ids). Nothing here needs an account; the two tools that publish are the exception stated above.`, '',
    ...data.audits.map((a) => `- [${a.title}](${a.url})`), '',
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
