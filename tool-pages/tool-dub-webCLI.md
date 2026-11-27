---
slug: tool-dub-webCLI
title: "dub webCLI"
status: published
noindex: true
kind: tool
id: "dub-webCLI"
version: "1.1.0"
live: "https://tejaswigowda.com/dub-webCLI/"
repo: "https://github.com/tejaswigowda/dub-webCLI"
licence: "GPL-3.0"
agent: true
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
      "in": "an SRT file or inline SRT in a URL fragment",
      "out": "one WAV with every cue spoken at its timestamp, and a report.json of overruns and collisions",
      "not": {
        "tool": "whisper",
        "why": "turns speech into text; this only writes speech, and never time-stretches a cue"
      }
    },
    "state": "working",
    "limits": "URL runs accept inline SRT only; the SRT is not fetched from a URL. First use downloads the selected pinned model and voice from Hugging Face. Byte-identical output holds on wasm with q8, not on webgpu.",
    "gates": "https://github.com/tejaswigowda/dub-webCLI#tests-and-gates",
    "egress": "none",
    "fetches": [
      "weights:huggingface"
    ],
    "fetches_optional": [],
    "deterministic": "verified",
    "params": [
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["dub"],
        "description": "Automatically synthesize the inline SRT in the browser."
      },
      {
        "name": "srt",
        "required": true,
        "repeatable": false,
        "description": "URL-encoded SRT text carried in the fragment; never fetched from a URL."
      },
      {
        "name": "voice",
        "required": false,
        "repeatable": false,
        "description": "Voice ID; af_heart by default."
      },
      {
        "name": "tier",
        "required": false,
        "repeatable": false,
        "values": ["default", "better", "best", "q4"],
        "description": "Model precision tier; default q8 is the reproducible choice."
      },
      {
        "name": "device",
        "required": false,
        "repeatable": false,
        "values": ["wasm", "webgpu"],
        "description": "Inference device; wasm by default."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": ["1"],
        "description": "Download dub.wav and report.json automatically."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'dub', artifact: { mime: 'audio/wav', name: 'dub.wav', size, url } | null, error: string | null, meta: { tool, voice, tier, device, report, reportArtifact: { mime: 'application/json', name: 'report.json', size, url } } }"
    },
    "testids": ["statusText", "file", "voice", "tier", "device", "dubBtn", "result", "dlWav", "dlReport"],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for dub.
