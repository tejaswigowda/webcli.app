---
slug: tool-3mf-webCLI
title: "3mf webCLI"
status: published
noindex: true
kind: tool
id: "3mf-webCLI"
version: "0.1.0"
live: "https://tejaswigowda.com/3mf-webCLI/"
repo: "https://github.com/tejaswigowda/3mf-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "No uploads, no servers - all processing happens locally in your browser."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/3mf.jpg",
      "alt": "3mf-webCLI: a 3D model preview and multi-material printing controls."
    },
    "group": "3d-motion",
    "line": {
      "in": "a GLB model",
      "out": "a 3MF with its materials segmented by colour, for multi-material printing",
      "not": {
        "tool": "rig",
        "why": "bakes motion into an animated GLB; this converts one model to one print format and animates nothing"
      }
    },
    "state": "early",
    "limits": "GLB in, 3MF out, nothing else. No gate table yet and no run= surface.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [],
    "result": null,
    "testids": [],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for 3mf.
