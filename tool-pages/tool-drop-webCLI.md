---
slug: tool-drop-webCLI
title: "drop webCLI"
status: published
noindex: true
kind: tool
id: "drop-webCLI"
version: "0.3.0"
live: "https://drop.webcli.app/"
repo: "https://github.com/tejaswigowda/drop-webCLI"
licence: "GPL-3.0-only"
agent: true
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
    "limits": "v0.3.0 adds local invite generation through #run=invite. It does not join a room or contact the network; browser-size ceilings, throughput and the wider device matrix are pending.",
    "gates": null,
    "egress": "local invite generation; user-initiated peer transfer",
    "fetches": [
      "signaling:public-nostr-relays",
      "stun:stun.cloudflare.com"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["invite"],
        "description": "Create a time-limited room invite locally without joining a room or contacting the network."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'invite', artifact: { mime: 'text/plain', name, size, dataUrl } | null, error: string | null, meta: { tool, inviteUrl, expiresAt, roomJoined, network } }"
    },
    "testids": ["runPanel", "runInvite", "copyRunInvite", "runInviteOpen"],
    "source_status": "public"
  }
---

Index source for drop.
