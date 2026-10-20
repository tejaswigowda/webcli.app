# webcli.app

The front door of the webCLI family: one static page for people, one JSON file for agents, both from the same source.

- [`tools.json`](tools.json) is the only place a tool is described. `index.html` + `app.js` render it; `/.well-known/webcli.json` is an identical copy (a test enforces that). Schema: [`schema/1.json`](schema/1.json), `"schema": 1`.
- No build step, no dependencies, no third-party requests. A CSP (meta tag, plus `_headers` for hosts that support it) makes that enforceable; `npm test` fails on any request to another origin.

## Changing the family

- **Tool moved:** edit its `origin` in `tools.json`, then `cp tools.json .well-known/webcli.json`. No HTML edit. The only other place an origin appears is the `<noscript>` list in `index.html`; `npm test` fails if it drifts.
- **Tool went live:** add it to `tools` (with `agent`, `params`, `result` only if it really implements `run=`), remove it from `planned`.
- Only live tools at their final origin belong in `tools`. Everything else is a `planned` entry, which carries no origin and is never linked.

## Tests

```bash
npm install
npx playwright install chromium   # dev only
npm test              # schema, CSP, egress, one-source, no-JS, mobile
npm run check:live    # every origin / source / audit / example input resolves (fails until origins are live)
npm run check:example # runs the page's worked example against its origin (EXAMPLE_ORIGIN=... to override)
```

Hosting: any static host. `.nojekyll` keeps `/.well-known/` served on GitHub Pages; `_headers` applies on Cloudflare Pages / Netlify. GitHub Pages cannot set headers, so there the meta CSP is the enforcement.

Licence: GPL-3.0.
