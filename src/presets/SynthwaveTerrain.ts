import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class SynthwaveTerrainPreset implements VisualizerPreset {
  id = 'synthwave-terrain';
  name = 'Synthwave Highway';
  category = 'Abstract & Space' as const;
  description = 'Infinite neon wireframe highway with a glowing horizon sun reacting to kicks.';

  private group!: THREE.Group;
  private terrainMesh!: THREE.Mesh;
  private terrainGeom!: THREE.PlaneGeometry;
  private terrainMat!: THREE.MeshStandardMaterial;
  private sunMesh!: THREE.Mesh;
  private sunMat!: THREE.MeshBasicMaterial;
  private baseHeights!: Float32Array;
  private readonly cols = 48;
  private readonly rows = 64;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // Infinite scrolling terrain grid
    this.terrainGeom = new THREE.PlaneGeometry(32, 48, this.cols - 1, this.rows - 1);
    this.terrainGeom.rotateX(-Math.PI / 2.3);

    const pos = this.terrainGeom.attributes.position.array as Float32Array;
    this.baseHeights = new Float32Array(pos.length);

    // Initial mountain valleys on the edges, flat highway in the center
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const distFromCenter = Math.abs(x) / 16;
      if (distFromCenter > 0.35) {
        pos[i + 2] = Math.pow(distFromCenter, 2.2) * 5.0;
      }
      this.baseHeights[i + 2] = pos[i + 2];
    }
    this.terrainGeom.attributes.position.needsUpdate = true;

    this.terrainMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8
    });

    this.terrainMesh = new THREE.Mesh(this.terrainGeom, this.terrainMat);
    this.terrainMesh.position.set(0, -2.5, -10);
    this.group.add(this.terrainMesh);

    // Synthwave Sun on the horizon
    const sunGeom = new THREE.CircleGeometry(6, 48);
    this.sunMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.95
    });
    this.sunMesh = new THREE.Mesh(sunGeom, this.sunMat);
    this.sunMesh.position.set(0, 1.5, -28);
    this.group.add(this.sunMesh);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number) {
    const pos = this.terrainGeom.attributes.position.array as Float32Array;

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const distFromCenter = Math.abs(x) / 16;

      // Scrolling terrain waves
      const noise = Math.sin(pos[i + 1] * 0.4 + time * 4.0) * audio.bass * 1.5;
      if (distFromCenter > 0.3) {
        pos[i + 2] = this.baseHeights[i + 2] * (1.0 + audio.bass * 0.8) + noise;
      } else {
        // Center highway react to sub-bass wave
        pos[i + 2] = Math.sin(pos[i + 1] * 0.5 + time * 5.0) * audio.subBass * 0.6;
      }
    }

    this.terrainGeom.attributes.position.needsUpdate = true;

    // Sun scale pulse on kick
    const sunScale = 1.0 + audio.bass * 0.3 + audio.beatEnergy * 0.4;
    this.sunMesh.scale.set(sunScale, sunScale, 1);

    if (audio.beat) {
      this.terrainMat.emissive.set(ctx.theme.glow);
      this.terrainMat.emissiveIntensity = 1.0;
    } else {
      this.terrainMat.emissiveIntensity *= 0.93;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.terrainMat.color.set(theme.primary);
    this.terrainMat.emissive.set(theme.accent);
    this.sunMat.color.set(theme.accent);
  }

  dispose() {
    this.terrainGeom.dispose();
    this.terrainMat.dispose();
    this.sunMesh.geometry.dispose();
    this.sunMat.dispose();
    this.group.removeFromParent();
  }
}

