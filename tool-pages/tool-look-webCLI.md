---
slug: tool-look-webCLI
title: "look webCLI"
status: published
noindex: true
kind: tool
id: "look-webCLI"
version: "0.1.0"
live: "https://look.webcli.app/"
repo: "https://github.com/tejaswigowda/look-webCLI"
licence: "GPL-3.0"
agent: true
boundary: "It is not an installable offline PWA."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/look.jpg",
      "alt": "look-webCLI: a VRM chooser and texture, material and blendshape editing tabs."
    },
    "group": "images",
    "line": {
      "in": "a VRM avatar",
      "out": "the same avatar, as a VRM, with its textures, materials, outfits or accessories changed",
      "not": {
        "tool": "portrait",
        "why": "reads a face from a photo and binds it to a VRM; this one never sees a photo"
      }
    },
    "state": "early",
    "limits": "The editor re-exports through its own writer, so the output is not a byte-audited edit of the input. Determinism is measured on the two bundled bases only.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "input-urls:user-named"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "vrm",
        "required": true,
        "repeatable": false,
        "description": "URL of the VRM to edit."
      },
      {
        "name": "run",
        "required": false,
        "repeatable": false,
        "values": [
          "export"
        ],
        "description": "Load the VRM and export it without a click."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'export', artifact: { mime, name, size, dataUrl } | null, error: string | null, meta: { source, bytesIn, bytesOut, vrmVersion } }"
    },
    "testids": [
      "vrm-input",
      "vrm-url",
      "load",
      "sample",
      "download",
      "result"
    ],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for look.
