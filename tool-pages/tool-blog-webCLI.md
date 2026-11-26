---
slug: tool-blog-webCLI
title: "blog webCLI"
status: published
noindex: true
kind: tool
id: "blog-webCLI"
version: "0.5.1"
live: "https://blog.webcli.app/"
repo: "https://github.com/tejaswigowda/blog-webCLI"
licence: "GPL-3.0 (tool), MIT (runtime)"
agent: true
boundary: "No application server or per-site deployment is required."
measured: partial
details: |
  {
    "group": "text-publishing",
    "line": {
      "in": "Markdown pages and optional posts in a GitHub repository",
      "out": "a static website committed back to that repository, with a feed when it has posts",
      "not": {
        "tool": "hls",
        "why": "makes the video releases a post can embed; this one encodes no video"
      }
    },
    "state": "early",
    "limits": "Publishing is a commit to your repository, so it is egress, and it is yours to start. Its own test suite had 5 failures of 598 on 2026-11-15. Every page it generates loads Font Awesome from cdnjs, with no way to turn that off.",
    "gates": null,
    "egress": "user-initiated",
    "fetches": null,
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "markdown",
        "required": false,
        "repeatable": false,
        "description": "Inline Markdown text to render; used when src is omitted."
      },
      {
        "name": "src",
        "required": false,
        "repeatable": false,
        "description": "HTTP(S), data or blob URL for Markdown input."
      },
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["render"],
        "description": "Render Markdown to HTML without a click."
      },
      {
        "name": "format",
        "required": false,
        "repeatable": false,
        "values": ["HTML"],
        "description": "The only supported output format."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": ["1"],
        "description": "Download the rendered HTML automatically."
      }
    ],
    "result": "window.__webcli_result = { ok, op: 'render', artifact: { mime: 'text/html', name, size, dataUrl } | null, error: string | null, meta }",
    "testids": ["run", "download", "result", "status"],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for blog.
