---
name: test-suite
description: >-
  Testing runbook and quality assurance procedures for Visualizor, covering TypeScript typechecks, audio DSP math, preset lifecycle integrity, and WebGL regression tests.
---

# Visualizor Test Suite & QA Runbook

Use this skill whenever verifying code changes, testing a new preset, or preparing a release of Visualizor.

## 1. Automated Verification Commands

* **Full Static Typecheck**:
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  npx tsc --noEmit
  ```
* **Production Bundle Build Verification**:
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  npm run build
  ```

## 2. Audio Pipeline Verification Checklist

* [ ] **Audio Context Resume**: Audio resumes reliably on user interaction (Click, Play, Upload, Mic).
* [ ] **Multi-band FFT Energy**: Values for `subBass`, `bass`, `mid`, and `treble` remain normalized in range `[0.0, 1.0]`.
* [ ] **Beat Detection**: `beatEnergy` decays smoothly and triggers kick transients without false positives on sustained pads.
* [ ] **Microphone Handling**: Gracefully handles permission denial without unhandled Promise rejections.

## 3. Preset Lifecycle Integrity Checklist

For every preset in `src/presets/`:
* [ ] **Init**: Spawns geometries and materials with initial theme colors.
* [ ] **Update**: Executes smoothly at 60 FPS without allocating objects on the heap.
* [ ] **Theme Change**: Calling `onThemeChange()` updates colors without requiring full re-initialization.
* [ ] **Disposal**: `dispose()` releases all geometries and materials, leaving `scene.children` clean.
* [ ] **Resize**: Resizing window updates aspect ratio and camera projection matrix.

## 4. Export & Video Recording Checklist

* [ ] `MediaRecorder` stream captures both canvas animation and Web Audio destination simultaneously.
* [ ] Generated WebM/MP4 file plays back with synchronized sound.
* [ ] Screenshots capture full-resolution canvas without black screens (`preserveDrawingBuffer: true`).

