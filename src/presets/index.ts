import { VisualizerPreset } from '../types';
import { CircularSpectrumPreset } from './CircularSpectrum';
import { WaveFormPreset } from './WaveForm';
import { ThreeDBarsPreset } from './ThreeDBars';
import { StarfieldPreset } from './Starfield';
import { NeonTunnelPreset } from './NeonTunnel';
import { ParticleFieldPreset } from './ParticleField';
import { ObsidianPolyPreset } from './ObsidianPoly';
import { MatrixRainPreset } from './MatrixRain';
import { BlackHolePreset } from './BlackHole';
import { LavaEnergyPreset } from './LavaEnergy';

export const PRESETS: VisualizerPreset[] = [
  new CircularSpectrumPreset(),
  new WaveFormPreset(),
  new ThreeDBarsPreset(),
  new StarfieldPreset(),
  new NeonTunnelPreset(),
  new ParticleFieldPreset(),
  new ObsidianPolyPreset(),
  new MatrixRainPreset(),
  new BlackHolePreset(),
  new LavaEnergyPreset()
];

export function getPreset(id: string): VisualizerPreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}

