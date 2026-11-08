const fs = require('fs');
const path = require('path');

const PRESET_MAP_71 = [
  // Structures (15)
  { id: 'wave', name: 'Wave Form', category: 'Structures', originalFile: 'wave.original.js', tsFile: 'src/presets/WaveForm.ts', origin: 'visuval.io (bundled)' },
  { id: 'circular', name: 'Circular', category: 'Structures', originalFile: 'circular.original.js', tsFile: 'src/presets/CircularSpectrum.ts', origin: 'visuval.io (CDN public)' },
  { id: 'bars3d', name: '3D Bars', category: 'Structures', originalFile: 'bars3d.original.js', tsFile: 'src/presets/ThreeDBars.ts', origin: 'visuval.io (CDN public)' },
  { id: 'ferrofluid', name: 'Ferrofluid', category: 'Structures', originalFile: 'ferrofluid.original.js', tsFile: 'src/presets/Ferrofluid.ts', origin: 'visuval.io (CDN public)' },
  { id: 'obsidian', name: 'Obsidian', category: 'Structures', originalFile: 'obsidian.original.js', tsFile: 'src/presets/ObsidianPoly.ts', origin: 'visuval.io (CDN public)' },
  { id: 'pendulum', name: 'Pendulum', category: 'Structures', originalFile: null, tsFile: 'src/presets/Pendulum.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'warp', name: 'Warp Grid', category: 'Structures', originalFile: null, tsFile: 'src/presets/WarpGrid.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'dna', name: 'DNA Helix', category: 'Structures', originalFile: null, tsFile: 'src/presets/DNAHelix.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'cymatic', name: 'Cymatic', category: 'Structures', originalFile: null, tsFile: 'src/presets/Cymatic.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'topographic', name: 'Topo Map', category: 'Structures', originalFile: null, tsFile: 'src/presets/TopoMap.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'vinyl', name: 'Vinyl', category: 'Structures', originalFile: null, tsFile: 'src/presets/VinylPlayer.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'rings', name: 'Rings', category: 'Structures', originalFile: null, tsFile: 'src/presets/OrbitalRings.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'tesseract', name: 'Tesseract', category: 'Structures', originalFile: null, tsFile: 'src/presets/Tesseract4D.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'hologram', name: 'Hologram', category: 'Structures', originalFile: null, tsFile: 'src/presets/Hologram.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'geodesic', name: 'Geodesic', category: 'Structures', originalFile: null, tsFile: 'src/presets/GeodesicSphere.ts', origin: 'visuval.io (premium auth-gated)' },

  // Abstract & Space (15)
  { id: 'starfield', name: 'Starfield', category: 'Abstract & Space', originalFile: 'starfield.original.js', tsFile: 'src/presets/Starfield.ts', origin: 'visuval.io (CDN public)' },
  { id: 'milkdrop', name: 'MilkDrop', category: 'Abstract & Space', originalFile: 'milkdrop.original.js', tsFile: 'src/presets/MilkDrop.ts', origin: 'visuval.io (CDN public)' },
  { id: 'halo', name: 'Halo', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/Halo.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'face', name: 'Face', category: 'Abstract & Space', originalFile: 'face.original.js', tsFile: 'src/presets/Face.ts', origin: 'visuval.io (CDN public)' },
  { id: 'geiss', name: 'Geiss', category: 'Abstract & Space', originalFile: 'geiss.original.js', tsFile: 'src/presets/Geiss.ts', origin: 'visuval.io (CDN public)' },
  { id: 'tiedye', name: 'Tie Dye', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/TieDye.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'aurora', name: 'Aurora', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/Aurora.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'gravityforce', name: 'Gravity Force', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/GravityForce.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'sacred', name: 'Sacred Mandala', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/SacredMandala.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'sun', name: 'The Sun', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/TheSun.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'blackhole', name: 'Black Hole', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/BlackHole.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'mandel', name: 'Mandel', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/MandelFractal.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'unfoldingmatter', name: 'Unfolding Matter', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/UnfoldingMatter.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'terrain', name: 'Terrain', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/SynthwaveTerrain.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'galaxy', name: 'Galaxy', category: 'Abstract & Space', originalFile: null, tsFile: 'src/presets/Galaxy.ts', origin: 'visuval.io (premium auth-gated)' },

  // Particles & Light (4)
  { id: 'particles', name: 'Particle Field', category: 'Particles & Light', originalFile: 'particles.original.js', tsFile: 'src/presets/ParticleField.ts', origin: 'visuval.io (CDN public)' },
  { id: 'fireflies', name: 'Fireflies', category: 'Particles & Light', originalFile: null, tsFile: 'src/presets/Fireflies.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'lightning', name: 'Lightning', category: 'Particles & Light', originalFile: null, tsFile: 'src/presets/Lightning.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'plasmaarcs', name: 'Plasma Arcs', category: 'Particles & Light', originalFile: null, tsFile: 'src/presets/PlasmaArcs.ts', origin: 'visuval.io (premium auth-gated)' },

  // Fluids & Heat (9)
  { id: 'lava', name: 'Lava', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/LavaEnergy.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'fireball', name: 'Fireball', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/Fireball.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'waterneurons', name: 'Water Neurons', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/WaterNeurons.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'liquid', name: 'Liquid', category: 'Fluids & Heat', originalFile: 'liquid.original.js', tsFile: 'src/presets/Liquid.ts', origin: 'visuval.io (CDN public)' },
  { id: 'fluid', name: 'Fluid', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/Fluid.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'plasma', name: 'Plasma', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/Plasma.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'fog', name: 'Fog', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/Fog.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'water', name: 'Rain Water', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/RainWater.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'smoke', name: 'Smoke', category: 'Fluids & Heat', originalFile: null, tsFile: 'src/presets/Smoke.ts', origin: 'visuval.io (premium auth-gated)' },

  // Tunnels (7)
  { id: 'tunnel', name: 'Tunnel', category: 'Tunnels', originalFile: 'tunnel.original.js', tsFile: 'src/presets/Tunnel.ts', origin: 'visuval.io (CDN public)' },
  { id: 'boxtunnel', name: 'Box Tunnel', category: 'Tunnels', originalFile: 'boxtunnel.original.js', tsFile: 'src/presets/BoxTunnel.ts', origin: 'visuval.io (CDN public)' },
  { id: 'ringtunnel', name: 'Ring Tunnel', category: 'Tunnels', originalFile: 'ringtunnel.original.js', tsFile: 'src/presets/RingTunnel.ts', origin: 'visuval.io (CDN public)' },
  { id: 'waterslide', name: 'Water Slide', category: 'Tunnels', originalFile: 'waterslide.original.js', tsFile: 'src/presets/WaterSlide.ts', origin: 'visuval.io (CDN public)' },
  { id: 'neontunnel', name: 'Neon Tunnel', category: 'Tunnels', originalFile: null, tsFile: 'src/presets/NeonTunnel.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'veintunnel', name: 'Vein Tunnel', category: 'Tunnels', originalFile: null, tsFile: 'src/presets/VeinTunnel.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', category: 'Tunnels', originalFile: null, tsFile: 'src/presets/KaleidoscopeMandala.ts', origin: 'visuval.io (premium auth-gated)' },

  // Retro & Digital (7)
  { id: 'matrix', name: 'Matrix', category: 'Retro & Digital', originalFile: 'matrix.original.js', tsFile: 'src/presets/MatrixRain.ts', origin: 'visuval.io (CDN public)' },
  { id: 'vodlines', name: 'Vod Lines', category: 'Retro & Digital', originalFile: null, tsFile: 'src/presets/VodLines.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'nightradar', name: 'Night Radar', category: 'Retro & Digital', originalFile: null, tsFile: 'src/presets/NightRadar.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'diodewall', name: 'Diode Wall', category: 'Retro & Digital', originalFile: 'diodewall.original.js', tsFile: 'src/presets/DiodeWall.ts', origin: 'visuval.io (CDN public)' },
  { id: 'spectogram', name: 'The Spectrogram', category: 'Retro & Digital', originalFile: 'spectogram.original.js', tsFile: 'src/presets/Spectrogram.ts', origin: 'visuval.io (CDN public)' },
  { id: 'lcddeck', name: 'LCD Deck', category: 'Retro & Digital', originalFile: null, tsFile: 'src/presets/LCDDeck.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'signallock', name: 'Signal Lock', category: 'Retro & Digital', originalFile: null, tsFile: 'src/presets/SignalLock.ts', origin: 'visuval.io (premium auth-gated)' },

  // Organic & Nature (14)
  { id: 'bloom', name: 'Bloom', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/BloomFlower.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'ink', name: 'Ink Drop', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/InkDiffusion.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'meadow', name: 'Meadow', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/MeadowField.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'biocells', name: 'Bio Cells', category: 'Organic & Nature', originalFile: 'biocells.original.js', tsFile: 'src/presets/BioCells.ts', origin: 'visuval.io (CDN public)' },
  { id: 'upcloud', name: 'Up Cloud', category: 'Organic & Nature', originalFile: 'upcloud.original.js', tsFile: 'src/presets/UpCloud.ts', origin: 'visuval.io (CDN public)' },
  { id: 'rainroom', name: 'Rain Room', category: 'Organic & Nature', originalFile: 'rainroom.original.js', tsFile: 'src/presets/RainRoom.ts', origin: 'visuval.io (CDN public)' },
  { id: 'ocean', name: 'Ocean Wave', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/OceanWaves.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'forest', name: 'Forest', category: 'Organic & Nature', originalFile: 'forest.original.js', tsFile: 'src/presets/ForestStorm.ts', origin: 'visuval.io (CDN public)' },
  { id: 'singletree', name: 'Single Tree', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/SingleTree.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'hauntedforest', name: 'Haunted Forest', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/HauntedForest.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'stormcell', name: 'Storm Cell', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/StormCell.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'jellyfish', name: 'Jellyfish', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/Jellyfish.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'mycelium', name: 'Mycelium', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/Mycelium.ts', origin: 'visuval.io (premium auth-gated)' },
  { id: 'volcano', name: 'Volcano', category: 'Organic & Nature', originalFile: null, tsFile: 'src/presets/Volcano.ts', origin: 'visuval.io (premium auth-gated)' }
];

fs.writeFileSync(
  path.resolve(__dirname, '..', 'full_71_presets_catalog.json'),
  JSON.stringify(PRESET_MAP_71, null, 2),
  'utf8'
);

console.log(`Generated full_71_presets_catalog.json with ${PRESET_MAP_71.length} presets!`);
