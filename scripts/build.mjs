#!/usr/bin/env node
// The whole build: tools.json -> pages/*.md -> blog-webCLI -> the one post-build edit below -> the third-party check.
//
//   BLOG_WEBCLI=/path/to/blog-webCLI node scripts/build.mjs      (default: ./.blog-webcli, checked out at the ref in .blog-webcli-ref)
//
// The post-build edit exists because blog-webCLI writes a Font Awesome <link> to cdnjs.cloudflare.com into the <head> of every page it
// generates (lib/page.js, FONT_AWESOME) with no option to omit it, and this page may make no third-party request (gate I1). It removes
// exactly that tag and nothing else; the check that follows fails the build if anything else third-party is left. See NOTES.md, gap G1.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { writePages } from './render.mjs';

const FONT_AWESOME_LINK = /<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[^"]+"[^>]*>\n?/g;

export function generatedHtml(dir = ROOT) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      if (['.git', '.github', '.blog-webcli', 'node_modules', 'scripts', 'test', 'pages', 'images'].includes(name)) continue;
      const p = path.join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.html')) found.push(p);
    }
  };
  walk(dir);
  return found;
}

// Everything in a page that makes the browser fetch something, other than a same-origin file. Links to other pages (a, canonical,
// alternate, og:image) are not requests the page makes.
export function thirdPartyReferences(html) {
  const found = [];
  const abs = /^(?:https?:)?\/\//i;
  for (const m of html.matchAll(/<(link|script|img|iframe|source|video|audio|embed|object|track|input)\b([^>]*)>/gi)) {
    const [, tag, attrs] = m;
    const get = (n) => (attrs.match(new RegExp(`\\s${n}="([^"]*)"`, 'i')) || [])[1];
    if (tag.toLowerCase() === 'link' && !/\brel="(?:stylesheet|icon|shortcut icon|preload|prefetch|modulepreload|preconnect|dns-prefetch|apple-touch-icon|manifest)"/i.test(attrs)) continue;
    for (const v of [get('src'), tag.toLowerCase() === 'link' ? get('href') : null, get('data'), get('poster')]) if (v && abs.test(v)) found.push(`<${tag}> ${v}`);
  }
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) for (const u of m[1].matchAll(/(?:url\(\s*['"]?|@import\s+['"]?)((?:https?:)?\/\/[^'")\s]+)/gi)) found.push(`css ${u[1]}`);
  for (const m of html.matchAll(/<meta[^>]+http-equiv="refresh"[^>]*content="[^"]*url=([^"]+)"/gi)) if (abs.test(m[1]) && !m[1].startsWith('https://webcli.app/')) found.push(`meta refresh ${m[1]}`);
  return found;
}

export function build() {
  writePages();
  const generator = process.env.BLOG_WEBCLI || path.join(ROOT, '.blog-webcli');
  if (!existsSync(path.join(generator, 'cli/blog.js'))) throw new Error(`blog-webCLI not found at ${generator} (set BLOG_WEBCLI)`);
  const r = spawnSync('node', [path.join(generator, 'cli/blog.js'), 'build', ROOT], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('blog-webcli build failed');
  let stripped = 0;
  for (const f of generatedHtml()) {
    const html = readFileSync(f, 'utf8');
    const next = html.replace(FONT_AWESOME_LINK, '');
    if (next !== html) { writeFileSync(f, next); stripped++; }
  }
  const left = generatedHtml().flatMap((f) => thirdPartyReferences(readFileSync(f, 'utf8')).map((x) => `${path.relative(ROOT, f)}: ${x}`));
  if (left.length) throw new Error(`third-party references remain:\n  ${left.join('\n  ')}`);
  console.log(`removed the Font Awesome link from ${stripped} page(s); no third-party reference remains`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { build(); } catch (e) { console.error(e.message); process.exit(1); }
}
