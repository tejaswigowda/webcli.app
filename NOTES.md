# Notes on the front door

Written against the work order of 2026-11-15. The page is generated: `tools.json` → `scripts/render.mjs` → `pages/*.md` → blog-webCLI → one edit (G1) → committed HTML. `node scripts/build.mjs` does all of it; `.blog-webcli-ref` pins the generator.

## Restoring the previous design (2026-11-16)

The pre-migration site at `5256335` supplies the visual reference: a 52rem system-font layout, light/dark palettes, section navigation, bordered tool cards with screenshots and definition lists, agent badges, the contract, the worked magick example and licences. The twelve current tools, their grouping, states, boundaries and measured privacy claims remain authoritative in `tools.json`; the old roadmap and outdated claims are not reinstated.

The cards and example are generated as allowlisted HTML blocks in canonical markdown. Their appearance is in `blog.json` → `customize.css`, editable through Settings → Custom CSS. Screenshots recovered from the same commit are same-origin files under `shots/`; the worked example's original measurement is explicitly historical. The generator is pinned to published commit `8596d29`, not an uncommitted local version.

There is **no custom JavaScript**. Content that previously needed `script.js` is now present at publish time, including tool details and licences. The previous JavaScript copy buttons and client-side highlighting are not restored. The browser check covers all twelve cards, screenshots and section targets at 390px and 1280px in light/dark mode with scripting disabled.

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
| I9 own speed measurement with its method | **met** | `scripts/measure.mjs` → `measure.json` → the page. Restored layout: 0 JavaScript files, 0 ms blocking time, LCP 664 ms (Slow 4G, 4x CPU, 5 cold runs, served from localhost). Images below the fold are lazy-loaded when scripting is enabled. |
| I10 `tools.json` single source, CI on descriptions | **built, red until applied** | `scripts/check-descriptions.mjs`. 11 of 12 descriptions differ today; mocap is private and is skipped. `node scripts/check-descriptions.mjs --apply` sets them with `gh`. Not run: it edits eleven other repositories. |
| I11 `pay` | **open** | F1. |
| I12 full content without scripting; `og:image`, `twitter:card` | **met locally** | `check-page.mjs` disables script execution and looks for every tool. `og:image` points at a commit that must be pushed first (G3). |

## What blog-webCLI lacked

- **G1. A third-party request it cannot turn off.** `lib/page.js` writes a Font Awesome `<link>` to cdnjs.cloudflare.com into every page (`FONT_AWESOME`, used unconditionally in `head()`). `scripts/build.mjs` removes exactly that tag after the build, then fails if any other third-party reference remains. Consequence: `blog-webcli check` cannot be used here, because it regenerates in memory and would report the removal as a difference; CI runs the build and `git diff` instead. Wanted upstream: a `customize` switch that omits it.
- **G2. Original layout gap, now resolved.** The initial migration used plain headings and paragraphs. The current generator has the widget contract; restoring this particular design needs only allowlisted HTML cards and Custom CSS, with no new widget or script.
- **G3. Share image.** `cover` must be an `asset:` reference pinned to a commit that already holds the file. `images/og.png` is committed at `1d06734` and pinned in `assets.lock.json`; that commit is now on GitHub. Setting `assets.base` to this site's own domain makes every `*.webcli.app` link a `provider-url` refusal, so the base remains `raw.githubusercontent.com`; the page itself never requests it. Restored screenshots use same-origin relative URLs instead.
- **G4. Weight.** The default theme still inlines animate.css, including rules this page does not use. The restored page's cold phone load transfers 148.7 KB in the recorded run, with images below the fold lazy-loaded; LCP is 664 ms and no JavaScript is fetched. See `measure.json` for the five-run method. CSS remains inline; no extra font, stylesheet or script is added by the restored design.
- **G5. No way to set a Content-Security-Policy.** The page this replaced carried one, so a stray request was blocked by the browser. Now it is only caught by CI.
- **G6. A feed nobody asked for.** The generator always writes `feed.xml`, `feed/` and a "Feed" link in the header, which the work order's "no blog or changelog" leaves with nothing to carry. There is no switch for the link.
- The original migration recorded five generator-suite failures on its earlier pin (2026-11-15). That is historical evidence, not a result for the new generator pin.

## Findings about the family

- **F1. `pay.webcli.app`** is not a GitHub Pages record and not dangling in the usual sense: it is a CNAME to `paylinks.commerce.godaddy.com`, which resolves into GoDaddy's payments hosts (`100.49.0.246` among them), and it answers HTTPS 404 "Pay Link Not Found". A payments hostname with no pay link behind it. Delete the record at the registrar unless you are setting a link up.
- **F2. `pose`.** `pose.webcli.app` resolves to GitHub Pages but has no certificate (HTTPS fails), `pose-webCLI` has an empty README, and the pose work order is not in this repository or in the local checkouts, so it has **not** been retitled. By its description (closed bone enum, host resolves, model names, host verifies geometrically) it is the design rig already has: rig's README, "Optional local AI assist", says the model names bones and the host validates them geometrically. Retitle it onto **rig**. Remove the DNS record. The old `tools.json` called it `origin-move`; that entry is gone.
- **F3. Where the lines do not hold.** mocap and rig are distinct (record, retarget) but mocap's `both` mode bakes a GLB onto its two bundled avatars, which is a small retarget of its own. portrait carries a copy of look's editor (`docs/editor/`, an Edit-the-look button), so look is inside portrait. look and portrait transform VRM avatars, not images; they sit under Images because the order says so, and fit better beside rig and 3mf.
- **F4. The shared claim as worded is not true of the family today.** Measured on 2026-11-16: 0 of 12 set `connect-src 'none'`; 8 of 12 ship no Content-Security-Policy at all; 5 of 12 (ffmpeg, whisper, 3mf, magick, chat) load code from third-party CDNs at load (that is the stated load exception, but it is a CDN, not the origin). The page therefore shows the claim with the measurement beside each part and "Not measured" where nothing was.
- **F5. States.** `working` needs a gate table that is linked and passing. hls (46 of 46, real Chrome) and dub (gates D1 to D3, plus 33 unit tests) qualify. Everything else is `early`: ffmpeg, whisper, 3mf, magick and chat have no gate table; look, portrait, rig and mocap have tests but not as a table; blog has one and it does not pass. mocap's source is private, so "an open licence" is 11 of 12.
- **F6. Previous content.** The contract, worked magick example and screenshots from `5256335` are restored, with current boundaries and the example's measurement date stated. The old planned list (facecast, facebuild, imagegen, glb-fbx, portrait-metahuman) remains in history, not presented as current. Agent parameters, result shapes and test ids are now also visible on the cards.

## To do by hand

1. Remove `pay` and `pose` from DNS (or list them with a state).
2. Keep the share-image commit `1d06734` in history; it is now on GitHub.
3. `node scripts/check-descriptions.mjs --apply`, then CI is green.
4. Write the READMEs' one-line opening to match the lines (twelve repositories).
5. Operations for the ledger: one per tool, then raise `operations` in `ledger.json`.
