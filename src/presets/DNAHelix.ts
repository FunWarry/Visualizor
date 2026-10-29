import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class DNAHelixPreset implements VisualizerPreset {
  id = 'dna-helix';
  name = 'DNA Helix';
  category = 'Structures' as const;
  description = 'Double helix molecular strands rotating and pulsing with harmonic frequencies.';

  private group!: THREE.Group;
  private sphereMesh!: THREE.InstancedMesh;
  private rungsMesh!: THREE.InstancedMesh;
  private numPairs = 64;
  private dummy = new THREE.Object3D();
  private sphereColors!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // Spheres on the dual backbone strands (2 spheres per pair = 128 spheres)
    const sphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8
    });
    this.sphereMesh = new THREE.InstancedMesh(sphereGeom, sphereMat, this.numPairs * 2);
    this.sphereColors = new Float32Array(this.numPairs * 2 * 3);

    // Connecting rungs (cylinders) between the two strands
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
    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.y += delta * (0.3 + audio.mid * 0.8);
    this.group.rotation.x = Math.sin(time * 0.5) * 0.25;

    const heightStep = 0.22;
    const totalHeight = this.numPairs * heightStep;
    const baseY = -totalHeight / 2;
    const radius = 2.0 + audio.bass * 0.8;
    const twistSpeed = 0.18;

    for (let i = 0; i < this.numPairs; i++) {
      const angle = i * twistSpeed + time * 1.2;
      const y = baseY + i * heightStep;

      // Position strand A & B
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      // Sphere A
      this.dummy.position.set(x1, y, z1);
      this.dummy.scale.setScalar(1.0 + (audio.beat ? 0.3 : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2, this.dummy.matrix);

      // Sphere B
      this.dummy.position.set(x2, y, z2);
      this.dummy.scale.setScalar(1.0 + (audio.beat ? 0.3 : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2 + 1, this.dummy.matrix);

      // Connecting Rung
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const rungLen = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));

      this.dummy.position.set(midX, y, midZ);
      this.dummy.rotation.set(0, -angle, 0);
      this.dummy.scale.set(rungLen, 1, 1);
      this.dummy.updateMatrix();
      this.rungsMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.sphereMesh.instanceMatrix.needsUpdate = true;
    this.rungsMesh.instanceMatrix.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
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

  dispose() {
    this.sphereMesh.geometry.dispose();
    (this.sphereMesh.material as THREE.Material).dispose();
    this.rungsMesh.geometry.dispose();
    (this.rungsMesh.material as THREE.Material).dispose();
    this.group.removeFromParent();
  }
}
