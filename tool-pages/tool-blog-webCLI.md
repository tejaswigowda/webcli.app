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
agent: false
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
    "params": [],
    "result": null,
    "testids": [],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for blog.
