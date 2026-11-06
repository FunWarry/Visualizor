import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class Tesseract4DPreset extends BasePreset {
  public override readonly id = 'tesseract';
  public override readonly name = 'Tesseract';
  public override readonly category = 'Structures' as const;
  public override readonly description = '4D hypercube projected stereographically into 3D space.';
  public override cameraConfig = {
    position: [0, 0, 9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };

  private edgeLines!: THREE.LineSegments;
  private vertexNodes!: THREE.Points;
  private lineMaterial!: THREE.LineBasicMaterial;
  private nodeMaterial!: THREE.PointsMaterial;

  private readonly vertices4D: number[][] = [];
  private readonly edges: [number, number][] = [];
  private rotXW = 0;
  private rotYW = 0;
  private rotZW = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: '4D Rotation Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Perspective Scale', min: 1.0, max: 3.5, step: 0.1, defaultValue: 1.8 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.vertices4D.length = 0;
    for (let i = 0; i < 16; i++) {
      const x = (i & 1) ? 1 : -1;
      const y = (i & 2) ? 1 : -1;
      const z = (i & 4) ? 1 : -1;
      const w = (i & 8) ? 1 : -1;
      this.vertices4D.push([x, y, z, w]);
    }

    this.edges.length = 0;
    for (let i = 0; i < 16; i++) {
      for (let bit = 0; bit < 4; bit++) {
        const neighbor = i ^ (1 << bit);
        if (neighbor > i) {
          this.edges.push([i, neighbor]);
        }
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    const linePositions = new Float32Array(this.edges.length * 2 * 3);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.edgeLines = new THREE.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.edgeLines);

    const nodeGeom = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(16 * 3);
    nodeGeom.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    this.nodeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.25,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.vertexNodes = new THREE.Points(nodeGeom, this.nodeMaterial);
    this.group.add(this.vertexNodes);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const projScale = this.paramStore.getValue('density');

    this.rotXW += delta * (0.4 + audio.bass * 1.5 * reactivity) * speed;
    this.rotYW += delta * (0.3 + audio.mid * 1.2 * reactivity) * speed;
    this.rotZW += delta * (0.2 + audio.treble * 1.0 * reactivity) * speed;

    this.group.rotation.y += delta * 0.15 * speed;
    this.group.rotation.x += delta * 0.1 * speed;

    const projected: THREE.Vector3[] = [];
    const distance4D = 2.4;

    const nodePos = (this.vertexNodes.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;

    for (let i = 0; i < 16; i++) {
      const [x, y, z, w] = this.vertices4D[i];

      const cosXW = Math.cos(this.rotXW);
      const sinXW = Math.sin(this.rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;

      const cosYW = Math.cos(this.rotYW);
      const sinYW = Math.sin(this.rotYW);
      const y2 = y * cosYW - w1 * sinYW;
      const w2 = y * sinYW + w1 * cosYW;

      const cosZW = Math.cos(this.rotZW);
      const sinZW = Math.sin(this.rotZW);
      const z3 = z * cosZW - w2 * sinZW;
      const w3 = z * sinZW + w2 * cosZW;

      const scale = distance4D / Math.max(0.1, distance4D - w3);
      const v3 = new THREE.Vector3(x1 * scale * projScale, y2 * scale * projScale, z3 * scale * projScale);
      projected.push(v3);

      nodePos[i * 3] = v3.x;
      nodePos[i * 3 + 1] = v3.y;
      nodePos[i * 3 + 2] = v3.z;
    }
    this.vertexNodes.geometry.attributes.position.needsUpdate = true;

    const linePos = (this.edgeLines.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    let ptr = 0;
    for (const [p1Idx, p2Idx] of this.edges) {
      const p1 = projected[p1Idx];
      const p2 = projected[p2Idx];

      linePos[ptr++] = p1.x;
      linePos[ptr++] = p1.y;
      linePos[ptr++] = p1.z;

      linePos[ptr++] = p2.x;
      linePos[ptr++] = p2.y;
      linePos[ptr++] = p2.z;
    }
    this.edgeLines.geometry.attributes.position.needsUpdate = true;

    if (audio.beat) {
      this.nodeMaterial.size = 0.45;
      this.lineMaterial.color.set(ctx.theme.accent);
    } else {
      this.nodeMaterial.size = 0.25;
      this.lineMaterial.color.set(ctx.theme.primary);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.lineMaterial.color.set(theme.primary);
    this.nodeMaterial.color.set(theme.accent);
  }
}
