import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MatrixRainPreset extends BasePreset {
  public override readonly id = 'matrix';
  public override readonly name = 'Matrix';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Cascading green neural code glyph columns with authentic lead flash and exponential decay.';
  public override cameraConfig = {
    position: [0, 0, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly count = 1200;
  private speeds!: Float32Array;
  private columnIds!: Int32Array;
  private readonly cols = 40;
  private readonly rows = 30;

  private smoothBass = 0;
  private smoothTreble = 0;
  private beatPulse = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rain Velocity', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Drop Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Drop Scale', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.BoxGeometry(0.12, 0.45, 0.05);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.speeds = new Float32Array(this.count);
    this.columnIds = new Int32Array(this.count);

    const primary = new THREE.Color(ctx.theme.primary);
    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      const colSpeed = 4.0 + Math.random() * 8.0;
      for (let r = 0; r < this.rows; r++) {
        if (idx >= this.count) break;
        const x = (c - this.cols / 2) * 0.45;
        const y = (Math.random() - 0.5) * 16;
        const z = (Math.random() - 0.5) * 10;

        this.dummy.position.set(x, y, z);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        this.instancedMesh.setColorAt(idx, primary);

        this.speeds[idx] = colSpeed;
        this.columnIds[idx] = c;
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.group.add(this.instancedMesh);
  }

  private computeGlyphColor(
    posY: number,
    colId: number,
    palette: { leadColor: THREE.Color; primary: THREE.Color; secondary: THREE.Color; darkGreen: THREE.Color },
    target: THREE.Color
  ): void {
    const trail = (8.0 - posY) / 16.0;
    if (trail < 0.08) {
      target.copy(palette.leadColor);
    } else if (trail < 0.4) {
      const t = (trail - 0.08) / 0.32;
      target.lerpColors(palette.primary, palette.secondary, t);
    } else {
      const t = Math.min(1.0, (trail - 0.4) / 0.6);
      target.lerpColors(palette.secondary, palette.darkGreen, t * t);
    }

    if (this.beatPulse > 0.3 && (colId % 3 === 0)) {
      target.lerp(palette.leadColor, this.beatPulse * 0.5);
    }
  }

  public update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 15);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 12);
    this.beatPulse = audio.beat ? 1.0 : this.beatPulse * 0.9;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const speedBoost = (1.0 + this.smoothBass * 2.5 * reactivity + this.beatPulse * 1.5) * speed;

    const palette = {
      leadColor: new THREE.Color(0xf0fff0),
      primary: new THREE.Color(ctx.theme.primary),
      secondary: new THREE.Color(ctx.theme.secondary),
      darkGreen: new THREE.Color(ctx.theme.background).offsetHSL(0.3, 0.2, 0.05)
    };

    const glitch = this.smoothTreble > 0.45;
    const colorBuf = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      this.instancedMesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);

      position.y -= this.speeds[i] * delta * speedBoost;
      if (position.y < -8) {
        position.y = 8 + Math.random() * 2.0;
        this.speeds[i] = 4.0 + Math.random() * 8.0;
      }

      if (glitch && Math.random() < 0.05) {
        position.x += (Math.random() - 0.5) * 0.15;
      }

      this.dummy.position.copy(position);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      this.computeGlyphColor(position.y, this.columnIds[i], palette, colorBuf);
      this.instancedMesh.setColorAt(i, colorBuf);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    if (this.instancedMesh.instanceColor) {
      const primary = new THREE.Color(theme.primary);
      for (let i = 0; i < this.count; i++) {
        this.instancedMesh.setColorAt(i, primary);
      }
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  protected override onDispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
    }
  }
}
