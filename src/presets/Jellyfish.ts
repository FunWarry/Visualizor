import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class JellyfishPreset implements VisualizerPreset {
  id = 'jellyfish-mycelium';
  name = 'Bioluminescent Jellyfish';
  category = 'Organic & Nature' as const;
  description = 'Pulsating translucent jellyfish dome with undulating tentacle ribbons and mycelium network.';

  private group!: THREE.Group;
  private bellMesh!: THREE.Mesh;
  private tentacles: THREE.Line[] = [];
  private bellMaterial!: THREE.MeshPhysicalMaterial;
  private tentacleMaterial!: THREE.LineBasicMaterial;
  private tentacleCount = 12;
  private nodesPerTentacle = 24;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Jellyfish Bell Dome
    const bellGeom = new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    this.bellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      transmission: 0.6,
      side: THREE.DoubleSide
    });
    this.bellMesh = new THREE.Mesh(bellGeom, this.bellMaterial);
    this.bellMesh.position.y = 1.5;
    this.group.add(this.bellMesh);

    // 2. Trailing Tentacle Ribbons
    this.tentacleMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.7
    });

    for (let t = 0; t < this.tentacleCount; t++) {
      const angle = (t / this.tentacleCount) * Math.PI * 2;
      const r = 1.4;
      const pts: THREE.Vector3[] = [];

      for (let n = 0; n < this.nodesPerTentacle; n++) {
        const y = 1.5 - (n * 0.25);
        pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, this.tentacleMaterial);
      this.tentacles.push(line);
      this.group.add(line);
    }

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.y += delta * 0.2;

    // Bell propulsion pulsation on beat
    const pulse = Math.sin(time * 3.0) * 0.2 + (audio.beat ? 0.35 : 0) + audio.bass * 0.2;
    this.bellMesh.scale.set(1.0 - pulse * 0.2, 1.0 + pulse * 0.5, 1.0 - pulse * 0.2);
    this.group.position.y = Math.sin(time * 1.5) * 0.8;

    // Sinuous undulation along tentacles
    this.tentacles.forEach((tentacle, tIdx) => {
      const pos = (tentacle.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
      const angle = (tIdx / this.tentacleCount) * Math.PI * 2;

      for (let n = 1; n < this.nodesPerTentacle; n++) {
        const wave = Math.sin(time * 4.0 - n * 0.3 + tIdx) * (0.05 + audio.mid * 0.15);
        pos[n * 3] += Math.cos(angle) * wave;
        pos[n * 3 + 2] += Math.sin(angle) * wave;
      }
      tentacle.geometry.attributes.position.needsUpdate = true;
    });

    if (audio.beat) {
      this.bellMaterial.emissiveIntensity = 1.4;
    } else {
      this.bellMaterial.emissiveIntensity *= 0.94;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.bellMaterial.color.set(theme.primary);
    this.bellMaterial.emissive.set(theme.accent);
    this.tentacleMaterial.color.set(theme.accent);
  }

  dispose() {
    this.bellMesh.geometry.dispose();
    this.bellMaterial.dispose();
    this.tentacleMaterial.dispose();
    this.tentacles.forEach(t => t.geometry.dispose());
    this.group.removeFromParent();
  }
}
