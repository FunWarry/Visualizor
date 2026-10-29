import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class AuroraMandalaPreset implements VisualizerPreset {
  id = 'aurora-mandala';
  name = 'Aurora Mandala';
  category = 'Abstract & Space' as const;
  description = 'Ethereal undulating aurora borealis curtains intersecting sacred geometry mandalas.';

  private group!: THREE.Group;
  private auroraMesh!: THREE.Mesh;
  private mandalaRings: THREE.LineLoop[] = [];
  private auroraMaterial!: THREE.ShaderMaterial;
  private ringMaterial!: THREE.LineBasicMaterial;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Aurora curtains mesh
    const auroraGeom = new THREE.PlaneGeometry(24, 12, 60, 30);
    this.auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uMid: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uTreble;
        uniform float uMid;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Curtains waving in wind
          p.z += sin(p.x * 0.4 + uTime * 2.0) * 1.5 * (1.0 + uMid);
          p.z += cos(p.y * 0.8 + uTime * 2.5) * 0.8 * (1.0 + uTreble);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float curtainGradient = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          vec3 col = mix(uColor1, uColor2, sin(vPos.x * 0.3 + vUv.y * 3.0) * 0.5 + 0.5);
          gl_FragColor = vec4(col, curtainGradient * 0.7);
        }
      `
    });

    this.auroraMesh = new THREE.Mesh(auroraGeom, this.auroraMaterial);
    this.auroraMesh.position.z = -3;
    this.group.add(this.auroraMesh);

    // 2. Sacred Mandala concentric geometric rings
    this.ringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.65
    });

    const ringCounts = [12, 16, 24, 32];
    ringCounts.forEach((segments, idx) => {
      const radius = 1.2 + idx * 0.8;
      const geom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];

      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        // Flower of life modulation
        const modR = radius + Math.sin(theta * 6.0) * 0.15;
        points.push(new THREE.Vector3(Math.cos(theta) * modR, Math.sin(theta) * modR, 0));
      }

      geom.setFromPoints(points);
      const ring = new THREE.LineLoop(geom, this.ringMaterial);
      this.mandalaRings.push(ring);
      this.group.add(ring);
    });

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.auroraMaterial.uniforms.uTime.value = time;
    this.auroraMaterial.uniforms.uTreble.value = audio.treble;
    this.auroraMaterial.uniforms.uMid.value = audio.mid;

    // Rotate mandala rings alternately
    this.mandalaRings.forEach((ring, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z += delta * (0.3 + audio.bass * 0.8) * dir;
      const scale = 1.0 + (audio.beat ? 0.15 : 0) * (idx + 1) * 0.25;
      ring.scale.set(scale, scale, 1);
    });
  }

  onThemeChange(theme: VisualizerTheme) {
    this.auroraMaterial.uniforms.uColor1.value.set(theme.primary);
    this.auroraMaterial.uniforms.uColor2.value.set(theme.accent);
    this.ringMaterial.color.set(theme.accent);
  }

  dispose() {
    this.auroraMesh.geometry.dispose();
    this.auroraMaterial.dispose();
    this.ringMaterial.dispose();
    this.mandalaRings.forEach(r => r.geometry.dispose());
    this.group.removeFromParent();
  }
}
