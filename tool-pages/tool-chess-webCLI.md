---
slug: tool-chess-webCLI
title: "chess webCLI"
status: published
noindex: true
kind: tool
id: "chess-webCLI"
version: "0.2.0"
live: "https://chess.webcli.app/"
repo: "https://github.com/tejaswigowda/chess-webCLI"
licence: "GPL-3.0-only"
agent: false
boundary: "On-device games are zero-egress. Rooms cannot be, because moves have to reach the other player; every request is declared and checkable in DevTools instead."
measured: partial
details: |
  {
    "name": "chess",
    "group": "games",
    "line": {
      "in": "an invite link, or nothing for a game on this device",
      "out": "a game, with a PGN saved on this device if you choose",
      "not": {
        "tool": "rtc",
        "why": "makes live calls; chess exchanges signed moves and can keep a game in a git repository"
      }
    },
    "state": "early",
    "limits": "v0.2.0 (protocol 1). One network test passed; the wider real-device/network matrix, the real GitHub API path and the optional model on a real GPU remain unverified.",
    "gates": null,
    "egress": "rooms: peers, relays and STUN; git-backed games: user-initiated GitHub commits",
    "fetches": [
      "relays:public-nostr",
      "stun:stun.cloudflare.com",
      "weights:huggingface",
      "api:github"
    ],
    "fetches_optional": [],
    "deterministic": "verified",
    "params": [],
    "result": null,
    "testids": [],
    "source_status": "public"
  }
---

Index source for chess.
