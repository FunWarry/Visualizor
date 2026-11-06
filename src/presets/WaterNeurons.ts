import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class WaterNeuronsPreset extends BasePreset {
  public override readonly id = 'waterneurons';
  public override readonly name = 'Water Neurons';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Synaptic neural dendrite axon network with action pulses.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private coreMesh!: THREE.Mesh;
  private neuronLines!: THREE.LineSegments;
  private coreMaterial!: THREE.MeshStandardMaterial;
  private lineMaterial!: THREE.LineBasicMaterial;
  private synNodePoints!: THREE.Points;
  private synNodeMaterial!: THREE.PointsMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Pulse Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Synaptic Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Axon Spread', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Central soma nucleus
    const coreGeom = new THREE.SphereGeometry(1.2, 32, 32);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    // 2. Synaptic neuron network: 36 branching dendritic axons
    const axonCount = 36;
    const segmentsPerAxon = 10;
    const linePositions = new Float32Array(axonCount * (segmentsPerAxon - 1) * 2 * 3);
    const terminalPoints: number[] = [];

    let ptr = 0;
    for (let a = 0; a < axonCount; a++) {
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();

      const currentPos = dir.clone().multiplyScalar(1.2);

      for (let s = 0; s < segmentsPerAxon - 1; s++) {
        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;

        const step = dir.clone().multiplyScalar(0.6).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35
        ));
        currentPos.add(step);

        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;
      }

      terminalPoints.push(currentPos.x, currentPos.y, currentPos.z);
    }

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.neuronLines = new THREE.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.neuronLines);

    // 3. Synaptic terminal bouton nodes
    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(terminalPoints, 3));
    this.synNodeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.primary),
      size: 0.25,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.synNodePoints = new THREE.Points(nodeGeom, this.synNodeMaterial);
    this.group.add(this.synNodePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.2 * speed;

    const scale = 1.0 + (audio.bass * 0.45 + (audio.beat ? 0.35 : 0)) * reactivity;
    this.coreMesh.scale.set(scale, scale, scale);

    if (audio.beat) {
      this.coreMaterial.emissiveIntensity = 1.8 * reactivity;
      this.lineMaterial.opacity = 1.0;
      this.synNodeMaterial.size = 0.45 * reactivity;
    } else {
      this.coreMaterial.emissiveIntensity = Math.max(0.4, this.coreMaterial.emissiveIntensity * 0.94);
      this.lineMaterial.opacity = 0.5 + audio.treble * 0.5 * reactivity;
      this.synNodeMaterial.size = 0.22;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.color.set(theme.primary);
    this.coreMaterial.emissive.set(theme.accent);
    this.lineMaterial.color.set(theme.accent);
    this.synNodeMaterial.color.set(theme.primary);
  }

  protected override onDispose(): void {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial?.dispose();
    }
    if (this.neuronLines) {
      this.neuronLines.geometry.dispose();
      this.lineMaterial?.dispose();
    }
    if (this.synNodePoints) {
      this.synNodePoints.geometry.dispose();
      this.synNodeMaterial?.dispose();
    }
  }
}
