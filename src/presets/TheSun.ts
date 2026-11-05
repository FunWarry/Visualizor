import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class TheSunPreset extends BasePreset {
  public override readonly id = 'sun';
  public override readonly name = 'The Sun';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Layered solar corona with prominence flares and heat shimmer.';

  private coreMesh!: THREE.Mesh;
  private coronaMesh!: THREE.Mesh;
  private flarePoints!: THREE.Points;
  private coreMaterial!: THREE.ShaderMaterial;
  private coronaMaterial!: THREE.ShaderMaterial;
  private flareMaterial!: THREE.PointsMaterial;
  private flarePositions!: Float32Array;
  private flareBaseRadius!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Corona Turbulence', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Flare Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Core Radius', min: 1.5, max: 4.0, step: 0.1, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const coreRad = this.paramStore.getValue('density');
    const coreGeom = new THREE.IcosahedronGeometry(coreRad, 4);
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          vNormal = normal;
          vPosition = position;
          float noise = sin(position.x * 4.0 + uTime * 2.0) 
                      * cos(position.y * 4.0 + uTime * 2.5) 
                      * sin(position.z * 4.0 + uTime * 3.0);
          float disp = 1.0 + (noise * 0.15 * (1.0 + uBass * 1.5));
          vDisplacement = noise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * disp, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          float heat = clamp(0.5 + vDisplacement * 0.5 + uBass * 0.4, 0.0, 1.0);
          vec3 col = mix(uColor1, uColor2, heat);
          col += vec3(1.0, 0.9, 0.5) * pow(heat, 3.0) * (0.8 + uBass);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    const coronaGeom = new THREE.SphereGeometry(coreRad * 1.44, 32, 32);
    this.coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uCoronaColor: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCoronaColor;
        uniform float uEnergy;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(uCoronaColor, intensity * (0.6 + uEnergy * 0.8));
        }
      `
    });
    this.coronaMesh = new THREE.Mesh(coronaGeom, this.coronaMaterial);
    this.group.add(this.coronaMesh);

    const flareCount = 1500;
    const flareGeom = new THREE.BufferGeometry();
    this.flarePositions = new Float32Array(flareCount * 3);
    this.flareBaseRadius = new Float32Array(flareCount);

    for (let i = 0; i < flareCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = coreRad * 1.04 + Math.random() * (coreRad * 1.1);
      this.flareBaseRadius[i] = rad;

      this.flarePositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      this.flarePositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      this.flarePositions[i * 3 + 2] = rad * Math.cos(phi);
    }
    flareGeom.setAttribute('position', new THREE.BufferAttribute(this.flarePositions, 3));

    this.flareMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.flarePoints = new THREE.Points(flareGeom, this.flareMaterial);
    this.group.add(this.flarePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.2 * speed;
    this.group.rotation.x += delta * 0.08 * speed;

    this.coreMaterial.uniforms.uTime.value = time * speed;
    this.coreMaterial.uniforms.uBass.value = audio.bass * reactivity;

    this.coronaMaterial.uniforms.uTime.value = time * speed;
    this.coronaMaterial.uniforms.uEnergy.value = (audio.mid + audio.beatEnergy * 0.6) * reactivity;

    const pos = (this.flarePoints.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const pulse = 1.0 + audio.treble * 0.5 * reactivity + (audio.beat ? 0.4 * reactivity : 0);

    for (let i = 0; i < this.flareBaseRadius.length; i++) {
      const idx = i * 3;
      const bx = this.flarePositions[idx];
      const by = this.flarePositions[idx + 1];
      const bz = this.flarePositions[idx + 2];

      const flareWobble = Math.sin(time * 4.0 * speed + i) * 0.15 * audio.mid;
      pos[idx] = bx * (pulse + flareWobble);
      pos[idx + 1] = by * (pulse + flareWobble);
      pos[idx + 2] = bz * (pulse + flareWobble);
    }
    this.flarePoints.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.uniforms.uColor1.value.set(theme.primary);
    this.coreMaterial.uniforms.uColor2.value.set(theme.accent);
    this.coronaMaterial.uniforms.uCoronaColor.value.set(theme.accent);
    this.flareMaterial.color.set(theme.accent);
  }
}
