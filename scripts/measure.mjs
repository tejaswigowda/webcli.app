#!/usr/bin/env node
// Gate I9: this page's own speed, with its method. Serves the built page locally and runs blog-webCLI's cli/speed.mjs (cold profile,
// cache off, Slow 4G, 4x CPU slowdown, a 390 px phone) against it; the median of the runs goes to measure.json, which the page then quotes.
//   BLOG_WEBCLI=/path/to/blog-webCLI node scripts/measure.mjs [--runs 5]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { serve } from './serve.mjs';

const runs = Number(process.argv.includes('--runs') ? process.argv[process.argv.indexOf('--runs') + 1] : 5);
const generator = process.env.BLOG_WEBCLI || path.join(ROOT, '.blog-webcli');
const s = await serve();
try {
  const out = await new Promise((resolve, reject) => {
    const p = spawn('node', [path.join(generator, 'cli/speed.mjs'), `${s.origin}/`, '--runs', String(runs), '--json'], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = '';
    p.stdout.on('data', (d) => (buf += d));
    p.on('close', (code) => (code === 0 ? resolve(buf) : reject(new Error(`speed.mjs exited ${code}`))));
  });
  const m = JSON.parse(out).median;
  const result = {
    measured: new Date().toISOString().slice(0, 10),
    runs,
    js_files: m.jsFiles,
    requests: m.requests,
    transfer_kb: Math.round(m.kb * 10) / 10,
    fcp_ms: Math.round(m.fcp),
    lcp_ms: Math.round(m.lcp),
    tbt_ms: Math.round(m.tbt),
    method: `blog-webCLI's cli/speed.mjs in headless Chrome: Slow 4G (1.6 Mbit/s down, 150 ms round trip), 4x CPU slowdown, a 390 px phone, a new browser profile for every run with the cache off, ${runs} runs, median reported; FCP and LCP from PerformanceObserver, total blocking time summed from long tasks after first paint; JavaScript counted from the network log. Lab data from one machine, served from 127.0.0.1, so the throttle supplies the latency but not DNS, TLS or distance; measured ${new Date().toISOString().slice(0, 10)}.`,
  };
  writeFileSync(path.join(ROOT, 'measure.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(result);
} finally {
  s.close();
}
