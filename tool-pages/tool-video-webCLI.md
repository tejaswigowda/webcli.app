---
slug: tool-video-webCLI
title: "video webCLI"
status: published
noindex: true
kind: tool
id: "video-webCLI"
version: "0.1.0"
live: "https://video.webcli.app/"
repo: "https://github.com/tejaswigowda/video-webCLI"
licence: "UNLICENSED"
agent: false
boundary: "A local-first iMovie-style editor that records, trims, captions and exports video without uploading it."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/video.jpg",
      "alt": "video-webCLI: media library, preview, timeline and export controls."
    },
    "group": "video-audio",
    "line": {
      "in": "screen, camera, microphone or existing video clips",
      "out": "an edited MP4 with mixed audio and optional burned or selectable captions",
      "not": {
        "tool": "ffmpeg",
        "why": "records and assembles an editing timeline; ffmpeg transforms media files you already have"
      }
    },
    "state": "early",
    "limits": "Capture is an explicit browser permission. Export determinism is not guaranteed across browser builds or hardware. No run= surface yet.",
    "gates": null,
    "egress": "none",
    "fetches": [],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [],
    "result": null,
    "testids": ["media-input", "start-button", "stop-button", "preview", "timeline-clips", "export-mp4"],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for video.
