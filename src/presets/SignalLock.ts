import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class SignalLockPreset extends BasePreset {
  public override readonly id = 'signallock';
  public override readonly name = 'Signal Lock';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Overnight broadcast TV test card with sync loss & Lissajous.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private testCardMesh!: THREE.Mesh;
  private lissajousLine!: THREE.Line;
  private cardMaterial!: THREE.ShaderMaterial;
  private lissajousMaterial!: THREE.LineBasicMaterial;
  private readonly numLissajousPts = 128;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'RF Noise Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Sync Loss Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Lissajous Amplitude', min: 1.0, max: 4.0, step: 0.2, defaultValue: 2.2 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. SMPTE Test Card Screen with RF Glitch
    const cardGeom = new THREE.PlaneGeometry(16, 12);
    this.cardMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSyncLoss: { value: 0 },
        uPrimary: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSyncLoss;
        uniform vec3 uPrimary;
        uniform vec3 uAccent;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          // Sync roll / jitter
          if (uSyncLoss > 0.05) {
            uv.y = fract(uv.y + uTime * uSyncLoss * 3.0);
            uv.x += (hash(vec2(uTime, uv.y)) - 0.5) * uSyncLoss * 0.15;
          }

          // SMPTE 7-bar vertical test pattern
          float bar = floor(uv.x * 7.0);
          vec3 col;
          if (bar == 0.0) col = vec3(0.75, 0.75, 0.75); // Gray
          else if (bar == 1.0) col = vec3(0.75, 0.75, 0.0);  // Yellow
          else if (bar == 2.0) col = vec3(0.0, 0.75, 0.75);  // Cyan
          else if (bar == 3.0) col = vec3(0.0, 0.75, 0.0);   // Green
          else if (bar == 4.0) col = vec3(0.75, 0.0, 0.75);  // Magenta
          else if (bar == 5.0) col = vec3(0.75, 0.0, 0.0);   // Red
          else col = vec3(0.0, 0.0, 0.75);                   // Blue

          // Modulate with theme accent
          col = mix(col, uAccent, 0.2);

          // RF noise grain
          float noise = hash(uv * 100.0 + uTime * 10.0);
          col += (noise - 0.5) * (0.15 + uSyncLoss * 0.4);

          gl_FragColor = vec4(col, 0.85);
        }
      `
    });
    this.testCardMesh = new THREE.Mesh(cardGeom, this.cardMaterial);
    this.testCardMesh.position.z = -1;
    this.group.add(this.testCardMesh);

    // 2. Center Lissajous Oscilloscope Figure
    const lissGeom = new THREE.BufferGeometry();
    const pos = new Float32Array(this.numLissajousPts * 3);
    lissGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    this.lissajousMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.glow),
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lissajousLine = new THREE.Line(lissGeom, this.lissajousMaterial);
    this.lissajousLine.position.z = 0.1;
    this.group.add(this.lissajousLine);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const amp = this.paramStore.getValue('density');

    this.cardMaterial.uniforms.uTime.value = time * speed;
    this.cardMaterial.uniforms.uSyncLoss.value = (audio.beat ? 0.6 : 0.02) * reactivity;

    // Update Lissajous curve
    const pos = (this.lissajousLine.geometry.attributes.position.array as Float32Array);
    const aFreq = 3.0 + audio.bass * 2.0;
    const bFreq = 2.0 + audio.mid * 2.0;
    const phase = time * 2.0 * speed;

    for (let i = 0; i < this.numLissajousPts; i++) {
      const t = (i / this.numLissajousPts) * Math.PI * 2;
      pos[i * 3] = Math.sin(aFreq * t + phase) * amp;
      pos[i * 3 + 1] = Math.sin(bFreq * t) * (amp * 0.75);
      pos[i * 3 + 2] = 0;
    }
    this.lissajousLine.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.cardMaterial.uniforms.uPrimary.value.set(theme.primary);
    this.cardMaterial.uniforms.uAccent.value.set(theme.accent);
    this.lissajousMaterial.color.set(theme.glow);
  }
}
