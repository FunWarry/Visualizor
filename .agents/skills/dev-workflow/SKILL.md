---
name: dev-workflow
description: >-
  Standard development workflow, architectural conventions, and build verification guide for Visualizor.
---

# Visualizor Development Workflow

Use this skill when developing new features, optimizing engine performance, or adding UI controls to Visualizor.

## 1. Environment & Setup

Visualizor is built with **TypeScript**, **Three.js**, **Vite**, and **Web Audio API**.

* **Start Development Server** (with HMR):
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  npm run dev
  ```
* **SonarQube / SonarLint Scan** (Zero defect quality gate: 0 errors, 0 warnings):
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  npm run sonar
  ```
* **Type-Check & Production Build**:
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  npm run build
  ```

## 2. Architectural Conventions

1. **SonarQube Quality Gate**:
   - Every file must adhere to SonarQube standards: no cognitive complexity over limits, no duplicated string literals, no `any` types, zero unused variables or imports, clean resource management.
2. **Modular Audio-Visual Decoupling**:
   - `AudioEngine` handles all audio capture and analysis (FFT, RMS, Beat detection). It knows nothing about Three.js meshes.
   - `RenderEngine` coordinates the 3D scene, cameras, and post-processing shaders. It consumes normalized `AudioFeatures`.
   - `MilkdropEngine` coordinates Butterchurn WebGL visualizer for classic MilkDrop / ProjectM presets.
   - `Presets` implement the `VisualizerPreset` interface and hook into the render loop.
3. **60 FPS Performance Contract**:
   - Zero object allocations inside animation frames (`render()` / `update()`). Pre-allocate all `Vector3`, `Color`, and buffers in `init()`.
   - Use `InstancedMesh` for repeated objects.
   - Combine screen shaders into single-pass post-processing wherever possible.
4. **Disposal Lifecycle**:
   - Every preset must cleanly dispose geometries, materials, and custom textures in `dispose()` to prevent WebGL GPU memory leaks.

