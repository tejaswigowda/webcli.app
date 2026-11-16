#!/usr/bin/env node
// Draws the 1200x630 share image (og:image, twitter:image) from tools.json, so the card says what the page says.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { launch, openPage } from './cdp.mjs';
import { ROOT, readJson } from './lib.mjs';

const data = readJson('tools.json');
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const groups = data.groups
  .map((g) => `<div class="g"><h2>${esc(g.title)}</h2><p>${data.tools.filter((t) => t.group === g.id).map((t) => esc(t.name)).join(' · ')}</p></div>`)
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0}body{width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;background:#141416;color:#e8e8ec;font:32px/1.4 ui-monospace,Menlo,Consolas,monospace;display:flex;flex-direction:column}
h1{font:700 96px/1 ui-monospace,Menlo,Consolas,monospace;margin:0 0 16px;color:#7db4f0}h1 span{color:#e8e8ec}
.lead{font:34px/1.35 system-ui,sans-serif;color:#b9b9c2;margin:0 0 40px;max-width:980px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 48px;margin-top:auto}
.g h2{font:600 22px/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#8a8a94;margin:0 0 8px}.g p{margin:0;font-size:28px}
.foot{margin-top:28px;font:24px system-ui,sans-serif;color:#8a8a94}
</style><h1><span>&gt;</span> webCLI</h1><p class="lead">Twelve tools that run in a browser tab. What goes in, what comes out, what each one is not.</p><div class="grid">${groups}</div><div class="foot">webcli.app</div>`;

const chrome = await launch();
try {
  const page = await openPage(chrome);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await page.send('Page.enable');
  const { frameTree } = await page.send('Page.getFrameTree');
  await page.send('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
  const { data: png } = await page.send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(path.join(ROOT, 'images'), { recursive: true });
  writeFileSync(path.join(ROOT, 'images/og.png'), Buffer.from(png, 'base64'));
  console.log('wrote images/og.png');
} finally {
  chrome.close();
}
