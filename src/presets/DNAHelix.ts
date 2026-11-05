import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class DNAHelixPreset extends BasePreset {
  public override readonly id = 'dna';
  public override readonly name = 'DNA Helix';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Intertwined double helix strands rotating and vibrating.';

  private sphereMesh!: THREE.InstancedMesh;
  private rungsMesh!: THREE.InstancedMesh;
  private readonly numPairs = 64;
  private readonly dummy = new THREE.Object3D();
  private sphereColors!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Twist Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Strand Radius', min: 1.0, max: 4.0, step: 0.1, defaultValue: 2.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const sphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8
    });
    this.sphereMesh = new THREE.InstancedMesh(sphereGeom, sphereMat, this.numPairs * 2);
    this.sphereColors = new Float32Array(this.numPairs * 2 * 3);

    const rungGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    rungGeom.rotateZ(Math.PI / 2);
    const rungMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.secondary),
      roughness: 0.4,
      metalness: 0.6
    });
    this.rungsMesh = new THREE.InstancedMesh(rungGeom, rungMat, this.numPairs);

    const col1 = new THREE.Color(ctx.theme.primary);
    const col2 = new THREE.Color(ctx.theme.accent);

    for (let i = 0; i < this.numPairs; i++) {
      col1.toArray(this.sphereColors, (i * 2) * 3);
      col2.toArray(this.sphereColors, (i * 2 + 1) * 3);
    }
    this.sphereMesh.instanceColor = new THREE.InstancedBufferAttribute(this.sphereColors, 3);

    this.group.add(this.sphereMesh);
    this.group.add(this.rungsMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const baseRadius = this.paramStore.getValue('density');

    this.group.rotation.y += delta * (0.3 + audio.mid * 0.8 * reactivity) * speed;
    this.group.rotation.x = Math.sin(time * 0.5 * speed) * 0.25;

    const heightStep = 0.22;
    const totalHeight = this.numPairs * heightStep;
    const baseY = -totalHeight / 2;
    const radius = baseRadius + audio.bass * 0.8 * reactivity;
    const twistSpeed = 0.18;

    for (let i = 0; i < this.numPairs; i++) {
      const angle = i * twistSpeed + time * 1.2 * speed;
      const y = baseY + i * heightStep;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      this.dummy.position.set(x1, y, z1);
      this.dummy.scale.setScalar(1.0 + (audio.beat ? 0.3 * reactivity : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2, this.dummy.matrix);

      this.dummy.position.set(x2, y, z2);
      this.dummy.scale.setScalar(1.0 + (audio.beat ? 0.3 * reactivity : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2 + 1, this.dummy.matrix);

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const rungLen = Math.hypot(x2 - x1, z2 - z1);

      this.dummy.position.set(midX, y, midZ);
      this.dummy.rotation.set(0, -angle, 0);
      this.dummy.scale.set(rungLen, 1, 1);
      this.dummy.updateMatrix();
      this.rungsMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.sphereMesh.instanceMatrix.needsUpdate = true;
    this.rungsMesh.instanceMatrix.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const col1 = new THREE.Color(theme.primary);
    const col2 = new THREE.Color(theme.accent);

    for (let i = 0; i < this.numPairs; i++) {
      col1.toArray(this.sphereColors, (i * 2) * 3);
      col2.toArray(this.sphereColors, (i * 2 + 1) * 3);
    }
    if (this.sphereMesh.instanceColor) {
      this.sphereMesh.instanceColor.needsUpdate = true;
    }
  }
}
