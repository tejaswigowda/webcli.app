---
slug: tool-hls-webCLI
title: "hls webCLI"
status: published
noindex: true
kind: tool
id: "hls-webCLI"
version: "unversioned"
live: "https://hls.webcli.app/"
repo: "https://github.com/tejaswigowda/hls-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "No servers, no accounts, no uploads: your video is decoded and encoded in your browser, and nothing leaves it until you press Publish."
measured: partial
details: |
  {
    "group": "video-audio",
    "line": {
      "in": "an MP4 and the git repository it should live in",
      "out": "a versioned adaptive-streaming release (ladder, segments, playlists) committed and tagged name/vN",
      "not": {
        "tool": "ffmpeg",
        "why": "does general transforms and keeps nothing; this one does exactly one thing"
      }
    },
    "state": "working",
    "limits": "Publishing is a commit to your repository, so it is egress, and it is yours to start. H.264 only; variable-frame-rate and rotated files are refused by name.",
    "gates": "https://github.com/tejaswigowda/hls-webCLI#tests-and-gates",
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

Index source for hls.
