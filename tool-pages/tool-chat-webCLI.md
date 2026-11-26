---
slug: tool-chat-webCLI
title: "chat webCLI"
status: published
noindex: true
kind: tool
id: "chat-webCLI"
version: "unversioned"
live: "https://tejaswigowda.com/chat-webCLI/"
repo: "https://github.com/tejaswigowda/chat-webCLI"
licence: "GPL-3.0"
agent: false
boundary: "A browser-based LLM chat app that runs large language models entirely in your browser using WebLLM and WebGPU - no server, no API keys, no data leaves your device."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/chat.jpg",
      "alt": "chat-webCLI: an on-device model selector and conversation interface."
    },
    "group": "text-publishing",
    "line": {
      "in": "text you type",
      "out": "a reply from a language model running on your own GPU",
      "not": {
        "tool": "blog",
        "why": "writes to a repository and publishes; this one keeps conversations in this browser and sends them nowhere"
      }
    },
    "state": "early",
    "limits": "Needs WebGPU. Model weights are downloaded on first use. Conversations are saved in this browser's localStorage. No gate table yet.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr",
      "code:esm-run",
      "code:github-raw",
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

Index source for chat.
