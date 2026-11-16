---
slug: home
title: webCLI
status: published
noindex: true
---

# webCLI

{.lead} Twelve tools that each transform one kind of thing in a browser tab. What you give one is not uploaded, with two stated exceptions below; [the paper](https://arxiv.org/abs/2608.28950) explains the architecture. Each is listed with what goes in, what comes out, what it is not, and a state that says how far to trust it.

## Video and audio

### [ffmpeg](https://ffmpeg.webcli.app/)

**In:** a video, audio or image file from your device. **Out:** that media trimmed, converted, scaled or compressed, or as a GIF or extracted audio. **Not:** hls, which only builds and manages adaptive-streaming libraries; this one is the general transforms.

{.small} **early.** No gate table yet and no run= surface.

### [hls](https://hls.webcli.app/)

**In:** an MP4 and the git repository it should live in. **Out:** a versioned adaptive-streaming release (ladder, segments, playlists) committed and tagged name/vN. **Not:** ffmpeg, which does general transforms and keeps nothing; this one does exactly one thing.

{.small} **working.** [Its gates](https://github.com/tejaswigowda/hls-webCLI#tests-and-gates) pass. Publishing is a commit to your repository, so it is egress, and it is yours to start. H.264 only; variable-frame-rate and rotated files are refused by name.

### [whisper](https://whisper.webcli.app/)

**In:** an audio or video file from your device. **Out:** a transcript as text, SRT or WebVTT. **Not:** dub, which goes the other way, from subtitles to speech.

{.small} **early.** No gate table yet and no run= surface. The Whisper model is downloaded on first use.

### [dub](https://dub.webcli.app/)

**In:** an SRT file. **Out:** one WAV with every cue spoken at its timestamp, and a report.json of overruns and collisions. **Not:** whisper, which turns speech into text; this only writes speech, and never time-stretches a cue.

{.small} **working.** [Its gates](https://github.com/tejaswigowda/dub-webCLI#tests-and-gates) pass. Byte-identical output holds on the wasm device with q8, not on webgpu. No run= surface yet.

## 3D and motion

### [3mf](https://3mf.webcli.app/)

**In:** a GLB model. **Out:** a 3MF with its materials segmented by colour, for multi-material printing. **Not:** rig, which bakes motion into an animated GLB; this converts one model to one print format and animates nothing.

{.small} **early.** GLB in, 3MF out, nothing else. No gate table yet and no run= surface.

### [mocap](https://mocap.webcli.app/)

**In:** a webcam or a video file of a person. **Out:** body motion as a BVH and face motion as ARKit blendshapes JSON. **Not:** rig, which retargets motion onto a character you bring; this one only records, and bakes only onto its two bundled avatars.

{.small} **early.** The source repository is private, so there is no open licence yet. One webcam cannot give studio-grade face and body at once. First load is about 100 MB.

### [rig](https://rig.webcli.app/)

**In:** a skinned character (FBX, GLB or VRM) and motion files (BVH, FBX or GLB). **Out:** one optimized animated GLB carrying each motion as its own track. **Not:** mocap, which records motion from a camera; this one watches nothing and retargets motion that already exists.

{.small} **early.** The optional in-page assist is off by default; turning it on downloads about 1 GB of model weights. Its tests are not yet published as a gate table.

## Images

### [magick](https://magick.webcli.app/)

**In:** image files from your device. **Out:** those images converted between 100+ formats, or edited with chained, batchable operations. **Not:** look, which edits the textures and materials of a VRM avatar; this one edits pictures and knows nothing of avatars.

{.small} **early.** No gate table yet and no run= surface.

### [look](https://look.webcli.app/)

**In:** a VRM avatar. **Out:** the same avatar, as a VRM, with its textures, materials, outfits or accessories changed. **Not:** portrait, which reads a face from a photo and binds it to a VRM; this one never sees a photo.

{.small} **early.** The editor re-exports through its own writer, so the output is not a byte-audited edit of the input. Determinism is measured on the two bundled bases only.

### [portrait](https://portrait.webcli.app/)

**In:** a photo of one face and a base VRM. **Out:** that VRM with its expressions bound to the face read from the photo. **Not:** look, which edits an avatar's textures and outfits by hand; this one reads a face, and its result is not a likeness.

{.small} **early.** Approximate, not a likeness. One clear front-facing face. The photo is read from a local file only, so a run needs a person or a runner with the file.

## Text and publishing

### [blog](https://blog.webcli.app/)

**In:** markdown posts in a GitHub repository. **Out:** static HTML pages, a feed and a sitemap committed back to that repository. **Not:** hls, which makes the video releases a post can embed; this one encodes no video.

{.small} **early.** Publishing is a commit to your repository, so it is egress, and it is yours to start. Its own test suite had 5 failures of 598 on 2026-11-15. Every page it generates loads Font Awesome from cdnjs, with no way to turn that off.

### [chat](https://chat.webcli.app/)

**In:** text you type. **Out:** a reply from a language model running on your own GPU. **Not:** blog, which writes to a repository and publishes; this one keeps conversations in this browser and sends them nowhere.

{.small} **early.** Needs WebGPU. Model weights are downloaded on first use. Conversations are saved in this browser's localStorage. No gate table yet.
