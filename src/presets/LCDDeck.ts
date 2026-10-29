import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class LCDDeckPreset implements VisualizerPreset {
  id = 'lcd-deck';
  name = 'LCD Cyber Deck';
  category = 'Retro & Digital' as const;
  description = 'Cyberdeck audio console with spinning compact disc and LCD VU meter indicators.';

  private group!: THREE.Group;
  private cdDisc!: THREE.Mesh;
  private deckChassis!: THREE.Mesh;
  private vuBars: THREE.Mesh[] = [];
  private cdMaterial!: THREE.MeshPhysicalMaterial;
  private vuMaterial!: THREE.MeshBasicMaterial;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Cyberdeck chassis base plate
    const deckGeom = new THREE.BoxGeometry(10, 6, 0.4);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.8,
      metalness: 0.2
    });
    this.deckChassis = new THREE.Mesh(deckGeom, deckMat);
    this.deckChassis.position.z = -1;
    this.group.add(this.deckChassis);

    // 2. Spinning CD compact disc with holographic iridescent sheen
    const cdGeom = new THREE.RingGeometry(0.6, 2.5, 64);
    this.cdMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcccccc,
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

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    // CD disc spin rate depends on audio mid/treble
    this.cdDisc.rotation.z += delta * (3.0 + audio.mid * 5.0);

    // Update 16 VU bars based on frequency bins
    const freq = audio.frequencyData;
    const step = Math.floor(freq.length / this.vuBars.length);

    this.vuBars.forEach((bar, idx) => {
      const val = (freq[idx * step] / 255.0) * 3.0;
      bar.scale.y = Math.max(0.1, val);
      bar.position.y = (val * 0.5) - 0.5;
    });

    if (audio.beat) {
      this.vuMaterial.color.set(ctx.theme.primary);
    } else {
      this.vuMaterial.color.set(ctx.theme.accent);
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.vuMaterial.color.set(theme.accent);
  }

  dispose() {
    this.deckChassis.geometry.dispose();
    (this.deckChassis.material as THREE.Material).dispose();
    this.cdDisc.geometry.dispose();
    this.cdMaterial.dispose();
    this.vuMaterial.dispose();
    this.vuBars.forEach(b => b.geometry.dispose());
    this.group.removeFromParent();
  }
}
