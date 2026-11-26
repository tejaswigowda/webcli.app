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
agent: true
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
    "params": [
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["analyze"],
        "description": "Load a PGN or FEN into the local analysis board."
      },
      {
        "name": "pgn",
        "required": false,
        "repeatable": false,
        "description": "PGN to validate and replay locally; mutually exclusive with fen."
      },
      {
        "name": "fen",
        "required": false,
        "repeatable": false,
        "description": "FEN position to validate and open; mutually exclusive with pgn."
      },
      {
        "name": "format",
        "required": false,
        "repeatable": false,
        "values": ["PGN", "FEN"],
        "description": "Output artifact format; PGN by default."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": ["1"],
        "description": "Download the resulting artifact automatically."
      }
    ],
    "result": "window.__webcli_result = { ok, op: 'analyze', artifact: { mime, name, size, dataUrl } | null, error: string | null, meta: { tool, fen, ply, format } }",
    "testids": ["board", "status", "movesOut", "btnPgn", "btnFen", "btnDownload"],
    "source_status": "public"
  }
---

Index source for chess.
