#!/usr/bin/env node
// Gates I1 and I12 against the built page, in a real browser: a cold cache, every request logged, scripting then disabled.
//   I1   no request goes anywhere but the page's own origin, and no script is fetched at all
//   I12  every tool is on the page with scripting disabled
import { launch, openPage, sleep } from './cdp.mjs';
import { readJson } from './lib.mjs';
import { serve } from './serve.mjs';

export async function checkPage(origin) {
  const tools = readJson('tools.json').tools;
  const chrome = await launch();
  try {
    const page = await openPage(chrome);
    const requests = [];
    page.on('Network.requestWillBeSent', (p) => requests.push({ url: p.request.url, type: p.type, method: p.request.method, hasBody: Boolean(p.request.postData) }));
    await page.send('Network.enable');
    await page.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    await page.send('Page.enable');
    await page.send('Page.navigate', { url: `${origin}/` });
    await sleep(2500);
    const text = (await page.send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true })).result.value;
    const problems = [];
    for (const r of requests) if (new URL(r.url).origin !== origin) problems.push(`request to another origin: ${r.url}`);
    for (const r of requests) if (r.type === 'Script') problems.push(`script fetched: ${r.url}`);
    for (const r of requests) if (r.method !== 'GET' || r.hasBody) problems.push(`${r.method} ${r.url}`);
    for (const t of tools) {
      for (const clause of [t.line.in, t.line.out, t.line.not.why]) if (!text.includes(clause)) problems.push(`with scripting disabled, ${t.name} is missing "${clause}"`);
      if (!text.includes(t.state)) problems.push(`${t.name} has no visible state`);
    }
    return { requests: requests.length, problems };
  } finally {
    chrome.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await serve();
  try {
    const { requests, problems } = await checkPage(s.origin);
    if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
    console.log(`ok: ${requests} request(s) with a cold cache and scripting disabled, all to the page's own origin; every tool is on the page`);
  } finally {
    s.close();
  }
}
