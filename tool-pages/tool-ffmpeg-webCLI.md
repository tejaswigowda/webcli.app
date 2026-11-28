---
slug: tool-ffmpeg-webCLI
title: "ffmpeg webCLI"
status: published
noindex: true
kind: tool
id: "ffmpeg-webCLI"
version: "2.1.0"
live: "https://tejaswigowda.com/ffmpeg-webCLI/"
repo: "https://github.com/tejaswigowda/ffmpeg-webCLI"
licence: "GPL-3.0"
agent: true
boundary: "No uploads, no servers -- all processing happens locally in your browser using WebAssembly."
measured: partial
details: |
  {
    "thumb": {
      "src": "shots/thumbs/ffmpeg.jpg",
      "alt": "ffmpeg-webCLI: a video drop zone, trim sliders and operations for converting, resizing, extracting audio and GIF."
    },
    "group": "video-audio",
    "line": {
      "in": "a local media file and validated operation parameters in the URL fragment",
      "out": "that media trimmed, converted, scaled or compressed, or as a GIF or extracted audio",
      "not": {
        "tool": "hls",
        "why": "only builds and manages adaptive-streaming libraries; this one is the general transforms"
      }
    },
    "state": "early",
    "limits": "The media file is selected or dropped separately; it is never fetched from a URL. First use downloads the FFmpeg WebAssembly core from jsDelivr.",
    "gates": null,
    "egress": "none",
    "fetches": [
      "code:cdnjs",
      "code:jsdelivr"
    ],
    "fetches_optional": [],
    "deterministic": "unverified",
    "params": [
      {
        "name": "run",
        "required": true,
        "repeatable": false,
        "values": ["trim", "convert", "compress", "extract_audio", "gif"],
        "description": "Automatically run one of the existing validated media operations."
      },
      {
        "name": "start",
        "required": false,
        "repeatable": false,
        "description": "Trim start in seconds; required with end for run=trim."
      },
      {
        "name": "end",
        "required": false,
        "repeatable": false,
        "description": "Trim end in seconds; required with start for run=trim."
      },
      {
        "name": "format",
        "required": false,
        "repeatable": false,
        "values": ["mp4", "webm", "mkv", "mov", "avi", "mp3", "aac", "wav", "ogg", "flac"],
        "description": "Output format for convert or extract_audio; the allowed subset depends on the operation."
      },
      {
        "name": "crf",
        "required": false,
        "repeatable": false,
        "description": "Compression quality integer from 0 to 51; required with preset for run=compress."
      },
      {
        "name": "preset",
        "required": false,
        "repeatable": false,
        "values": ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"],
        "description": "Compression preset; required with crf for run=compress."
      },
      {
        "name": "bitrate",
        "required": false,
        "repeatable": false,
        "description": "Optional audio bitrate integer from 32 to 320 kbps for run=extract_audio."
      },
      {
        "name": "fps",
        "required": false,
        "repeatable": false,
        "description": "GIF frame rate integer from 1 to 30; required with width for run=gif."
      },
      {
        "name": "width",
        "required": false,
        "repeatable": false,
        "description": "GIF output width integer from 16 to 1920; required with fps for run=gif."
      }
    ],
    "result": {
      "handle": "window.__webcli_result",
      "shape": "{ ok, op, artifact: { mime, name, size, dataUrl } | null, error: string | null, meta: { tool, command, input, args } }"
    },
    "testids": ["fileInput", "hashCmdBanner", "outContent", "outMeta", "processBtn"],
    "source_status": "public",
    "kind": "artifact"
  }
---

Index source for ffmpeg.
