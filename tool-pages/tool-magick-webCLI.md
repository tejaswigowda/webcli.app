---
slug: tool-magick-webCLI
title: "magick webCLI"
status: published
noindex: true
kind: tool
id: "magick-webCLI"
version: "unversioned"
live: "https://magick.webcli.app/"
repo: "https://github.com/tejaswigowda/magick-webCLI"
licence: "Apache-2.0"
agent: true
boundary: "No uploads, no servers, all processing happens locally in your browser."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/magick.jpg",
      "alt": "magick-webCLI: image input, processing controls and an output preview."
    },
    "group": "images",
    "line": {
      "in": "image files from your device",
      "out": "those images converted between 100+ formats, or edited with chained, batchable operations",
      "not": {
        "tool": "look",
        "why": "edits the textures and materials of a VRM avatar; this one edits pictures and knows nothing of avatars"
      }
    },
    "state": "early",
    "limits": "No gate table yet.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "src",
        "required": true,
        "repeatable": true,
        "description": "Image input URL(s), loaded with a credential-free GET."
      },
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["convert", "resize", "crop", "rotate", "grayscale", "sepia", "blur", "sharpen", "watermark", "montage", "compare"],
        "description": "One operation or conversion to run without a click."
      },
      {
        "name": "params",
        "required": false,
        "repeatable": false,
        "description": "JSON object containing operation parameters."
      },
      {
        "name": "format",
        "required": false,
        "repeatable": false,
        "values": ["PNG", "JPEG", "WEBP", "GIF", "BMP", "TIFF", "AVIF"],
        "description": "Output format; PNG is the default."
      },
      {
        "name": "quality",
        "required": false,
        "repeatable": false,
        "description": "Integer output quality from 1 to 100."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": ["1"],
        "description": "Click the download control automatically after success."
      }
    ],
    "result": "window.__webcli_result = { ok, op, artifact: { mime, name, size, dataUrl } | null, error: string | null, meta }",
    "testids": ["dropzone", "batchToggle", "opSelect", "processBtn", "downloadLink", "result", "resultEmpty", "log"],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for magick.
