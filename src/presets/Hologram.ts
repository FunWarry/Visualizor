import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class HologramPreset extends BasePreset {
  public override readonly id = 'hologram';
  public override readonly name = 'Hologram';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Sci-fi projection glitch plane with scanlines and chromatic fringe.';
  public override cameraConfig = {
    position: [0, 2, 8] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };

  private planeMesh!: THREE.Mesh;
  private emitterCone!: THREE.Mesh;
  private hologramMaterial!: THREE.ShaderMaterial;
  private emitterMaterial!: THREE.MeshStandardMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Scanline Speed', min: 0.1, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Glitch Intensity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Holo Opacity', min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.8 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // Hologram projection plane with custom scanline shader
    const planeGeom = new THREE.PlaneGeometry(8, 8, 32, 32);
    this.hologramMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScanSpeed: { value: 1.0 },
        uGlitch: { value: 0.0 },
        uOpacity: { value: 0.8 },
        uColor: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uGlitch;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Chromatic/jitter glitch displacement on claps
          if (uGlitch > 0.05) {
            float jitter = sin(p.y * 20.0 + uTime * 30.0) * uGlitch * 0.4;
            p.x += jitter;
          }
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uScanSpeed;
        uniform float uGlitch;
        uniform float uOpacity;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // Scanlines
          float scanline = sin((vUv.y * 60.0 - uTime * uScanSpeed * 8.0)) * 0.5 + 0.5;
          float grid = (step(0.95, fract(vUv.x * 16.0)) + step(0.95, fract(vUv.y * 16.0))) * 0.3;

          vec3 col = mix(uColor, uAccent, scanline * 0.4 + grid);
          float alpha = (scanline * 0.6 + 0.2 + grid) * uOpacity;

          // Edge flicker
          float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) *
                       smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

          gl_FragColor = vec4(col, alpha * edge);
        }
      `
    });

    this.planeMesh = new THREE.Mesh(planeGeom, this.hologramMaterial);
    this.planeMesh.position.set(0, 1.2, 0);
    this.group.add(this.planeMesh);

    // Emitter base projector cone
    const coneGeom = new THREE.ConeGeometry(2.0, 2.5, 32, 1, true);
    coneGeom.rotateX(Math.PI);
    this.emitterMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.08),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.3,
      wireframe: true
    });
    this.emitterCone = new THREE.Mesh(coneGeom, this.emitterMaterial);
    this.emitterCone.position.set(0, -1.8, 0);
    this.group.add(this.emitterCone);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const opacity = this.paramStore.getValue('density');

    this.group.rotation.y += delta * 0.2 * speed;

    this.hologramMaterial.uniforms.uTime.value = time;
    this.hologramMaterial.uniforms.uScanSpeed.value = speed;
    this.hologramMaterial.uniforms.uOpacity.value = opacity;

    const glitch = audio.beat ? 0.35 * reactivity : (audio.treble > 0.6 ? 0.15 * reactivity : 0.0);
    this.hologramMaterial.uniforms.uGlitch.value = glitch;

    if (audio.beat) {
      this.emitterMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.emitterMaterial.emissiveIntensity *= 0.94;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.hologramMaterial.uniforms.uColor.value.set(theme.primary);
    this.hologramMaterial.uniforms.uAccent.value.set(theme.accent);
    this.emitterMaterial.emissive.set(theme.primary);
  }
}
