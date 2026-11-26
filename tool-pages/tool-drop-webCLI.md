---
slug: tool-drop-webCLI
title: "drop webCLI"
status: published
noindex: true
kind: tool
id: "drop-webCLI"
version: "0.2.8"
live: "https://drop.webcli.app/"
repo: "https://github.com/tejaswigowda/drop-webCLI"
licence: "GPL-3.0-only"
agent: false
boundary: "This is not storage, a cloud locker, a mailbox, or “AirDrop for the internet.” Both browsers must be open at the same time. There is no nearby discovery."
measured: partial
details: |
  {
    "name": "drop",
    "group": "file-transfer",
    "line": {
      "in": "one or more files or folders from your device",
      "out": "verified files exchanged with the people in a temporary room",
      "not": {
        "tool": "box",
        "why": "stores content for later; drop keeps both browsers present and transfers directly"
      }
    },
    "state": "early",
    "limits": "v0.2.8 is functional for current desktop testing. Browser-size ceilings, throughput and the wider device matrix are pending.",
    "gates": null,
    "egress": "user-initiated peer transfer",
    "fetches": [
      "signaling:public-nostr-relays",
      "stun:stun.cloudflare.com"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [],
    "result": null,
    "testids": [],
    "source_status": "public"
  }
---

Index source for drop.
