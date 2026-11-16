# Notes on the front door

Written against the work order of 2026-11-15. The page is generated: `tools.json` → `scripts/render.mjs` → `pages/*.md` → blog-webCLI → one edit (G1) → committed HTML. `node scripts/build.mjs` does all of it; `.blog-webcli-ref` pins the generator.

## Gates

| Gate | State | Evidence |
|---|---|---|
| I1 no third-party request | **met** | `scripts/check-page.mjs` loads the built page in Chrome, cache off, and fails on any request to another origin (it fails on the unstripped page, which carries the cdnjs link); `test/page.test.mjs` scans the HTML. Both run in CI. |
| I2 built with blog-webCLI, gaps recorded | **met** | G1 to G6 below. |
| I3 twelve listed, grouped, three clauses | **met** | `tools.json`, rendered into `pages/home.md`. |
| I4 no two lines substitutable | **met, with findings** | A word-overlap backstop in `test/page.test.mjs`; the real test is reading them. F3 is what the lines turned up. |
| I5 every tool has a state; every `working` links its gates | **met** | `validate()` in `scripts/lib.mjs` refuses otherwise. Only hls and dub are `working` (see below). |
| I6 no unlisted empty shell in DNS | **open** | `pose.webcli.app` (F2) and `pay.webcli.app` (F1). DNS is not reachable from here. |
| I7 shared claim once, with both exceptions | **met** | `pages/home-after.md`. The claim is stated with what is measured beside it, because F4 shows part of it is not true today. |
| I8 twelve-tool ledger test, in CI, result on the page | **partly met** | The ledger (`scripts/ledger.mjs --assert`, CI job `ledger`, result in `ledger.json` and on the page) measures load and idle for all twelve with the network cut afterwards: all read zero. It does **not** operate any tool: 0 of 12 representative operations are written, and the page says so. Each needs that tool's own UI automation (a camera for mocap, WebGPU for chat, a token for hls and blog). |
| I9 own speed measurement with its method | **met** | `scripts/measure.mjs` → `measure.json` → the page. 0 JavaScript files, 0 ms blocking time, LCP 616 ms (Slow 4G, 4x CPU, 5 cold runs, served from localhost). |
| I10 `tools.json` single source, CI on descriptions | **built, red until applied** | `scripts/check-descriptions.mjs`. 11 of 12 descriptions differ today; mocap is private and is skipped. `node scripts/check-descriptions.mjs --apply` sets them with `gh`. Not run: it edits eleven other repositories. |
| I11 `pay` | **open** | F1. |
| I12 full content without scripting; `og:image`, `twitter:card` | **met locally** | `check-page.mjs` disables script execution and looks for every tool. `og:image` points at a commit that must be pushed first (G3). |

## What blog-webCLI lacked

- **G1. A third-party request it cannot turn off.** `lib/page.js` writes a Font Awesome `<link>` to cdnjs.cloudflare.com into every page (`FONT_AWESOME`, used unconditionally in `head()`). `scripts/build.mjs` removes exactly that tag after the build, then fails if any other third-party reference remains. Consequence: `blog-webcli check` cannot be used here, because it regenerates in memory and would report the removal as a difference; CI runs the build and `git diff` instead. Wanted upstream: a `customize` switch that omits it.
- **G2. `wc-columns` and `wc-figure` do not exist.** Neither string appears anywhere in blog-webCLI, so there is no widget set and this page is not their first consumer. The entries are plain headings and paragraphs in one column.
- **G3. Share image.** `cover` must be an `asset:` reference pinned to a commit that already holds the file, so a new image needs a commit before it can be built against. `images/og.png` was committed alone (`1d06734`) and pinned in `assets.lock.json`; that commit must be pushed, and not rewritten, or `og:image` 404s. Also, setting `assets.base` to this site's own domain makes every `*.webcli.app` link a `provider-url` refusal, so the base is `raw.githubusercontent.com`; the page itself never requests it.
- **G4. Weight.** The default theme inlines the whole of animate.css: the page is about 92 KB, 80 KB of it CSS this page does not use. `"stylesheet": "linked"` makes the HTML 14 KB but the cold LCP worse (780 ms against 616 ms, one more round trip), so it is inline.
- **G5. No way to set a Content-Security-Policy.** The page this replaced carried one, so a stray request was blocked by the browser. Now it is only caught by CI.
- **G6. A feed nobody asked for.** The generator always writes `feed.xml`, `feed/` and a "Feed" link in the header, which the work order's "no blog or changelog" leaves with nothing to carry. There is no switch for the link.
- The generator's own suite has 5 failures of 598 (publish pre-flight, draft deletion, media replace, the O3 reproducibility gate, scheduled posts) on the pinned ref's `main`, 2026-11-15. `blog`'s card says so.

## Findings about the family

- **F1. `pay.webcli.app`** is not a GitHub Pages record and not dangling in the usual sense: it is a CNAME to `paylinks.commerce.godaddy.com`, which resolves into GoDaddy's payments hosts (`100.49.0.246` among them), and it answers HTTPS 404 "Pay Link Not Found". A payments hostname with no pay link behind it. Delete the record at the registrar unless you are setting a link up.
- **F2. `pose`.** `pose.webcli.app` resolves to GitHub Pages but has no certificate (HTTPS fails), `pose-webCLI` has an empty README, and the pose work order is not in this repository or in the local checkouts, so it has **not** been retitled. By its description (closed bone enum, host resolves, model names, host verifies geometrically) it is the design rig already has: rig's README, "Optional local AI assist", says the model names bones and the host validates them geometrically. Retitle it onto **rig**. Remove the DNS record. The old `tools.json` called it `origin-move`; that entry is gone.
- **F3. Where the lines do not hold.** mocap and rig are distinct (record, retarget) but mocap's `both` mode bakes a GLB onto its two bundled avatars, which is a small retarget of its own. portrait carries a copy of look's editor (`docs/editor/`, an Edit-the-look button), so look is inside portrait. look and portrait transform VRM avatars, not images; they sit under Images because the order says so, and fit better beside rig and 3mf.
- **F4. The shared claim as worded is not true of the family today.** Measured on 2026-11-16: 0 of 12 set `connect-src 'none'`; 8 of 12 ship no Content-Security-Policy at all; 5 of 12 (ffmpeg, whisper, 3mf, magick, chat) load code from third-party CDNs at load (that is the stated load exception, but it is a CDN, not the origin). The page therefore shows the claim with the measurement beside each part and "Not measured" where nothing was.
- **F5. States.** `working` needs a gate table that is linked and passing. hls (46 of 46, real Chrome) and dub (gates D1 to D3, plus 33 unit tests) qualify. Everything else is `early`: ffmpeg, whisper, 3mf, magick and chat have no gate table; look, portrait, rig and mocap have tests but not as a table; blog has one and it does not pass. mocap's source is private, so "an open licence" is 11 of 12.
- **F6. Left out of the page** from the old one: the contract section's prose, the worked magick example, the planned list (facecast, facebuild, imagegen, glb-fbx, portrait-metahuman) and the screenshots. None has a subdomain. They are in git history at `5256335`. The agent surface (`params`, `result`, `testids`) is kept in `tools.json`.

## To do by hand

1. Remove `pay` and `pose` from DNS (or list them with a state).
2. Push, without rewriting history, so `1d06734` exists on GitHub.
3. `node scripts/check-descriptions.mjs --apply`, then CI is green.
4. Write the READMEs' one-line opening to match the lines (twelve repositories).
5. Operations for the ledger: one per tool, then raise `operations` in `ledger.json`.
