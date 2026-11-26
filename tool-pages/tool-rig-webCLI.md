---
slug: tool-rig-webCLI
title: "rig webCLI"
status: published
noindex: true
kind: tool
id: "rig-webCLI"
version: "0.1.0"
live: "https://rig.webcli.app/"
repo: "https://github.com/tejaswigowda/rig-webCLI"
licence: "GPL-3.0"
agent: true
boundary: "No uploads, no servers: everything happens in your browser."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/rig.jpg",
      "alt": "rig-webCLI: character, motion and retargeting controls."
    },
    "group": "3d-motion",
    "line": {
      "in": "a skinned character (FBX, GLB or VRM) and motion files (BVH, FBX or GLB)",
      "out": "one optimized animated GLB carrying each motion as its own track",
      "not": {
        "tool": "mocap",
        "why": "records motion from a camera; this one watches nothing and retargets motion that already exists"
      }
    },
    "state": "early",
    "limits": "The optional in-page assist is off by default; turning it on downloads about 1 GB of model weights. Its tests are not yet published as a gate table.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "input-urls:user-named"
    ],
    "fetches_optional": [
      "code:esm-run",
      "weights:huggingface"
    ],
    "deterministic": "verified",
    "params": [
      {
        "name": "character",
        "required": true,
        "repeatable": false,
        "description": "URL of the character (FBX, GLB, VRM)."
      },
      {
        "name": "motion",
        "required": true,
        "repeatable": true,
        "description": "URL of a BVH or face-record JSON; repeat for several tracks."
      },
      {
        "name": "map",
        "required": false,
        "repeatable": false,
        "description": "URL of a flat bone-map JSON."
      },
      {
        "name": "args",
        "required": false,
        "repeatable": false,
        "description": "Raw bake flags, e.g. \"--fps 24 --trim 2:10\"."
      },
      {
        "name": "run",
        "required": false,
        "repeatable": false,
        "values": [
          "bake"
        ],
        "description": "Start the op as soon as the page loads."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op: 'bake', artifact: { mime, name, size, dataUrl } | null, error: string | null, meta: { tracks, frames, fps, mapped, bones, units, blendshapes } }"
    },
    "testids": [
      "character-input",
      "motion-input",
      "bake",
      "command",
      "run",
      "result",
      "download"
    ],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for rig.
