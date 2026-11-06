import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class NightRadarPreset extends BasePreset {
  public override readonly id = 'nightradar';
  public override readonly name = 'Night Radar';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Circular cold phosphor CRT scope with rotating sweep arm and decaying target blips.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private radarScope!: THREE.Mesh;
  private sweepLine!: THREE.Line;
  private blipPoints!: THREE.Points;
  private scopeMaterial!: THREE.ShaderMaterial;
  private sweepMaterial!: THREE.LineBasicMaterial;
  private blipMaterial!: THREE.PointsMaterial;
  private sweepAngle = 0;
  private readonly numBlips = 32;
  private blipPositions!: Float32Array;
  private blipAlphas!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Sweep Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Blip Sensitivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Radar Radius', min: 3.0, max: 8.0, step: 0.5, defaultValue: 5.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');

    // 1. CRT Circular Scope Grid with concentric rings & crosshairs
    const scopeGeom = new THREE.CircleGeometry(radius, 64);
    this.scopeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: new THREE.Color(ctx.theme.primary) },
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
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float dist = length(p);
          if (dist > 1.0) discard;

          // Concentric grid rings
          float rings = sin(dist * 31.415);
          float crosshair = min(abs(p.x), abs(p.y));

          float grid = smoothstep(0.9, 0.98, rings) + (1.0 - smoothstep(0.005, 0.015, crosshair));
          vec3 col = mix(uColor * 0.15, uAccent, clamp(grid, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.7);
        }
      `
    });
    this.radarScope = new THREE.Mesh(scopeGeom, this.scopeMaterial);
    this.group.add(this.radarScope);

    // 2. Rotating sweep arm line
    const sweepGeom = new THREE.BufferGeometry();
    sweepGeom.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.05, radius, 0, 0.05], 3));
    this.sweepMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    this.sweepLine = new THREE.Line(sweepGeom, this.sweepMaterial);
    this.group.add(this.sweepLine);

    // 3. Target blips
    const blipGeom = new THREE.BufferGeometry();
    this.blipPositions = new Float32Array(this.numBlips * 3);
    this.blipAlphas = new Float32Array(this.numBlips);

    for (let i = 0; i < this.numBlips; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (radius * 0.85);
      this.blipPositions[i * 3] = Math.cos(angle) * r;
      this.blipPositions[i * 3 + 1] = Math.sin(angle) * r;
      this.blipPositions[i * 3 + 2] = 0.06;
      this.blipAlphas[i] = 0;
    }
    blipGeom.setAttribute('position', new THREE.BufferAttribute(this.blipPositions, 3));

    this.blipMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.blipPoints = new THREE.Points(blipGeom, this.blipMaterial);
    this.group.add(this.blipPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.sweepAngle += delta * 2.5 * speed;
    this.sweepLine.rotation.z = this.sweepAngle;

    // Trigger target blip on transients/beats
    if (audio.beat) {
      const randomIdx = Math.floor(Math.random() * this.numBlips);
      this.blipAlphas[randomIdx] = 1.0 * reactivity;
    }

    // Decay blips
    for (let i = 0; i < this.numBlips; i++) {
      this.blipAlphas[i] = Math.max(0, this.blipAlphas[i] - delta * 1.5);
    }

    this.blipMaterial.size = 0.25 + audio.bass * 0.35 * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.scopeMaterial.uniforms.uColor.value.set(theme.primary);
    this.scopeMaterial.uniforms.uAccent.value.set(theme.accent);
    this.sweepMaterial.color.set(theme.accent);
    this.blipMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.radarScope) {
      this.radarScope.geometry.dispose();
      this.scopeMaterial?.dispose();
    }
    if (this.sweepLine) {
      this.sweepLine.geometry.dispose();
      this.sweepMaterial?.dispose();
    }
    if (this.blipPoints) {
      this.blipPoints.geometry.dispose();
      this.blipMaterial?.dispose();
    }
  }
}
