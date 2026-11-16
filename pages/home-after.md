---
slug: home-after
title: What all twelve share
status: published
noindex: true
---

## What all twelve share

Stated once here, so it cannot drift across twelve READMEs. The left column is the claim; the right is what has been measured, and where nothing has been measured it says so.

| Claim | Measured today |
| --- | --- |
| A persistent egress ledger that reads zero | 12 of 12 made no non-GET request, sent no request body and made no request after the network was cut, from load to idle (2026-11-16). A representative operation is written for 0 of 12. |
| connect-src 'none' once loaded | 0 of 12. 4 ship a Content-Security-Policy at all. |
| No credentials reachable from a worker | Not measured. |
| Refusals by name rather than silent approximation | Not measured across the family. |
| An open licence | 11 of 12; the source of mocap is not public yet. |
| Operates offline once loaded | Not measured. |

**Two exceptions, and they are part of the claim.** Loading is egress: fetching the WebAssembly core and any model is a request, always a GET with no body, and each tool's `fetches` in [tools.json](tools.json) names what it fetches. Publishing is egress the user starts: [hls](https://hls.webcli.app/) and [blog](https://blog.webcli.app/) commit to a repository, and nothing is sent until you press Publish; [hls says so in its Privacy and Egress section](https://github.com/tejaswigowda/hls-webCLI#privacy--egress).

## The ledger, per tool

Each tool's origin was loaded in a fresh Chrome profile with the cache off, left idle for 8 s, then the network was cut and it was left idle for 5 s more; every request was logged from the DevTools protocol. Hosts other than the tool's own are what it fetched while loading, the first exception above. Non-GET and body bytes count anything that is not a bodiless GET. No tool was operated (that is 0 of 12 representative operations written), so this is load and idle, not use.

| Tool | Requests at load | Hosts other than its own | Non-GET | Body bytes | After the cut |
| --- | --- | --- | --- | --- | --- |
| ffmpeg | 15 | cdn.jsdelivr.net, cdnjs.cloudflare.com | 0 | 0 | 0 |
| hls | 22 | none | 0 | 0 | 0 |
| whisper | 12 | cdn.jsdelivr.net, cdnjs.cloudflare.com | 0 | 0 | 0 |
| dub | 7 | none | 0 | 0 | 0 |
| 3mf | 16 | cdn.jsdelivr.net, cdnjs.cloudflare.com | 0 | 0 | 0 |
| mocap | 26 | none | 0 | 0 | 0 |
| rig | 31 | none | 0 | 0 | 0 |
| magick | 11 | cdnjs.cloudflare.com | 0 | 0 | 0 |
| look | 15 | none | 0 | 0 | 0 |
| portrait | 38 | none | 0 | 0 | 0 |
| blog | 103 | none | 0 | 0 | 0 |
| chat | 8 | cdn.jsdelivr.net, cdnjs.cloudflare.com, esm.run | 0 | 0 | 0 |

## Measured on this page

This page makes no request to any other host; CI loads it with a cold cache and fails on the first request that is not to its own origin, and the same check can be repeated in DevTools, Network, with Disable cache on.

Lab measurement of this page, median of 5: **0 JavaScript files**, 2 requests, 92.4 KB transferred, first contentful paint 584 ms, largest contentful paint **616 ms**, total blocking time **0 ms**.

Method: blog-webCLI's cli/speed.mjs in headless Chrome: Slow 4G (1.6 Mbit/s down, 150 ms round trip), 4x CPU slowdown, a 390 px phone, a new browser profile for every run with the cache off, 5 runs, median reported; FCP and LCP from PerformanceObserver, total blocking time summed from long tasks after first paint; JavaScript counted from the network log. Lab data from one machine, served from 127.0.0.1, so the throttle supplies the latency but not DNS, TLS or distance; measured 2026-11-16.

## Agents and scripts

The tools are meant to be driven by a URL and to return an artifact; 3 of 12 (rig, look, portrait) have the `run=` surface today. [tools.json](tools.json) is the machine-readable index of this page: for each tool its origin, what it fetches and, where it has one, that surface (parameters, `window.__webcli_result`, test ids). Nothing here needs an account; the two tools that publish are the exception stated above.

- [portrait privacy audit (zero egress)](https://github.com/tejaswigowda/portrait-webCLI/blob/main/PRIVACY.md)
- [rig: how to verify zero egress, asserted by its test suite](https://github.com/tejaswigowda/rig-webCLI#verify-zero-egress)
