import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class BlackHolePreset implements VisualizerPreset {
  id = 'black-hole';
  name = 'Black Hole Singularity';
  category = 'Abstract & Space' as const;
  description = 'Gravitational lensing vortex with an incandescent swirling accretion disk.';

  private group!: THREE.Group;
  private coreMesh!: THREE.Mesh;
  private diskPoints!: THREE.Points;
  private diskGeometry!: THREE.BufferGeometry;
  private diskMaterial!: THREE.PointsMaterial;
  private readonly count = 5000;
  private angles!: Float32Array;
  private radii!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // Pure black event horizon sphere
    const coreGeom = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(this.coreMesh);

    // Glowing accretion disk particles
    this.diskGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.angles = new Float32Array(this.count);
    this.radii = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const radius = 2.0 + Math.pow(Math.random(), 1.5) * 6.5;
      const angle = Math.random() * Math.PI * 2;
      this.radii[i] = radius;
      this.angles[i] = angle;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * (radius / 3.0);
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    this.diskGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.diskMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.18,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.diskPoints = new THREE.Points(this.diskGeometry, this.diskMaterial);
    this.group.add(this.diskPoints);

    // Tilt accretion disk
    this.group.rotation.x = 0.55;
    this.group.rotation.z = 0.2;

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    const pos = this.diskGeometry.attributes.position.array as Float32Array;
    const baseSpeed = 1.2 + audio.bass * 2.0;

    for (let i = 0; i < this.count; i++) {
      // Faster rotation closer to the event horizon (Keplerian orbit)
      const angularVel = (baseSpeed / Math.sqrt(this.radii[i])) * delta;
      this.angles[i] += angularVel;

      const r = this.radii[i] * (1.0 + (audio.beat ? 0.08 : 0));
      pos[i * 3] = Math.cos(this.angles[i]) * r;
      pos[i * 3 + 2] = Math.sin(this.angles[i]) * r;
    }

    this.diskGeometry.attributes.position.needsUpdate = true;
    this.group.rotation.y += delta * 0.1;

    // Singularity gravitational pulse
    const coreScale = 1.0 + audio.bass * 0.35 + audio.beatEnergy * 0.2;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);
  }

  onThemeChange(theme: VisualizerTheme) {
    this.diskMaterial.color.set(theme.accent);
  }

  dispose() {
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
    this.diskGeometry.dispose();
    this.diskMaterial.dispose();
    this.group.removeFromParent();
  }
}

