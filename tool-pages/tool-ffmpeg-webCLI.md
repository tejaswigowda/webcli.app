---
slug: tool-ffmpeg-webCLI
title: "ffmpeg webCLI"
status: published
noindex: true
kind: tool
id: "ffmpeg-webCLI"
version: "2.0.0"
live: "https://tejaswigowda.com/ffmpeg-webCLI/"
repo: "https://github.com/tejaswigowda/ffmpeg-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "No uploads, no servers -- all processing happens locally in your browser using WebAssembly."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/ffmpeg.jpg",
      "alt": "ffmpeg-webCLI: a video drop zone, trim sliders and operations for converting, resizing, extracting audio and GIF."
    },
    "group": "video-audio",
    "line": {
      "in": "a video, audio or image file from your device",
      "out": "that media trimmed, converted, scaled or compressed, or as a GIF or extracted audio",
      "not": {
        "tool": "hls",
        "why": "only builds and manages adaptive-streaming libraries; this one is the general transforms"
      }
    },
    "state": "early",
    "limits": "No gate table yet and no run= surface.",
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

Index source for ffmpeg.
