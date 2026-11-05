import { VisualizerPreset } from '../types';

// Category 1: Structures (15)
import { WaveFormPreset } from './WaveForm';
import { CircularSpectrumPreset } from './CircularSpectrum';
import { ThreeDBarsPreset } from './ThreeDBars';
import { FerrofluidPreset } from './Ferrofluid';
import { ObsidianPolyPreset } from './ObsidianPoly';
import { PendulumPreset } from './Pendulum';
import { WarpGridPreset } from './WarpGrid';
import { DNAHelixPreset } from './DNAHelix';
import { CymaticPreset } from './Cymatic';
import { TopoMapPreset } from './TopoMap';
import { VinylPlayerPreset } from './VinylPlayer';
import { OrbitalRingsPreset } from './OrbitalRings';
import { Tesseract4DPreset } from './Tesseract4D';
import { HologramPreset } from './Hologram';
import { GeodesicSpherePreset } from './GeodesicSphere';

// Category 2: Abstract & Space (15)
import { StarfieldPreset } from './Starfield';
import { MilkDropPreset } from './MilkDrop';
import { HaloPreset } from './Halo';
import { FacePreset } from './Face';
import { GeissPreset } from './Geiss';
import { TieDyePreset } from './TieDye';
import { AuroraPreset } from './Aurora';
import { GravityForcePreset } from './GravityForce';
import { SacredMandalaPreset } from './SacredMandala';
import { TheSunPreset } from './TheSun';
import { BlackHolePreset } from './BlackHole';
import { MandelFractalPreset } from './MandelFractal';
import { UnfoldingMatterPreset } from './UnfoldingMatter';
import { SynthwaveTerrainPreset } from './SynthwaveTerrain';
import { GalaxyPreset } from './Galaxy';

// Category 3: Particles & Light (4)
import { ParticleFieldPreset } from './ParticleField';
import { FirefliesPreset } from './Fireflies';
import { LightningPreset } from './Lightning';
import { PlasmaArcsPreset } from './PlasmaArcs';

// Category 4: Fluids & Heat (9)
import { LavaEnergyPreset } from './LavaEnergy';
import { FireballPreset } from './Fireball';
import { WaterNeuronsPreset } from './WaterNeurons';
import { LiquidPreset } from './Liquid';
import { FluidPreset } from './Fluid';
import { PlasmaPreset } from './Plasma';
import { FogPreset } from './Fog';
import { RainWaterPreset } from './RainWater';
import { SmokePreset } from './Smoke';

// Category 5: Tunnels (7)
import { TunnelPreset } from './Tunnel';
import { BoxTunnelPreset } from './BoxTunnel';
import { RingTunnelPreset } from './RingTunnel';
import { WaterSlidePreset } from './WaterSlide';
import { NeonTunnelPreset } from './NeonTunnel';
import { VeinTunnelPreset } from './VeinTunnel';
import { KaleidoscopeMandalaPreset } from './KaleidoscopeMandala';

// Category 6: Retro & Digital (7)
import { MatrixRainPreset } from './MatrixRain';
import { VodLinesPreset } from './VodLines';
import { NightRadarPreset } from './NightRadar';
import { DiodeWallPreset } from './DiodeWall';
import { SpectrogramPreset } from './Spectrogram';
import { LCDDeckPreset } from './LCDDeck';
import { SignalLockPreset } from './SignalLock';

// Category 7: Organic & Nature (14)
import { BloomFlowerPreset } from './BloomFlower';
import { InkDiffusionPreset } from './InkDiffusion';
import { MeadowFieldPreset } from './MeadowField';
import { BioCellsPreset } from './BioCells';
import { UpCloudPreset } from './UpCloud';
import { RainRoomPreset } from './RainRoom';
import { OceanWavesPreset } from './OceanWaves';
import { ForestStormPreset } from './ForestStorm';
import { SingleTreePreset } from './SingleTree';
import { HauntedForestPreset } from './HauntedForest';
import { StormCellPreset } from './StormCell';
import { JellyfishPreset } from './Jellyfish';
import { MyceliumPreset } from './Mycelium';
import { VolcanoPreset } from './Volcano';

import { StudioComposerPreset } from '../studio/StudioComposer';

export const PRESETS: VisualizerPreset[] = [
  // Structures (15)
  new WaveFormPreset(),
  new CircularSpectrumPreset(),
  new ThreeDBarsPreset(),
  new FerrofluidPreset(),
  new ObsidianPolyPreset(),
  new PendulumPreset(),
  new WarpGridPreset(),
  new DNAHelixPreset(),
  new CymaticPreset(),
  new TopoMapPreset(),
  new VinylPlayerPreset(),
  new OrbitalRingsPreset(),
  new Tesseract4DPreset(),
  new HologramPreset(),
  new GeodesicSpherePreset(),

  // Abstract & Space (15)
  new StarfieldPreset(),
  new MilkDropPreset(),
  new HaloPreset(),
  new FacePreset(),
  new GeissPreset(),
  new TieDyePreset(),
  new AuroraPreset(),
  new GravityForcePreset(),
  new SacredMandalaPreset(),
  new TheSunPreset(),
  new BlackHolePreset(),
  new MandelFractalPreset(),
  new UnfoldingMatterPreset(),
  new SynthwaveTerrainPreset(),
  new GalaxyPreset(),

  // Particles & Light (4)
  new ParticleFieldPreset(),
  new FirefliesPreset(),
  new LightningPreset(),
  new PlasmaArcsPreset(),

  // Fluids & Heat (9)
  new LavaEnergyPreset(),
  new FireballPreset(),
  new WaterNeuronsPreset(),
  new LiquidPreset(),
  new FluidPreset(),
  new PlasmaPreset(),
  new FogPreset(),
  new RainWaterPreset(),
  new SmokePreset(),

  // Tunnels (7)
  new TunnelPreset(),
  new BoxTunnelPreset(),
  new RingTunnelPreset(),
  new WaterSlidePreset(),
  new NeonTunnelPreset(),
  new VeinTunnelPreset(),
  new KaleidoscopeMandalaPreset(),

  // Retro & Digital (7)
  new MatrixRainPreset(),
  new VodLinesPreset(),
  new NightRadarPreset(),
  new DiodeWallPreset(),
  new SpectrogramPreset(),
  new LCDDeckPreset(),
  new SignalLockPreset(),

  // Organic & Nature (14)
  new BloomFlowerPreset(),
  new InkDiffusionPreset(),
  new MeadowFieldPreset(),
  new BioCellsPreset(),
  new UpCloudPreset(),
  new RainRoomPreset(),
  new OceanWavesPreset(),
  new ForestStormPreset(),
  new SingleTreePreset(),
  new HauntedForestPreset(),
  new StormCellPreset(),
  new JellyfishPreset(),
  new MyceliumPreset(),
  new VolcanoPreset()
];

export const PRESET_ALIASES: Record<string, string> = {
  // Structures
  'waveform': 'wave',
  'wave-form': 'wave',
  'circular-spectrum': 'circular',
  '3d-bars': 'bars3d',
  'three-d-bars': 'bars3d',
  'bars-3d': 'bars3d',
  'obsidian-poly': 'obsidian',
  'pendulum-wave': 'pendulum',
  'warp-grid': 'warp',
  'dna-helix': 'dna',
  'cymatic-plate': 'cymatic',
  'topo-map': 'topographic',
  'vinyl-player': 'vinyl',
  'orbital-rings': 'rings',
  'tesseract-4d': 'tesseract',
  'hologram-glitch': 'hologram',
  'geodesic-sphere': 'geodesic',

  // Abstract & Space
  'halo-bloom': 'halo',
  'face-mask': 'face',
  'geiss-feedback': 'geiss',
  'tiedye-fabric': 'tiedye',
  'aurora-mandala': 'aurora',
  'gravity-force': 'gravityforce',
  'sacred-mandala': 'sacred',
  'the-sun': 'sun',
  'black-hole': 'blackhole',
  'mandel-fractal': 'mandel',
  'unfolding-matter': 'unfoldingmatter',
  'synthwave-terrain': 'terrain',
  'galaxy-clusters': 'galaxy',

  // Particles & Light
  'particle-field': 'particles',
  'lightning-arcs': 'lightning',
  'plasma-arcs': 'plasmaarcs',

  // Fluids & Heat
  'lava-energy': 'lava',
  'fireball-neurons': 'fireball',
  'water-neurons': 'waterneurons',
  'liquid-chroma': 'liquid',
  'fluid-container': 'fluid',
  'fluid-plasma': 'liquid',
  'plasma-gas': 'plasma',
  'fog-mist': 'fog',
  'fog-ripples': 'fog',
  'rain-water': 'water',
  'smoke-wisps': 'smoke',

  // Tunnels
  'infinite-tunnel': 'tunnel',
  'box-tunnel': 'boxtunnel',
  'ring-tunnel': 'ringtunnel',
  'water-slide': 'waterslide',
  'neon-tunnel': 'neontunnel',
  'vein-tunnel': 'veintunnel',
  'kaleidoscope-mandala': 'kaleidoscope',

  // Retro & Digital
  'matrix-rain': 'matrix',
  'vod-lines': 'vodlines',
  'night-radar': 'nightradar',
  'diode-wall': 'diodewall',
  'spectrogram': 'spectogram',
  'spectrogram-radar': 'spectogram',
  'lcd-deck': 'lcddeck',
  'signal-lock': 'signallock',

  // Organic & Nature
  'bloom-flower': 'bloom',
  'ink-drops': 'ink',
  'meadow-field': 'meadow',
  'bio-cells': 'biocells',
  'up-cloud': 'upcloud',
  'rain-room': 'rainroom',
  'ocean-waves': 'ocean',
  'forest-canopy': 'forest',
  'forest-storm': 'forest',
  'single-tree': 'singletree',
  'haunted-forest': 'hauntedforest',
  'storm-cell': 'stormcell',
  'jellyfish-mycelium': 'jellyfish',
  'volcano-eruption': 'volcano'
};

const studioComposerInstance = new StudioComposerPreset();

export function getPreset(id: string): VisualizerPreset {
  if (id === 'studio-composer') {
    return studioComposerInstance;
  }
  const canonicalId = PRESET_ALIASES[id] || id;
  const found = PRESETS.find(p => p.id === canonicalId || p.id === id);
  const target = found || PRESETS[0];

  if (id in PRESET_ALIASES) {
    return new Proxy(target, {
      get(t, prop, receiver) {
        if (prop === 'id') {
          return id;
        }
        const val = Reflect.get(t, prop, receiver);
        return typeof val === 'function' ? val.bind(t) : val;
      }
    });
  }

  return target;
}
