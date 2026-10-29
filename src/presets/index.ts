import { VisualizerPreset } from '../types';
import { CircularSpectrumPreset } from './CircularSpectrum';
import { WaveFormPreset } from './WaveForm';
import { ThreeDBarsPreset } from './ThreeDBars';
import { ObsidianPolyPreset } from './ObsidianPoly';
import { FerrofluidPreset } from './Ferrofluid';
import { DNAHelixPreset } from './DNAHelix';
import { GeodesicSpherePreset } from './GeodesicSphere';
import { TopoMapPreset } from './TopoMap';
import { VinylPlayerPreset } from './VinylPlayer';
import { Tesseract4DPreset } from './Tesseract4D';
import { StarfieldPreset } from './Starfield';
import { BlackHolePreset } from './BlackHole';
import { TheSunPreset } from './TheSun';
import { MandelFractalPreset } from './MandelFractal';
import { MilkDropPreset } from './MilkDrop';
import { AuroraMandalaPreset } from './AuroraMandala';
import { SynthwaveTerrainPreset } from './SynthwaveTerrain';
import { ParticleFieldPreset } from './ParticleField';
import { FirefliesPreset } from './Fireflies';
import { LightningArcsPreset } from './LightningArcs';
import { LavaEnergyPreset } from './LavaEnergy';
import { FireballNeuronsPreset } from './FireballNeurons';
import { FluidPlasmaPreset } from './FluidPlasma';
import { FogRipplesPreset } from './FogRipples';
import { NeonTunnelPreset } from './NeonTunnel';
import { BoxTunnelPreset } from './BoxTunnel';
import { WaterSlidePreset } from './WaterSlide';
import { KaleidoscopeMandalaPreset } from './KaleidoscopeMandala';
import { MatrixRainPreset } from './MatrixRain';
import { SpectrogramPreset } from './Spectrogram';
import { DiodeWallPreset } from './DiodeWall';
import { LCDDeckPreset } from './LCDDeck';
import { BloomFlowerPreset } from './BloomFlower';
import { MeadowFieldPreset } from './MeadowField';
import { OceanWavesPreset } from './OceanWaves';
import { ForestStormPreset } from './ForestStorm';
import { JellyfishPreset } from './Jellyfish';
import { VolcanoPreset } from './Volcano';
import { StudioComposerPreset } from '../studio/StudioComposer';

export const PRESETS: VisualizerPreset[] = [
  new CircularSpectrumPreset(),
  new WaveFormPreset(),
  new ThreeDBarsPreset(),
  new ObsidianPolyPreset(),
  new FerrofluidPreset(),
  new DNAHelixPreset(),
  new GeodesicSpherePreset(),
  new TopoMapPreset(),
  new VinylPlayerPreset(),
  new Tesseract4DPreset(),
  new StarfieldPreset(),
  new BlackHolePreset(),
  new TheSunPreset(),
  new MandelFractalPreset(),
  new MilkDropPreset(),
  new AuroraMandalaPreset(),
  new SynthwaveTerrainPreset(),
  new ParticleFieldPreset(),
  new FirefliesPreset(),
  new LightningArcsPreset(),
  new LavaEnergyPreset(),
  new FireballNeuronsPreset(),
  new FluidPlasmaPreset(),
  new FogRipplesPreset(),
  new NeonTunnelPreset(),
  new BoxTunnelPreset(),
  new WaterSlidePreset(),
  new KaleidoscopeMandalaPreset(),
  new MatrixRainPreset(),
  new SpectrogramPreset(),
  new DiodeWallPreset(),
  new LCDDeckPreset(),
  new BloomFlowerPreset(),
  new MeadowFieldPreset(),
  new OceanWavesPreset(),
  new ForestStormPreset(),
  new JellyfishPreset(),
  new VolcanoPreset(),
  new StudioComposerPreset()
];

export function getPreset(id: string): VisualizerPreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}
