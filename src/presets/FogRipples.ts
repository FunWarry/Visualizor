import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class FogRipplesPreset implements VisualizerPreset {
  id = 'fog-ripples';
  name = 'Fog & Rain Ripples';
  category = 'Fluids & Heat' as const;
  description = 'Volumetric smoke fog wisps drifting over audio-reactive concentric water ripples.';

  private group!: THREE.Group;
  private waterPlane!: THREE.Mesh;
  private smokePoints!: THREE.Points;
  private waterMaterial!: THREE.ShaderMaterial;
  private smokeMaterial!: THREE.PointsMaterial;
  private smokePositions!: Float32Array;
  private readonly smokeCount = 800;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Water ripple surface
    const waterGeom = new THREE.PlaneGeometry(20, 20, 80, 80);
    waterGeom.rotateX(-Math.PI / 2.3);

    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uKickImpact: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uKickImpact;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          // Concentric circular ripples from center
          float dist = length(p.xy);
          float ripple = sin(dist * 6.0 - uTime * 4.0) * exp(-dist * 0.25) * (0.2 + uKickImpact * 0.8);
          p.z += ripple;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float dist = length(vPos.xy);
          float fresnel = pow(1.0 - abs(dot(normalize(vPos), vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 col = mix(uColor1 * 0.4, uAccent, fresnel * 0.8);
          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.waterPlane = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.group.add(this.waterPlane);

    // 2. Smoke wisps drifting above water
    const smokeGeom = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(this.smokeCount * 3);

    for (let i = 0; i < this.smokeCount; i++) {
      this.smokePositions[i * 3] = (Math.random() - 0.5) * 16;
      this.smokePositions[i * 3 + 1] = Math.random() * 4 - 1;
      this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    this.smokeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.35,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    this.smokePoints = new THREE.Points(smokeGeom, this.smokeMaterial);
    this.group.add(this.smokePoints);

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.waterMaterial.uniforms.uTime.value = time;
    this.waterMaterial.uniforms.uBass.value = audio.bass;

    // Trigger ripple on kick beat
    if (audio.beat) {
      this.waterMaterial.uniforms.uKickImpact.value = 1.0;
    } else {
      this.waterMaterial.uniforms.uKickImpact.value *= 0.92;
    }

    // Smoke particle drift
    const pos = (this.smokePoints.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < this.smokeCount; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(time + i) * delta * (0.3 + audio.mid);
      pos[idx + 1] += delta * 0.2; // rise
      if (pos[idx + 1] > 5) {
        pos[idx + 1] = -1;
      }
    }
    this.smokePoints.geometry.attributes.position.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.waterMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterMaterial.uniforms.uAccent.value.set(theme.accent);
    this.smokeMaterial.color.set(theme.accent);
  }

  dispose() {
    this.waterPlane.geometry.dispose();
    this.waterMaterial.dispose();
    this.smokePoints.geometry.dispose();
    this.smokeMaterial.dispose();
    this.group.removeFromParent();
  }
}
