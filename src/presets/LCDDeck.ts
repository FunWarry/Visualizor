import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class LCDDeckPreset extends BasePreset {
  public override readonly id = 'lcddeck';
  public override readonly name = 'LCD Deck';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Backlit cyberdeck console with spinning compact disc and segmented LCD meters.';
  public override cameraConfig = {
    position: [0, 0, 8] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private cdDisc!: THREE.Mesh;
  private deckChassis!: THREE.Mesh;
  private readonly vuBars: THREE.Mesh[] = [];
  private cdMaterial!: THREE.MeshPhysicalMaterial;
  private vuMaterial!: THREE.MeshBasicMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Disc RPM', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'VU Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'VU Bar Height', min: 1.0, max: 4.0, step: 0.2, defaultValue: 2.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.vuBars.length = 0;

    // 1. Cyberdeck chassis base plate
    const deckGeom = new THREE.BoxGeometry(10, 6, 0.4);
    const deckMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.08),
      roughness: 0.8,
      metalness: 0.2
    });
    this.deckChassis = new THREE.Mesh(deckGeom, deckMat);
    this.deckChassis.position.z = -1;
    this.group.add(this.deckChassis);

    // 2. Spinning CD compact disc with holographic sheen
    const cdGeom = new THREE.RingGeometry(0.6, 2.5, 64);
    this.cdMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary),
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    this.cdDisc = new THREE.Mesh(cdGeom, this.cdMaterial);
    this.cdDisc.position.set(-2, 0, -0.6);
    this.group.add(this.cdDisc);

    // 3. LCD Segment VU meters (16 vertical illuminated bars)
    const vuCount = 16;
    const barGeom = new THREE.PlaneGeometry(0.2, 1.0);
    this.vuMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.accent)
    });

    for (let i = 0; i < vuCount; i++) {
      const bar = new THREE.Mesh(barGeom, this.vuMaterial);
      bar.position.set(1.2 + (i * 0.25), 0, -0.7);
      this.vuBars.push(bar);
      this.group.add(bar);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const maxHeight = this.paramStore.getValue('density');

    // Spin CD
    this.cdDisc.rotation.z -= delta * (3.0 + audio.bass * 4.0 * reactivity) * speed;

    // Modulate LCD VU bars
    const freq = audio.frequencyData;
    const step = Math.floor(freq.length / this.vuBars.length);

    for (let i = 0; i < this.vuBars.length; i++) {
      const val = (freq[i * step] / 255.0) * maxHeight * reactivity;
      this.vuBars[i].scale.y = Math.max(0.08, val);
      this.vuBars[i].position.y = (this.vuBars[i].scale.y / 2) - 1.0;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.vuMaterial.color.set(theme.accent);
    this.cdMaterial.color.set(theme.primary);
    (this.deckChassis.material as THREE.MeshStandardMaterial).color.set(theme.background).offsetHSL(0, 0, 0.08);
  }
}
