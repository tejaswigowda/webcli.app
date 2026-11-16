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
    const failed = [];
    page.on('Network.requestWillBeSent', (p) => requests.push({ url: p.request.url, type: p.type, method: p.request.method, hasBody: Boolean(p.request.postData) }));
    page.on('Network.responseReceived', (p) => {
      // Chrome probes for an icon even though this generated page declares none.
      if (p.response.status >= 400 && new URL(p.response.url).pathname !== '/favicon.ico') failed.push(`${p.response.status}: ${p.response.url}`);
    });
    await page.send('Network.enable');
    await page.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    await page.send('Page.enable');
    await page.send('Page.navigate', { url: `${origin}/` });
    await sleep(2500);
    const text = (await page.send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true })).result.value;
    const problems = [];
    problems.push(...failed);
    for (const r of requests) if (new URL(r.url).origin !== origin) problems.push(`request to another origin: ${r.url}`);
    for (const r of requests) if (r.type === 'Script') problems.push(`script fetched: ${r.url}`);
    for (const r of requests) if (r.method !== 'GET' || r.hasBody) problems.push(`${r.method} ${r.url}`);
    for (const t of tools) {
      for (const clause of [t.line.in, t.line.out, t.line.not.why]) if (!text.includes(clause)) problems.push(`with scripting disabled, ${t.name} is missing "${clause}"`);
      if (!text.includes(t.state)) problems.push(`${t.name} has no visible state`);
    }
    for (const width of [1280, 390]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const scheme of ['light', 'dark']) {
        await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
        const { result } = await page.send('Runtime.evaluate', {
          expression: `JSON.stringify({
            overflow: document.documentElement.scrollWidth > innerWidth,
            cards: document.querySelectorAll('article.tool').length,
            brokenImages: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
            brokenNav: [...document.querySelectorAll('.section-nav a')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash),
            background: getComputedStyle(document.body).backgroundColor
          })`,
          returnByValue: true,
        });
        const layout = JSON.parse(result.value);
        const at = `${width}px ${scheme}`;
        if (layout.overflow) problems.push(`${at}: page overflows horizontally`);
        if (layout.cards !== tools.length) problems.push(`${at}: expected ${tools.length} tool cards, got ${layout.cards}`);
        if (layout.brokenImages.length) problems.push(`${at}: broken screenshots: ${layout.brokenImages.join(', ')}`);
        if (layout.brokenNav.length) problems.push(`${at}: broken navigation: ${layout.brokenNav.join(', ')}`);
        const background = scheme === 'light' ? 'rgb(251, 251, 250)' : 'rgb(19, 21, 23)';
        if (layout.background !== background) problems.push(`${at}: unexpected background ${layout.background}`);
      }
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
    console.log(`ok: ${requests} request(s) with a cold cache and scripting disabled, all same-origin; all tool cards, screenshots and section links work at 390/1280 px in light/dark mode`);
  } finally {
    s.close();
  }
}
