import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class VinylPlayerPreset implements VisualizerPreset {
  id = 'vinyl-player';
  name = 'Vinyl Turntable & Orrery';
  category = 'Structures' as const;
  description = '3D spinning vinyl record turntable with tonearm and celestial orrery rings.';

  private group!: THREE.Group;
  private vinylDisc!: THREE.Mesh;
  private toneArm!: THREE.Group;
  private readonly orreryRings: THREE.LineLoop[] = [];
  private vinylMaterial!: THREE.MeshPhysicalMaterial;
  private ringMaterial!: THREE.LineBasicMaterial;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    this.group.rotation.x = -Math.PI / 4.0; // tilted perspective

    // 1. Vinyl disc geometry
    const discGeom = new THREE.CylinderGeometry(3.6, 3.6, 0.08, 64);
    this.vinylMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      roughness: 0.35,
      metalness: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });
    this.vinylDisc = new THREE.Mesh(discGeom, this.vinylMaterial);
    this.group.add(this.vinylDisc);

    // 2. Record center label
    const labelGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.09, 32);
    const labelMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.accent)
    });
    const labelMesh = new THREE.Mesh(labelGeom, labelMat);
    this.vinylDisc.add(labelMesh);

    // 3. Tonearm
    this.toneArm = new THREE.Group();
    this.toneArm.position.set(4.2, 0.4, 3.0);
    const armGeom = new THREE.CylinderGeometry(0.04, 0.04, 4.0, 12);
    armGeom.rotateZ(Math.PI / 2.2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
    const armMesh = new THREE.Mesh(armGeom, armMat);
    this.toneArm.add(armMesh);
    this.group.add(this.toneArm);

    // 4. Celestial Orrery Rings
    this.ringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.5
    });

    for (let i = 0; i < 4; i++) {
      const radius = 4.4 + i * 0.9;
      const ringGeom = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segs = 64;
      for (let s = 0; s <= segs; s++) {
        const th = (s / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(th) * radius, 0, Math.sin(th) * radius));
      }
      ringGeom.setFromPoints(pts);
      const ring = new THREE.LineLoop(ringGeom, this.ringMaterial);
      this.orreryRings.push(ring);
      this.group.add(ring);
    }

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    // 33 1/3 RPM spin speed + audio mid acceleration
    const rpm = 3.5 + audio.mid * 4.0;
    this.vinylDisc.rotation.y += delta * rpm;

    // Tonearm tracking micro-vibration
    this.toneArm.rotation.y = -0.3 + Math.sin(this.vinylDisc.rotation.y * 0.5) * 0.02 + audio.bass * 0.05;

    // Orbit orrery rings
    this.orreryRings.forEach((ring, idx) => {
      ring.rotation.y += delta * (0.2 + idx * 0.1) * (idx % 2 === 0 ? 1 : -1);
      if (audio.beat) {
        ring.scale.setScalar(1.05 + idx * 0.03);
      } else {
        ring.scale.setScalar(1.0);
      }
    });

    if (audio.beat) {
      this.ringMaterial.color.set(ctx.theme.accent);
    } else {
      this.ringMaterial.color.set(ctx.theme.primary);
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.ringMaterial.color.set(theme.primary);
  }

  dispose() {
    this.vinylDisc.geometry.dispose();
    this.vinylMaterial.dispose();
    this.ringMaterial.dispose();
    this.orreryRings.forEach(r => r.geometry.dispose());
    this.group.removeFromParent();
  }
}

