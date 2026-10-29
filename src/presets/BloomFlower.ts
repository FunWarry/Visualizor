import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class BloomFlowerPreset implements VisualizerPreset {
  id = 'bloom-flower';
  name = 'Bloom Flower & Ink';
  category = 'Organic & Nature' as const;
  description = 'Phyllotaxis blooming lotus petals unfolding with floating ink diffusion swirls.';

  private group!: THREE.Group;
  private petals: THREE.Mesh[] = [];
  private inkParticles!: THREE.Points;
  private petalMaterial!: THREE.MeshStandardMaterial;
  private inkMaterial!: THREE.PointsMaterial;
  private petalBaseRotations: number[] = [];
  private inkPositions!: Float32Array;
  private inkCount = 600;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    this.group.rotation.x = Math.PI / 3.0; // tilted upward view

    // 1. Parametric Petals via Fibonacci Phyllotaxis
    const petalCount = 34;
    const goldenAngle = 137.5 * (Math.PI / 180);
    const petalGeom = new THREE.ConeGeometry(0.5, 2.2, 5);
    petalGeom.rotateX(Math.PI / 2);

    this.petalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.1
    });

    for (let i = 0; i < petalCount; i++) {
      const radius = 0.4 + Math.sqrt(i) * 0.45;
      const theta = i * goldenAngle;

      const petal = new THREE.Mesh(petalGeom, this.petalMaterial);
      petal.position.set(Math.cos(theta) * radius, Math.sin(theta) * radius, (i / petalCount) * 0.5);

      const openAngle = 0.4 + (i / petalCount) * 0.8;
      petal.rotation.z = theta;
      petal.rotation.x = openAngle;
      this.petalBaseRotations.push(openAngle);

      this.petals.push(petal);
      this.group.add(petal);
    }

    // 2. Ink diffusion particles
    const inkGeom = new THREE.BufferGeometry();
    this.inkPositions = new Float32Array(this.inkCount * 3);
    for (let i = 0; i < this.inkCount; i++) {
      this.inkPositions[i * 3] = (Math.random() - 0.5) * 6;
      this.inkPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      this.inkPositions[i * 3 + 2] = Math.random() * 4;
    }
    inkGeom.setAttribute('position', new THREE.BufferAttribute(this.inkPositions, 3));

    this.inkMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.14,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.inkParticles = new THREE.Points(inkGeom, this.inkMaterial);
    this.group.add(this.inkParticles);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.z += delta * 0.15;

    // Unfold petals on bass & beat
    const openMod = audio.bass * 0.5 + audio.beatEnergy * 0.4;
    this.petals.forEach((petal, idx) => {
      petal.rotation.x = this.petalBaseRotations[idx] + openMod;
    });

    // Swirl ink particles
    const pos = (this.inkParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < this.inkCount; i++) {
      const idx = i * 3;
      pos[idx + 2] += delta * (0.5 + audio.mid);
      pos[idx] += Math.sin(time + i) * delta * 0.3;
      pos[idx + 1] += Math.cos(time + i) * delta * 0.3;

      if (pos[idx + 2] > 6) {
        pos[idx + 2] = 0;
      }
    }
    this.inkParticles.geometry.attributes.position.needsUpdate = true;

    if (audio.beat) {
      this.petalMaterial.emissiveIntensity = 1.0;
    } else {
      this.petalMaterial.emissiveIntensity *= 0.93;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.petalMaterial.color.set(theme.primary);
    this.petalMaterial.emissive.set(theme.accent);
    this.inkMaterial.color.set(theme.accent);
  }

  dispose() {
    this.petals[0].geometry.dispose();
    this.petalMaterial.dispose();
    this.inkParticles.geometry.dispose();
    this.inkMaterial.dispose();
    this.group.removeFromParent();
  }
}
