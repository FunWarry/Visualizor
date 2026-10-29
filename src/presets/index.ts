import { VisualizerPreset } from '../types';
import { CircularSpectrumPreset } from './CircularSpectrum';
import { WaveFormPreset } from './WaveForm';
import { ThreeDBarsPreset } from './ThreeDBars';
import { ObsidianPolyPreset } from './ObsidianPoly';
import { FerrofluidPreset } from './Ferrofluid';
import { DNAHelixPreset } from './DNAHelix';
import { GeodesicSpherePreset } from './GeodesicSphere';
import { StarfieldPreset } from './Starfield';
import { BlackHolePreset } from './BlackHole';
import { SynthwaveTerrainPreset } from './SynthwaveTerrain';
import { ParticleFieldPreset } from './ParticleField';
import { LightningArcsPreset } from './LightningArcs';
import { LavaEnergyPreset } from './LavaEnergy';
import { NeonTunnelPreset } from './NeonTunnel';
import { BoxTunnelPreset } from './BoxTunnel';
import { KaleidoscopeMandalaPreset } from './KaleidoscopeMandala';
import { MatrixRainPreset } from './MatrixRain';
import { DiodeWallPreset } from './DiodeWall';

export const PRESETS: VisualizerPreset[] = [
  new CircularSpectrumPreset(),
  new WaveFormPreset(),
  new ThreeDBarsPreset(),
  new ObsidianPolyPreset(),
  new FerrofluidPreset(),
  new DNAHelixPreset(),
  new GeodesicSpherePreset(),
  new StarfieldPreset(),
  new BlackHolePreset(),
  new SynthwaveTerrainPreset(),
  new ParticleFieldPreset(),
  new LightningArcsPreset(),
  new LavaEnergyPreset(),
  new NeonTunnelPreset(),
  new BoxTunnelPreset(),
  new KaleidoscopeMandalaPreset(),
  new MatrixRainPreset(),
  new DiodeWallPreset()
];

export function getPreset(id: string): VisualizerPreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}
