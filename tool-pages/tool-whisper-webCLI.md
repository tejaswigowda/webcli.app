---
slug: tool-whisper-webCLI
title: "whisper webCLI"
status: published
noindex: true
kind: tool
id: "whisper-webCLI"
version: "unversioned"
live: "https://tejaswigowda.com/whisper-webCLI/"
repo: "https://github.com/tejaswigowda/whisper-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "No uploads, no servers. All processing happens locally in your browser using Transformers.js and ONNX models."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/whisper.jpg",
      "alt": "whisper-webCLI: audio transcription and subtitle controls."
    },
    "group": "video-audio",
    "line": {
      "in": "an audio or video file from your device",
      "out": "a transcript as text, SRT or WebVTT",
      "not": {
        "tool": "dub",
        "why": "goes the other way, from subtitles to speech"
      }
    },
    "state": "early",
    "limits": "No gate table yet and no run= surface. The Whisper model is downloaded on first use.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr",
      "weights:huggingface"
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

Index source for whisper.
