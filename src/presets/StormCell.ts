import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class StormCellPreset extends BasePreset {
  public override readonly id = 'stormcell';
  public override readonly name = 'Storm Cell';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Rotating supercell anvil cloud with intra-cloud lightning.';

  private cloudVortex!: THREE.Mesh;
  private lightningLines!: THREE.LineSegments;
  private cloudMaterial!: THREE.ShaderMaterial;
  private lightningMaterial!: THREE.LineBasicMaterial;
  private lightningGeom!: THREE.BufferGeometry;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Vortex Rotation', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Lightning Strike', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Anvil Scale', min: 2.0, max: 6.0, step: 0.2, defaultValue: 3.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Supercell rotating anvil cone
    const anvilGeom = new THREE.ConeGeometry(4.5, 2.5, 32, 16, true);
    anvilGeom.rotateX(Math.PI);

    this.cloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uFlash: { value: 0 },
        uColor: { value: new THREE.Color(ctx.theme.primary) },
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
          float curl = sin(p.x * 2.0 + uTime * 2.0) * cos(p.z * 2.0 + uTime * 2.0) * (0.2 + uBass * 0.4);
          p.y += curl;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uFlash;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec3 darkCloud = uColor * 0.2;
          vec3 col = mix(darkCloud, uAccent * 2.0, uFlash);
          gl_FragColor = vec4(col, 0.85);
        }
      `
    });

    this.cloudVortex = new THREE.Mesh(anvilGeom, this.cloudMaterial);
    this.cloudVortex.position.y = 1.5;
    this.group.add(this.cloudVortex);

    // 2. Intra-cloud lightning flash segments
    this.lightningGeom = new THREE.BufferGeometry();
    const lPos = new Float32Array(16 * 2 * 3);
    this.lightningGeom.setAttribute('position', new THREE.BufferAttribute(lPos, 3));

    this.lightningMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0
    });
    this.lightningLines = new THREE.LineSegments(this.lightningGeom, this.lightningMaterial);
    this.group.add(this.lightningLines);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.cloudVortex.rotation.y += delta * 0.4 * speed;
    this.cloudMaterial.uniforms.uTime.value = time * speed;
    this.cloudMaterial.uniforms.uBass.value = audio.bass * reactivity;

    if (audio.beat) {
      this.cloudMaterial.uniforms.uFlash.value = 1.0 * reactivity;
      this.lightningMaterial.opacity = 1.0;

      // Randomize lightning paths
      const pos = (this.lightningGeom.attributes.position.array as Float32Array);
      for (let i = 0; i < 16; i++) {
        const idx = i * 6;
        pos[idx] = (Math.random() - 0.5) * 4.0;
        pos[idx + 1] = 1.5;
        pos[idx + 2] = (Math.random() - 0.5) * 4.0;

        pos[idx + 3] = pos[idx] + (Math.random() - 0.5) * 1.5;
        pos[idx + 4] = -1.5;
        pos[idx + 5] = pos[idx + 2] + (Math.random() - 0.5) * 1.5;
      }
      this.lightningGeom.attributes.position.needsUpdate = true;
    } else {
      this.cloudMaterial.uniforms.uFlash.value = Math.max(0, this.cloudMaterial.uniforms.uFlash.value - delta * 2.5);
      this.lightningMaterial.opacity = Math.max(0, this.lightningMaterial.opacity - delta * 4.0);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.cloudMaterial.uniforms.uColor.value.set(theme.primary);
    this.cloudMaterial.uniforms.uAccent.value.set(theme.accent);
  }
}
