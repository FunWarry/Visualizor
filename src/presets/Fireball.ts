import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FireballPreset extends BasePreset {
  public override readonly id = 'fireball';
  public override readonly name = 'Fireball';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Blazing plasma energy sphere with solar combustion tongues.';
  public override cameraConfig = {
    position: [0, 0, 8] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };

  private coreMesh!: THREE.Mesh;
  private sparksPoints!: THREE.Points;
  private coreMaterial!: THREE.ShaderMaterial;
  private sparksMaterial!: THREE.PointsMaterial;
  private readonly numSparks = 800;
  private sparkVelocities!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Combustion Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Explosive Pulse', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Fire Radius', min: 1.0, max: 4.0, step: 0.1, defaultValue: 2.2 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');
    const geom = new THREE.IcosahedronGeometry(radius, 4);

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
        varying vec3 vPos;

        void main() {
          vNormal = normal;
          vec3 p = position;
          float noise = sin(p.x * 3.0 + uTime * 4.0) * cos(p.y * 3.0 + uTime * 3.5) * sin(p.z * 3.0 + uTime * 3.0);
          p += normal * noise * (0.35 + uBass * 0.8);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          float heat = length(vPos) * 0.4 + uBass * 0.4;
          vec3 col = mix(uColor1, uColor2, clamp(heat, 0.0, 1.0));
          col += vec3(1.0, 0.8, 0.3) * pow(clamp(heat, 0.0, 1.0), 3.0) * (0.8 + uBass);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.coreMesh = new THREE.Mesh(geom, this.coreMaterial);
    this.group.add(this.coreMesh);

    // Combustion spark particles
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(this.numSparks * 3);
    this.sparkVelocities = new Float32Array(this.numSparks * 3);

    for (let i = 0; i < this.numSparks; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const dist = radius + Math.random() * 2.5;

      sparkPos[i * 3] = dir.x * dist;
      sparkPos[i * 3 + 1] = dir.y * dist;
      sparkPos[i * 3 + 2] = dir.z * dist;

      this.sparkVelocities[i * 3] = dir.x * (0.5 + Math.random());
      this.sparkVelocities[i * 3 + 1] = dir.y * (0.5 + Math.random());
      this.sparkVelocities[i * 3 + 2] = dir.z * (0.5 + Math.random());
    }

    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    this.sparksMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparksPoints = new THREE.Points(sparkGeom, this.sparksMaterial);
    this.group.add(this.sparksPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.3 * speed;
    this.coreMaterial.uniforms.uTime.value = time * speed;
    this.coreMaterial.uniforms.uBass.value = audio.bass * reactivity;

    const scale = 1.0 + (audio.bass * 0.4 + audio.beatEnergy * 0.5) * reactivity;
    this.coreMesh.scale.set(scale, scale, scale);

    const pos = (this.sparksPoints.geometry.attributes.position.array as Float32Array);
    for (let i = 0; i < this.numSparks; i++) {
      const idx = i * 3;
      pos[idx] += this.sparkVelocities[idx] * delta * (2.0 + audio.bass * 4.0 * reactivity) * speed;
      pos[idx + 1] += this.sparkVelocities[idx + 1] * delta * (2.0 + audio.bass * 4.0 * reactivity) * speed;
      pos[idx + 2] += this.sparkVelocities[idx + 2] * delta * (2.0 + audio.bass * 4.0 * reactivity) * speed;

      const dist = Math.hypot(pos[idx], pos[idx + 1], pos[idx + 2]);
      if (dist > 7.0) {
        const dir = new THREE.Vector3(pos[idx], pos[idx + 1], pos[idx + 2]).normalize();
        pos[idx] = dir.x * 2.2;
        pos[idx + 1] = dir.y * 2.2;
        pos[idx + 2] = dir.z * 2.2;
      }
    }
    this.sparksPoints.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.uniforms.uColor1.value.set(theme.primary);
    this.coreMaterial.uniforms.uColor2.value.set(theme.accent);
    this.sparksMaterial.color.set(theme.accent);
  }
}
