import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class GeodesicSpherePreset implements VisualizerPreset {
  id = 'geodesic-sphere';
  name = 'Geodesic Frequency Sphere';
  category = 'Structures' as const;
  description = 'Geodesic sphere pulsing with audio frequency harmonics across tessellated faces.';

  private group!: THREE.Group;
  private mesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private geometry!: THREE.IcosahedronGeometry;
  private material!: THREE.MeshStandardMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    this.geometry = new THREE.IcosahedronGeometry(3.0, 3);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      roughness: 0.2,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    const wireGeom = new THREE.WireframeGeometry(this.geometry);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.mesh);
    this.group.add(this.wireframe);
    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.x += delta * (0.2 + audio.mid * 0.4);
    this.group.rotation.y += delta * (0.25 + audio.treble * 0.5);

    const pos = this.geometry.attributes.position.array as Float32Array;
    const pulse = audio.bass * 1.4 + audio.beatEnergy * 1.8;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const freqIdx = (i % 256);
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      const scale = 1.0 + (freq * 0.5) + pulse * 0.2 + Math.sin(time * 3.0 + i * 0.1) * 0.1;

      pos[i] = bx * scale;
      pos[i + 1] = by * scale;
      pos[i + 2] = bz * scale;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

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
    this.geometry.dispose();
    this.material.dispose();
    this.wireframe.geometry.dispose();
    this.wireMaterial.dispose();
    this.group.removeFromParent();
  }
}
