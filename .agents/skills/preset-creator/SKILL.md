---
name: preset-creator
description: >-
  Guide and generator for creating high-performance 3D audio-reactive presets for Visuval using Three.js and custom GLSL shaders.
---

# Preset Creator Skill for Visuval

Use this skill whenever designing, coding, debugging, or optimizing 3D audio-reactive visual presets.

## Preset Interface Specification

Each preset in Visuval must implement the standard `VisualizerPreset` interface:

```typescript
export interface AudioFeatures {
  frequencyData: Uint8Array;    // Raw FFT spectrum (size typically 1024 or 2048)
  timeDomainData: Uint8Array;   // Raw oscilloscope waveform
  subBass: number;              // 20-60 Hz, normalized 0.0 - 1.0
  bass: number;                 // 60-250 Hz, normalized 0.0 - 1.0
  mid: number;                  // 250-4000 Hz, normalized 0.0 - 1.0
  treble: number;               // 4000-20000 Hz, normalized 0.0 - 1.0
  rms: number;                  // Global energy level, normalized 0.0 - 1.0
  beat: boolean;                // Transient kick detection flag (true on beat hit)
  beatEnergy: number;           // Decay envelope of the kick (peaks to 1.0, decays exponentially)
  bpm: number;                  // Detected or manual tempo in BPM
}

export interface PresetContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  theme: VisualizerTheme;
}

export interface VisualizerPreset {
  id: string;
  name: string;
  category: 'Structures' | 'Abstract & Space' | 'Particles & Light' | 'Fluids & Heat' | 'Tunnels' | 'Retro & Digital' | 'Organic & Nature';
  description: string;
  init(ctx: PresetContext): void;
  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void;
  onThemeChange?(theme: VisualizerTheme): void;
  resize?(width: number, height: number): void;
  dispose(): void;
}
```

## Performance Guidelines (Guaranteed 60 FPS)

1. **Zero Garbage Collection in `update`**:
   - Never instantiate objects (`new THREE.Vector3()`, `new THREE.Color()`, arrays) inside the `update` loop.
   - Pre-allocate scratch vectors, matrices, and reusable variables during `init`.

2. **Instancing & Single Draw Calls**:
   - For repeating geometries (cubes, particles, rings, bars), use `THREE.InstancedMesh` with an `InstancedBufferAttribute` or dynamic matrix transform.
   - For particle swarms, use `THREE.Points` with a single `BufferGeometry` and update position/color attributes via `needsUpdate = true` or a custom vertex shader.

3. **Vertex Shader Displacement**:
   - Move vertex positions on the GPU using audio uniforms (`uBass`, `uMid`, `uTreble`, `uTime`) rather than modifying thousands of vertex coordinates on the CPU.

4. **Resource Disposal**:
   - Always traverse and dispose geometries, materials, textures, and custom render targets in `dispose()` to prevent WebGL memory leaks when switching presets:
   ```typescript
   dispose() {
     this.geometry.dispose();
     if (Array.isArray(this.material)) {
       this.material.forEach(m => m.dispose());
     } else {
       this.material.dispose();
     }
     this.scene.remove(this.mesh);
   }
   ```

## Example Preset: Audio-Reactive Morphing Wireframe Icosahedron

```typescript
import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures } from '../types';

export class MorphingIcosahedronPreset implements VisualizerPreset {
  id = 'morphing-icosahedron';
  name = 'Obsidian Morph';
  category = 'Structures' as const;
  description = 'Geometric polyhedron pulsing and deforming dynamically with audio frequencies.';

  private mesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private group!: THREE.Group;
  private material!: THREE.MeshStandardMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    const geometry = new THREE.IcosahedronGeometry(2, 4);
    
    // Cache original vertex positions for audio vertex displacement
    const posAttr = geometry.attributes.position;
    this.basePositions = new Float32Array(posAttr.array);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false,
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.75,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    const wireGeom = new THREE.WireframeGeometry(geometry);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.mesh);
    this.group.add(this.wireframe);
    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    // Rotation based on mid & treble energy
    this.group.rotation.x += delta * (0.2 + audio.mid * 0.8);
    this.group.rotation.y += delta * (0.3 + audio.treble * 1.0);

    // Audio-reactive scale on kick
    const scale = 1.0 + audio.bass * 0.4 + audio.beatEnergy * 0.3;
    this.group.scale.set(scale, scale, scale);

    // Dynamic color shifting with theme
    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 0.8;
    } else {
      this.material.emissiveIntensity *= 0.92;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.primary);
    this.wireMaterial.color.set(theme.accent);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.wireframe.geometry.dispose();
    this.wireMaterial.dispose();
    this.group.removeFromParent();
  }
}
```
