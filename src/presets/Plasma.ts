import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class PlasmaPreset extends BasePreset {
  public override readonly id = 'plasma';
  public override readonly name = 'Plasma';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Luminescent ionized gas cloud with high-voltage filaments.';
  public override cameraConfig = {
    position: [0, 0, 9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private torusMesh!: THREE.Mesh;
  private filaments!: THREE.LineSegments;
  private torusMaterial!: THREE.ShaderMaterial;
  private filamentMaterial!: THREE.LineBasicMaterial;
  private readonly numFilaments = 32;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Gas Swirl Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Ionization Pulse', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Torus Radius', min: 1.5, max: 4.5, step: 0.1, defaultValue: 2.8 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');
    const torusGeom = new THREE.TorusGeometry(radius, 1.2, 32, 64);

    this.torusMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uTreble;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          vNormal = normal;
          vec3 p = position;
          float wobble = sin(p.x * 3.0 + uTime * 4.0) * cos(p.y * 3.0 + uTime * 3.0) * 0.25 * (1.0 + uTreble);
          p += normal * wobble;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          vec3 col = mix(uColor1, uAccent, pow(rim, 2.0));
          gl_FragColor = vec4(col, 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.torusMesh = new THREE.Mesh(torusGeom, this.torusMaterial);
    this.group.add(this.torusMesh);

    // High-voltage filaments
    const linePositions: number[] = [];
    for (let f = 0; f < this.numFilaments; f++) {
      const angle = (f / this.numFilaments) * Math.PI * 2;
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + 0.3) * (radius * 1.4);
      const y2 = Math.sin(angle + 0.3) * (radius * 1.4);
      linePositions.push(x1, y1, 0, x2, y2, 0.8 * Math.sin(f));
    }
    const filGeom = new THREE.BufferGeometry();
    filGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    this.filamentMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.filaments = new THREE.LineSegments(filGeom, this.filamentMaterial);
    this.group.add(this.filaments);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.x += delta * 0.4 * speed;
    this.group.rotation.y += delta * 0.6 * speed;

    this.torusMaterial.uniforms.uTime.value = time * speed;
    this.torusMaterial.uniforms.uTreble.value = audio.treble * reactivity;

    const scale = 1.0 + audio.mid * 0.35 * reactivity;
    this.torusMesh.scale.set(scale, scale, scale);
    this.filamentMaterial.opacity = 0.4 + (audio.treble * 0.6 + (audio.beat ? 0.3 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.torusMaterial.uniforms.uColor1.value.set(theme.primary);
    this.torusMaterial.uniforms.uAccent.value.set(theme.accent);
    this.filamentMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.torusMesh) {
      this.torusMesh.geometry.dispose();
      this.torusMaterial?.dispose();
    }
    if (this.filaments) {
      this.filaments.geometry.dispose();
      this.filamentMaterial?.dispose();
    }
  }
}
