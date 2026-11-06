import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class PendulumPreset extends BasePreset {
  public override readonly id = 'pendulum';
  public override readonly name = 'Pendulum';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Array of harmonic suspended spheres forming a phase-aligned wave.';
  public override cameraConfig = {
    position: [0, 1.5, 10] as [number, number, number],
    target: [0, 1.5, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly numPendulums = 24;
  private readonly sphereMeshes: THREE.Mesh[] = [];
  private readonly stringLines: THREE.Line[] = [];
  private sphereMaterial!: THREE.MeshStandardMaterial;
  private stringMaterial!: THREE.LineBasicMaterial;
  private readonly sphereGeom = new THREE.SphereGeometry(0.35, 24, 24);

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Swing Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Amplitude', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.2 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.sphereMeshes.length = 0;
    this.stringLines.length = 0;

    this.sphereMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8
    });

    this.stringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.6
    });

    const spacing = 0.5;
    const startX = -((this.numPendulums - 1) * spacing) / 2;

    for (let i = 0; i < this.numPendulums; i++) {
      const x = startX + i * spacing;
      const sphere = new THREE.Mesh(this.sphereGeom, this.sphereMaterial);
      sphere.position.set(x, 0, 0);

      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 4, 0),
        new THREE.Vector3(x, 0, 0)
      ]);
      const string = new THREE.Line(lineGeom, this.stringMaterial);

      this.sphereMeshes.push(sphere);
      this.stringLines.push(string);

      this.group.add(sphere);
      this.group.add(string);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const amplitude = this.paramStore.getValue('density');

    this.group.rotation.y += delta * 0.1 * speed;

    const spacing = 0.5;
    const startX = -((this.numPendulums - 1) * spacing) / 2;
    const kickBoost = audio.bass * 0.8 * reactivity;

    for (let i = 0; i < this.numPendulums; i++) {
      const x = startX + i * spacing;
      // Phase-coupled harmonic frequency
      const freq = 1.0 + (i * 0.05);
      const angle = Math.sin(time * freq * 2.0 * speed) * (0.8 * amplitude + kickBoost);

      const length = 4.0;
      const sphereX = x + Math.sin(angle) * (length * 0.5);
      const sphereY = 4.0 - Math.cos(angle) * length;
      const sphereZ = Math.sin(angle * 2.0) * (audio.mid * 1.5 * reactivity);

      this.sphereMeshes[i].position.set(sphereX, sphereY, sphereZ);

      const linePos = (this.stringLines[i].geometry.attributes.position.array as Float32Array);
      linePos[0] = x;
      linePos[1] = 4;
      linePos[2] = 0;
      linePos[3] = sphereX;
      linePos[4] = sphereY;
      linePos[5] = sphereZ;
      this.stringLines[i].geometry.attributes.position.needsUpdate = true;
    }

    if (audio.beat) {
      this.sphereMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.sphereMaterial.emissiveIntensity *= 0.94;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.sphereMaterial.color.set(theme.primary);
    this.sphereMaterial.emissive.set(theme.secondary);
    this.stringMaterial.color.set(theme.accent);
  }
}
