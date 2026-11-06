import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FluidPreset extends BasePreset {
  public override readonly id = 'fluid';
  public override readonly name = 'Fluid';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = '3D glass tank side view with audio sloshing waves & bubbles.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private tankFrame!: THREE.LineSegments;
  private waterSurface!: THREE.Mesh;
  private bubblePoints!: THREE.Points;
  private waterMaterial!: THREE.ShaderMaterial;
  private frameMaterial!: THREE.LineBasicMaterial;
  private bubbleMaterial!: THREE.PointsMaterial;
  private readonly numBubbles = 300;
  private bubblePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Slosh Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Wave Amplitude', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Tank Scale', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Wireframe glass tank container
    const tankGeom = new THREE.BoxGeometry(10, 6, 4);
    const edges = new THREE.EdgesGeometry(tankGeom);
    this.frameMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.6
    });
    this.tankFrame = new THREE.LineSegments(edges, this.frameMaterial);
    this.group.add(this.tankFrame);

    // 2. Liquid sloshing plane
    const waterGeom = new THREE.PlaneGeometry(9.8, 3.8, 48, 24);
    waterGeom.rotateX(-Math.PI / 2);
    waterGeom.translate(0, 0.5, 0);

    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Sloshing wave across tank length
          float slosh = sin(p.x * 0.6 + uTime * 3.0) * (0.35 + uBass * 0.8);
          float ripple = cos(p.z * 1.5 + uTime * 4.0) * 0.15 * (1.0 + uBass);
          p.y += slosh + ripple;
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
          vec3 col = mix(uColor1, uAccent, clamp(vPos.y * 0.8 + 0.5, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.75);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.waterSurface = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.group.add(this.waterSurface);

    // 3. Rising air bubbles
    const bubbleGeom = new THREE.BufferGeometry();
    this.bubblePositions = new Float32Array(this.numBubbles * 3);
    for (let i = 0; i < this.numBubbles; i++) {
      this.bubblePositions[i * 3] = (Math.random() - 0.5) * 9.0;
      this.bubblePositions[i * 3 + 1] = -2.5 + Math.random() * 3.0;
      this.bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
    }
    bubbleGeom.setAttribute('position', new THREE.BufferAttribute(this.bubblePositions, 3));

    this.bubbleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.bubblePoints = new THREE.Points(bubbleGeom, this.bubbleMaterial);
    this.group.add(this.bubblePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y = Math.sin(time * 0.4 * speed) * 0.25;

    this.waterMaterial.uniforms.uTime.value = time * speed;
    this.waterMaterial.uniforms.uBass.value = audio.bass * reactivity;

    // Bubbles rise
    const pos = (this.bubblePoints.geometry.attributes.position.array as Float32Array);
    for (let i = 0; i < this.numBubbles; i++) {
      const idx = i * 3;
      pos[idx + 1] += delta * (1.2 + audio.bass * 2.0 * reactivity) * speed;
      pos[idx] += Math.sin(time * 4.0 + i) * delta * 0.2;

      if (pos[idx + 1] > 0.8) {
        pos[idx + 1] = -2.8;
        pos[idx] = (Math.random() - 0.5) * 9.0;
      }
    }
    this.bubblePoints.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.frameMaterial.color.set(theme.primary);
    this.waterMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterMaterial.uniforms.uAccent.value.set(theme.accent);
    this.bubbleMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.tankFrame) {
      this.tankFrame.geometry.dispose();
      this.frameMaterial?.dispose();
    }
    if (this.waterSurface) {
      this.waterSurface.geometry.dispose();
      this.waterMaterial?.dispose();
    }
    if (this.bubblePoints) {
      this.bubblePoints.geometry.dispose();
      this.bubbleMaterial?.dispose();
    }
  }
}
