---
slug: tool-portrait-webCLI
title: "portrait webCLI"
status: published
noindex: true
kind: tool
id: "portrait-webCLI"
version: "0.1.0"
live: "https://portrait.webcli.app/"
repo: "https://github.com/tejaswigowda/portrait-webCLI"
licence: "GPL-3.0"
agent: true
boundary: "Approximate, not a likeness."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/portrait.jpg",
      "alt": "portrait-webCLI: a face photo chooser, a base VRM picker and a Bind button."
    },
    "group": "images",
    "line": {
      "in": "a photo of one face and a base VRM",
      "out": "that VRM with its expressions bound to the face read from the photo",
      "not": {
        "tool": "look",
        "why": "edits an avatar's textures and outfits by hand; this one reads a face, and its result is not a likeness"
      }
    },
    "state": "early",
    "limits": "Approximate, not a likeness. One clear front-facing face. The photo is read from a local file only, so a run needs a person or a runner with the file.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "input-urls:user-named"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "vrm",
        "required": false,
        "repeatable": false,
        "values": [
          "male",
          "female",
          "<url>"
        ],
        "description": "Base VRM; defaults to the bundled male model."
      },
      {
        "name": "run",
        "required": false,
        "repeatable": false,
        "values": [
          "bind"
        ],
        "description": "Start the bind once a photo is supplied from local disk."
      },
      {
        "name": "download",
        "required": false,
        "repeatable": false,
        "values": [
          "1"
        ],
        "description": "With run=bind, also save the result."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'bind', artifact: { mime, name, size, dataUrl } | null, error: string | null, meta }"
    },
    "testids": [
      "bind",
      "download",
      "face-input",
      "photo-input",
      "result",
      "status",
      "vrm-input",
      "vrm-url"
    ],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for portrait.
