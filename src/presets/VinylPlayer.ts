import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class VinylPlayerPreset extends BasePreset {
  public override readonly id = 'vinyl';
  public override readonly name = 'Vinyl';
  public override readonly category = 'Structures' as const;
  public override readonly description = '3D spinning vinyl record turntable with tonearm and grooves.';
  public override cameraConfig = {
    position: [0, 8, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private vinylDisc!: THREE.Mesh;
  private toneArm!: THREE.Group;
  private vinylMaterial!: THREE.MeshPhysicalMaterial;
  private labelMaterial!: THREE.MeshBasicMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'RPM Speed', min: 0.5, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Scratch Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Groove Shine', min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.8 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const discGeom = new THREE.CylinderGeometry(4.0, 4.0, 0.08, 64);
    this.vinylMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.05),
      roughness: 0.3,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    this.vinylDisc = new THREE.Mesh(discGeom, this.vinylMaterial);
    this.vinylDisc.rotation.set(0, 0, 0);
    this.group.add(this.vinylDisc);

    // Center record label
    const labelGeom = new THREE.CylinderGeometry(1.3, 1.3, 0.09, 32);
    this.labelMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.accent)
    });
    const labelMesh = new THREE.Mesh(labelGeom, this.labelMaterial);
    this.vinylDisc.add(labelMesh);

    // Spindle pin
    const spindleGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
    const spindleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      metalness: 0.95
    });
    const spindleMesh = new THREE.Mesh(spindleGeom, spindleMat);
    this.vinylDisc.add(spindleMesh);

    // Tonearm
    this.toneArm = new THREE.Group();
    this.toneArm.position.set(3.8, 0.2, 0.5);
    const armGeom = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 12);
    armGeom.rotateZ(Math.PI / 2.0);
    const armMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.accent),
      metalness: 0.9,
      roughness: 0.2
    });
    const armMesh = new THREE.Mesh(armGeom, armMat);
    this.toneArm.add(armMesh);

    const headshellGeom = new THREE.BoxGeometry(0.2, 0.1, 0.4);
    const headshellMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });
    const headshell = new THREE.Mesh(headshellGeom, headshellMat);
    headshell.position.set(-1.8, -0.1, 0);
    this.toneArm.add(headshell);

    this.group.add(this.toneArm);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const shine = this.paramStore.getValue('density');

    this.vinylMaterial.clearcoat = shine;

    // 33 1/3 RPM spin modulated by audio
    const rpm = (3.5 * speed) + audio.mid * 3.0 * reactivity;
    this.vinylDisc.rotation.y += delta * rpm;

    // Tonearm micro-vibration tracking grooves
    this.toneArm.rotation.y = -0.25 + Math.sin(this.vinylDisc.rotation.y * 0.4) * 0.02 + audio.bass * 0.06 * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.labelMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.vinylDisc) {
      this.vinylDisc.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
    if (this.toneArm) {
      this.toneArm.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
  }
}
