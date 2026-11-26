---
slug: tool-3mf-webCLI
title: "3mf webCLI"
status: published
noindex: true
kind: tool
id: "3mf-webCLI"
version: "0.1.0"
live: "https://3mf.webcli.app/"
repo: "https://github.com/tejaswigowda/3mf-webCLI"
licence: "GPL-3.0"
agent: true
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
    "limits": "GLB input only. URL runs export 3MF; the interactive editor can also export segmented GLB. No gate table yet.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr",
      "input-urls:user-named"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "src",
        "required": true,
        "repeatable": false,
        "description": "GLB URL to load with a credential-free GET."
      },
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["convert"],
        "description": "Segment and export 3MF without a click."
      },
      {
        "name": "materials",
        "required": false,
        "repeatable": false,
        "values": ["2", "3", "4", "5", "6", "7", "8"],
        "description": "Fixed material count; omitted for auto-detection."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": ["1"],
        "description": "Also download the generated 3MF."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'convert', artifact: { mime, name, size, dataUrl } | null, error: string | null, meta: { tool, materials } }"
    },
    "testids": [],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for 3mf.
