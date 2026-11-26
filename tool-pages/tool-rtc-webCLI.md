---
slug: tool-rtc-webCLI
title: "rtc webCLI"
status: published
noindex: true
kind: tool
id: "rtc-webCLI"
version: "0.3.0"
live: "https://tejaswigowda.com/rtc-webCLI/"
repo: "https://github.com/tejaswigowda/rtc-webCLI"
licence: "GPL-3.0-only"
agent: false
boundary: "A call has to send. Your media goes to the other people in the room, and the introduction relays and a STUN server are contacted to set that up."
measured: partial
details: |
  {
    "name": "rtc",
    "group": "calls",
    "line": {
      "in": "an invite link, plus camera, microphone or screen when you choose to share them",
      "out": "a live peer-to-peer call; no file or artifact",
      "not": {
        "tool": "chess",
        "why": "exchanges signed game moves and offers; rtc sends live media between participants"
      }
    },
    "state": "early",
    "limits": "v0.3.0 (protocol 3) has not yet been run on real devices. The latest recorded device run was on v0.2.0: two runs passed and one failed on one home Wi-Fi network.",
    "gates": null,
    "egress": "user-initiated media to peers; signaling through relays and STUN",
    "fetches": [
      "relays:public-nostr",
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

Index source for rtc.
