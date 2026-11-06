import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition, PresetCameraConfig } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';

export abstract class BasePreset implements VisualizerPreset {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly category: VisualizerPreset['category'];
  public abstract readonly description: string;
  public cameraConfig?: PresetCameraConfig;

  protected group: THREE.Group = new THREE.Group();
  protected paramStore: ParameterStore = new ParameterStore([
    { id: 'speed', name: 'Speed', min: 0.1, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'reactivity', name: 'Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
    { id: 'density', name: 'Scale / Density', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 }
  ]);
  protected readonly disposables: { dispose(): void }[] = [];

  public init(ctx: PresetContext): void {
    this.group = new THREE.Group();
    this.setup(ctx);
    ctx.scene.add(this.group);
  }

  protected abstract setup(ctx: PresetContext): void;
  public abstract update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void;

  public onThemeChange?(_theme: VisualizerTheme): void;
  public resize?(_width: number, _height: number): void;

  public getCustomParameters(): ParameterDefinition[] {
    return this.paramStore.getDefinitions();
  }

  public setCustomParameter(id: string, value: number): void {
    this.paramStore.setValue(id, value);
  }

  public getCustomParameterValue(id: string): number | undefined {
    return this.paramStore.getValue(id);
  }

  public resetCustomParameters(): void {
    this.paramStore.reset();
  }

  public dispose(): void {
    if (this.group) {
      this.group.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          try {
            mesh.geometry.dispose();
          } catch {
            // Idempotent safeguard
          }
        }
        if (mesh.material) {
          try {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m?.dispose?.());
            } else {
              mesh.material.dispose?.();
            }
          } catch {
            // Idempotent safeguard
          }
        }
      });
      try {
        this.group.removeFromParent();
      } catch {
        // Idempotent safeguard
      }
    }

    for (const d of this.disposables) {
      try {
        d?.dispose?.();
      } catch {
        // Idempotent safeguard
      }
    }
    this.disposables.length = 0;

    this.onDispose();
  }

  protected onDispose(): void {
    // Optional subclass hook
  }
}
