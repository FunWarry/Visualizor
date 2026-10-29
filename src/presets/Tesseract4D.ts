import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class Tesseract4DPreset implements VisualizerPreset {
  id = 'tesseract-4d';
  name = 'Tesseract 4D';
  category = 'Structures' as const;
  description = 'True 4D hypercube projected stereographically into 3D with holographic glitch.';

  private group!: THREE.Group;
  private edgeLines!: THREE.LineSegments;
  private vertexNodes!: THREE.Points;
  private lineMaterial!: THREE.LineBasicMaterial;
  private nodeMaterial!: THREE.PointsMaterial;

  // 16 4D vertices (+-1, +-1, +-1, +-1)
  private vertices4D: number[][] = [];
  // 32 edges
  private edges: [number, number][] = [];
  // Rotations
  private rotXW = 0;
  private rotYW = 0;
  private rotZW = 0;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // Generate 16 4D vertices
    this.vertices4D = [];
    for (let i = 0; i < 16; i++) {
      const x = (i & 1) ? 1 : -1;
      const y = (i & 2) ? 1 : -1;
      const z = (i & 4) ? 1 : -1;
      const w = (i & 8) ? 1 : -1;
      this.vertices4D.push([x, y, z, w]);
    }

    // Generate 32 edges (differ by 1 bit)
    this.edges = [];
    for (let i = 0; i < 16; i++) {
      for (let bit = 0; bit < 4; bit++) {
        const neighbor = i ^ (1 << bit);
        if (neighbor > i) {
          this.edges.push([i, neighbor]);
        }
      }
    }

    // Edge lines geometry (32 edges * 2 points * 3 coords = 192 floats)
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = new Float32Array(this.edges.length * 2 * 3);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.edgeLines = new THREE.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.edgeLines);

    // Vertex glowing nodes
    const nodeGeom = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(16 * 3);
    nodeGeom.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    this.nodeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.25,
      transparent: true,
      opacity: 0.95
    });
    this.vertexNodes = new THREE.Points(nodeGeom, this.nodeMaterial);
    this.group.add(this.vertexNodes);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    // 4D Rotation speeds modulated by audio
    this.rotXW += delta * (0.4 + audio.bass * 1.5);
    this.rotYW += delta * (0.3 + audio.mid * 1.2);
    this.rotZW += delta * (0.2 + audio.treble * 1.0);

    this.group.rotation.y += delta * 0.15;
    this.group.rotation.x += delta * 0.1;

    const projected: THREE.Vector3[] = [];
    const distance4D = 2.4;
    const glitch = audio.beat ? (Math.random() - 0.5) * 0.3 : 0;

    // Project 16 vertices from 4D -> 3D
    const nodePos = (this.vertexNodes.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;

    for (let i = 0; i < 16; i++) {
      let [x, y, z, w] = this.vertices4D[i];

      // Rotate in XW plane
      const cosXW = Math.cos(this.rotXW);
      const sinXW = Math.sin(this.rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;

      // Rotate in YW plane
      const cosYW = Math.cos(this.rotYW);
      const sinYW = Math.sin(this.rotYW);
      const y2 = y * cosYW - w1 * sinYW;
      const w2 = y * sinYW + w1 * cosYW;

      // Rotate in ZW plane
      const cosZW = Math.cos(this.rotZW);
      const sinZW = Math.sin(this.rotZW);
      const z3 = z * cosZW - w2 * sinZW;
      const w3 = z * sinZW + w2 * cosZW;

      // Stereographic 4D perspective projection
      const scale = distance4D / (distance4D - w3);
      const v3 = new THREE.Vector3(
        (x1 * scale + glitch) * 1.8,
        (y2 * scale + glitch) * 1.8,
        (z3 * scale) * 1.8
      );
      projected.push(v3);

      nodePos[i * 3] = v3.x;
      nodePos[i * 3 + 1] = v3.y;
      nodePos[i * 3 + 2] = v3.z;
    }
    this.vertexNodes.geometry.attributes.position.needsUpdate = true;

    // Update 32 edge segments
    const linePos = (this.edgeLines.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    let ptr = 0;
    for (let e = 0; e < this.edges.length; e++) {
      const [p1Idx, p2Idx] = this.edges[e];
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

  onThemeChange(theme: VisualizerTheme) {
    this.lineMaterial.color.set(theme.primary);
    this.nodeMaterial.color.set(theme.accent);
  }

  dispose() {
    this.edgeLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.vertexNodes.geometry.dispose();
    this.nodeMaterial.dispose();
    this.group.removeFromParent();
  }
}
