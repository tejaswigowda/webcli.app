---
slug: tool-dub-webCLI
title: "dub webCLI"
status: published
noindex: true
kind: tool
id: "dub-webCLI"
version: "1.0.0"
live: "https://tejaswigowda.com/dub-webCLI/"
repo: "https://github.com/tejaswigowda/dub-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "No uploads, no servers, no API keys. All processing happens locally in your browser using Transformers.js and ONNX Runtime WebAssembly."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/dub.jpg",
      "alt": "dub-webCLI: subtitle input and timed speech controls."
    },
    "group": "video-audio",
    "line": {
      "in": "an SRT file",
      "out": "one WAV with every cue spoken at its timestamp, and a report.json of overruns and collisions",
      "not": {
        "tool": "whisper",
        "why": "turns speech into text; this only writes speech, and never time-stretches a cue"
      }
    },
    "state": "working",
    "limits": "Byte-identical output holds on the wasm device with q8, not on webgpu. No run= surface yet.",
    "gates": "https://github.com/tejaswigowda/dub-webCLI#tests-and-gates",
    "egress": "none",
    "fetches": [
      "weights:huggingface"
    ],
    "fetches_optional": [],
    "deterministic": "verified",
    "params": [],
    "result": null,
    "testids": [],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for dub.
