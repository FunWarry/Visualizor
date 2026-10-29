import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class FireballNeuronsPreset implements VisualizerPreset {
  id = 'fireball-neurons';
  name = 'Fireball & Neurons';
  category = 'Fluids & Heat' as const;
  description = 'High-energy turbulent plasma core with synaptic neural dendrite axon pulses.';

  private group!: THREE.Group;
  private coreMesh!: THREE.Mesh;
  private neuronLines!: THREE.LineSegments;
  private coreMaterial!: THREE.MeshStandardMaterial;
  private lineMaterial!: THREE.LineBasicMaterial;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Turbulent glowing core sphere
    const coreGeom = new THREE.SphereGeometry(1.6, 32, 32);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    // 2. Synaptic neuron network: 24 branching dendritic axons
    const axonCount = 36;
    const segmentsPerAxon = 8;
    const linePositions = new Float32Array(axonCount * (segmentsPerAxon - 1) * 2 * 3);

    let ptr = 0;
    for (let a = 0; a < axonCount; a++) {
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();

      let currentPos = dir.clone().multiplyScalar(1.6);

      for (let s = 0; s < segmentsPerAxon - 1; s++) {
        // Line start
        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;

        // Next position with organic curl
        const step = dir.clone().multiplyScalar(0.7).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ));
        currentPos.add(step);

        // Line end
        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.75
    });
    this.neuronLines = new THREE.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.neuronLines);

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    this.group.rotation.y += delta * 0.25;
    this.group.rotation.z += delta * 0.15;

    // Core expansion with bass & beats
    const scale = 1.0 + audio.bass * 0.5 + (audio.beat ? 0.3 : 0);
    this.coreMesh.scale.set(scale, scale, scale);

    // Dynamic emissive boost
    if (audio.beat) {
      this.coreMaterial.emissiveIntensity = 1.8;
      this.lineMaterial.opacity = 1.0;
    } else {
      this.coreMaterial.emissiveIntensity *= 0.94;
      this.lineMaterial.opacity = 0.5 + audio.treble * 0.5;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.coreMaterial.color.set(theme.primary);
    this.coreMaterial.emissive.set(theme.accent);
    this.lineMaterial.color.set(theme.accent);
  }

  dispose() {
    this.coreMesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.neuronLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.group.removeFromParent();
  }
}
