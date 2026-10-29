import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class OceanWavesPreset implements VisualizerPreset {
  id = 'ocean-waves';
  name = 'Ocean Waves & Rain';
  category = 'Organic & Nature' as const;
  description = 'Dynamic Gerstner ocean wave swells with vertical rain streak precipitation.';

  private group!: THREE.Group;
  private oceanMesh!: THREE.Mesh;
  private rainStreaks!: THREE.LineSegments;
  private oceanMaterial!: THREE.ShaderMaterial;
  private rainMaterial!: THREE.LineBasicMaterial;
  private rainCount = 1000;
  private rainPositions!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Ocean Surface with Gerstner wave displacement
    const oceanGeom = new THREE.PlaneGeometry(24, 24, 64, 64);
    oceanGeom.rotateX(-Math.PI / 2.3);

    this.oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          // Gerstner wave combination
          float w1 = sin(p.x * 0.4 + uTime * 2.0) * (0.5 + uBass * 1.2);
          float w2 = cos(p.y * 0.5 + uTime * 2.3) * (0.3 + uBass * 0.8);
          p.z += w1 + w2;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float crest = smoothstep(0.4, 0.9, vPos.z * 0.5 + 0.5);
          vec3 col = mix(uColor1 * 0.6, uColor2, vUv.y);
          col = mix(col, uAccent, crest * 0.8);
          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.oceanMesh = new THREE.Mesh(oceanGeom, this.oceanMaterial);
    this.group.add(this.oceanMesh);

    // 2. Rain streaks (1000 lines)
    const lineGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 2 * 3);

    let ptr = 0;
    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * 20;
      const ry = Math.random() * 12 - 4;
      const rz = (Math.random() - 0.5) * 16;
      const len = 0.4 + Math.random() * 0.4;

      // Start
      this.rainPositions[ptr++] = rx;
      this.rainPositions[ptr++] = ry;
      this.rainPositions[ptr++] = rz;

      // End
      this.rainPositions[ptr++] = rx;
      this.rainPositions[ptr++] = ry - len;
      this.rainPositions[ptr++] = rz;
    }
    lineGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.5
    });

    this.rainStreaks = new THREE.LineSegments(lineGeom, this.rainMaterial);
    this.group.add(this.rainStreaks);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.oceanMaterial.uniforms.uTime.value = time;
    this.oceanMaterial.uniforms.uBass.value = audio.bass;
    this.oceanMaterial.uniforms.uMid.value = audio.mid;

    // Rain fall speed modulated by mid/treble
    const fallSpeed = (8.0 + audio.mid * 10.0) * delta;
    const pos = (this.rainStreaks.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;

    for (let i = 0; i < this.rainCount; i++) {
      const idx1 = i * 6 + 1;
      const idx2 = i * 6 + 4;
      pos[idx1] -= fallSpeed;
      pos[idx2] -= fallSpeed;

      if (pos[idx1] < -4) {
        const offset = Math.random() * 2;
        pos[idx1] = 8 + offset;
        pos[idx2] = 7.4 + offset;
      }
    }
    this.rainStreaks.geometry.attributes.position.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.oceanMaterial.uniforms.uColor1.value.set(theme.primary);
    this.oceanMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.oceanMaterial.uniforms.uAccent.value.set(theme.accent);
    this.rainMaterial.color.set(theme.accent);
  }

  dispose() {
    this.oceanMesh.geometry.dispose();
    this.oceanMaterial.dispose();
    this.rainStreaks.geometry.dispose();
    this.rainMaterial.dispose();
    this.group.removeFromParent();
  }
}
