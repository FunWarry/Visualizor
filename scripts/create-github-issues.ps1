# Visualizor - Automated GitHub Issues Creator
# Requires: gh auth login or $env:GH_TOKEN

$repo = "FunWarry/Visualizor"
$ghPath = "C:\Program Files\GitHub CLI\gh.exe"

$tickets = @(
  @{
    Title = "feat(preset): Implement Ferrofluid magnetic spike sphere"
    Body = "### Description`nImplement the 3D Ferrofluid preset with dynamic magnetic spikes deforming in real-time according to sub-bass and kick transients.`n`n### Acceptance Criteria`n- Deforming sphere mesh using GLSL vertex noise displacement.`n- Smooth theme color blending and metallic reflections.`n- Full integration in preset registry and 60 FPS compliance."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement DNA Helix rotating reactive strands"
    Body = "### Description`nImplement the 3D DNA Helix preset featuring dual intertwined strands rotating and pulsing with audio frequencies.`n`n### Acceptance Criteria`n- Instanced base pairs connecting the dual helix strands.`n- Audio-reactive speed and radius scaling on mid and treble.`n- Disposal of geometries and materials on preset switch."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement Topo Map & Cymatic standing waves"
    Body = "### Description`nImplement Topo Map (contour lines terrain) and Cymatic (acoustic nodal standing waves) presets.`n`n### Acceptance Criteria`n- Real-time contour slicing shader.`n- Audio frequency nodal vibration patterns.`n- 60 FPS performance."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement 3D Vinyl Turntable & Rings Orrery"
    Body = "### Description`nImplement 3D Vinyl (turntable record player with reactive arm) and Rings (orbital torus orrery) presets.`n`n### Acceptance Criteria`n- Realistic vinyl groove reflections and audio tonearm vibration.`n- Orbital mechanical rings pulsing with multi-band frequencies."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement Tesseract 4D & Hologram Glitch"
    Body = "### Description`nImplement 4D hypercube projection and holographic sci-fi projection glitch presets.`n`n### Acceptance Criteria`n- Mathematical 4D to 3D perspective rotation matrix.`n- Holographic scanlines and RGB glitch displacement."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement Geodesic frequency sphere & Warp Grid"
    Body = "### Description`nImplement Geodesic frequency sphere and Warp Grid wireframe mesh presets.`n`n### Acceptance Criteria`n- Geodesic icosahedral face extrusion based on FFT bins.`n- Infinite forward scrolling distorted wireframe plane."
    Labels = "enhancement,preset,structures"
  },
  @{
    Title = "feat(preset): Implement The Sun solar corona & flares"
    Body = "### Description`nImplement The Sun preset featuring multi-layered solar atmosphere and coronal mass ejections on bass hits.`n`n### Acceptance Criteria`n- Custom GLSL raymarched / Fresnel corona shader.`n- Solar flares bursting dynamically on audio beats."
    Labels = "enhancement,preset,abstract"
  },
  @{
    Title = "feat(preset): Implement Mandel fractal zoom & Unfolding Matter"
    Body = "### Description`nImplement Mandelbrot infinite zoom fractal and crystalline unfolding bloom presets.`n`n### Acceptance Criteria`n- GPU fragment shader Mandelbrot zoom with audio-reactive iterations.`n- Crystalline facets unfolding on treble harmonics."
    Labels = "enhancement,preset,abstract"
  },
  @{
    Title = "feat(preset): Implement MilkDrop & Geiss feedback vortices"
    Body = "### Description`nImplement MilkDrop psychedelic fluid distortion and Geiss icy vortex presets.`n`n### Acceptance Criteria`n- GPU feedback buffer with rotation and zoom warping.`n- Dynamic color cycling responding to theme palettes."
    Labels = "enhancement,preset,abstract"
  },
  @{
    Title = "feat(preset): Implement Aurora borealis & Sacred mandala"
    Body = "### Description`nImplement Aurora curtains of northern lights and Sacred geometric mandala presets.`n`n### Acceptance Criteria`n- Volumetric waving translucent ribbon curtains.`n- Symmetrical rotational mandala folding to beat energy."
    Labels = "enhancement,preset,abstract"
  },
  @{
    Title = "feat(preset): Implement Synthwave Terrain flyover & Galaxy flight"
    Body = "### Description`nImplement retro Synthwave infinite flyover terrain and Billboard Galaxies in warp flight.`n`n### Acceptance Criteria`n- Neon wireframe mountains scrolling towards camera with reactive sun.`n- Particle galaxy clusters with depth fog."
    Labels = "enhancement,preset,abstract"
  },
  @{
    Title = "feat(preset): Implement Fireflies bioluminescent swarm"
    Body = "### Description`nImplement Fireflies preset with a glowing swarm of particles exhibiting flocking behavior.`n`n### Acceptance Criteria`n- Boids / flocking simulation reacting to treble sparkle.`n- Soft glowing point light sprites."
    Labels = "enhancement,preset,particles"
  },
  @{
    Title = "feat(preset): Implement Lightning & Plasma Arcs electric network"
    Body = "### Description`nImplement branching electric arcs and full-screen plasma filament presets.`n`n### Acceptance Criteria`n- Procedural lightning bolt generation on bass transients.`n- High-intensity bloom glow for electric arcs."
    Labels = "enhancement,preset,particles"
  },
  @{
    Title = "feat(preset): Implement Fireball & Water Neurons"
    Body = "### Description`nImplement blazing energy Fireball and branching neural network presets.`n`n### Acceptance Criteria`n- Incandescent noisy energy fireball.`n- Neural synaptic impulse pulses triggered by beats."
    Labels = "enhancement,preset,fluids"
  },
  @{
    Title = "feat(preset): Implement Liquid, Fluid & Plasma gas shaders"
    Body = "### Description`nImplement fluid domain distortion, fluid container side view, and luminescent plasma gas.`n`n### Acceptance Criteria`n- Navier-Stokes / GLSL fluid velocity simulation approximation.`n- Responsive wave height and sloshing physics."
    Labels = "enhancement,preset,fluids"
  },
  @{
    Title = "feat(preset): Implement Fog domain warping, Rain Water & Smoke wisps"
    Body = "### Description`nImplement domain-warped mist fog, rain ripple surface, and curl-noise smoke wisps.`n`n### Acceptance Criteria`n- Volumetric smoke rendering with curl noise vector field.`n- Dynamic ripple generation on audio transients."
    Labels = "enhancement,preset,fluids"
  },
  @{
    Title = "feat(preset): Implement Box Tunnel & Ring Tunnel"
    Body = "### Description`nImplement infinite square Box Tunnel and concentric Ring Tunnel depth presets.`n`n### Acceptance Criteria`n- High-speed camera traversal with depth perspective.`n- Audio-reactive wall glow and speed boost."
    Labels = "enhancement,preset,tunnels"
  },
  @{
    Title = "feat(preset): Implement Water Slide & Vein Tunnel"
    Body = "### Description`nImplement wavy tubed Water Slide ride and organic neon Vein Tunnel spiral presets.`n`n### Acceptance Criteria`n- Spline curve camera track traversal.`n- Organic pulsing vein texture with theme emission."
    Labels = "enhancement,preset,tunnels"
  },
  @{
    Title = "feat(preset): Implement Kaleidoscope mirror mandala"
    Body = "### Description`nImplement Kaleidoscope 6/8/12-fold angular mirror reflection mandala.`n`n### Acceptance Criteria`n- Polar coordinate symmetry GLSL shader pass.`n- Interactive segment count and rotation speed."
    Labels = "enhancement,preset,tunnels"
  },
  @{
    Title = "feat(preset): Implement The Spectrogram & Night Radar scopes"
    Body = "### Description`nImplement vintage analog Spectrogram scope and green tactical Night Radar display.`n`n### Acceptance Criteria`n- Skeuomorphic CRT phosphor display lines.`n- Sweeping radial beam with target blips on frequency peaks."
    Labels = "enhancement,preset,retro"
  },
  @{
    Title = "feat(preset): Implement Diode Wall & Vod Lines"
    Body = "### Description`nImplement Club LED matrix Diode Wall and retro tracker Vod Lines.`n`n### Acceptance Criteria`n- Individual LED bulb grid with bloom glow.`n- Tracker oscilloscope waveforms with scanline texture."
    Labels = "enhancement,preset,retro"
  },
  @{
    Title = "feat(preset): Implement LCD Deck CD player & Signal Lock"
    Body = "### Description`nImplement backlit LCD CD-player display and TV test card Signal Lock glitch.`n`n### Acceptance Criteria`n- Segmented LCD digital meters and text.`n- SMPTE color bars with VHS tracking artifacts."
    Labels = "enhancement,preset,retro"
  },
  @{
    Title = "feat(preset): Implement Bloom flower opening & Ink drop diffusion"
    Body = "### Description`nImplement watercolor flower petals blooming and ink drops diffusing in water.`n`n### Acceptance Criteria`n- Petal geometry blooming outwards on audio volume.`n- Particle ink dispersion simulation."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(preset): Implement Meadow grass field & Up Cloud sky"
    Body = "### Description`nImplement cinematic grass field blowing in the wind and volumetric clouds.`n`n### Acceptance Criteria`n- Instanced grass blades swaying with audio wind physics.`n- Volumetric raymarched cloud cumulus."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(preset): Implement Ocean wave surface & Rain Room downpour"
    Body = "### Description`nImplement rolling 3D ocean waves with foam and backlit indoor rain downpour.`n`n### Acceptance Criteria`n- Gerstner wave displacement driven by audio power.`n- High-speed rain streak instanced particles."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(preset): Implement Forest raymarched tree & Storm Cell"
    Body = "### Description`nImplement raymarched mystical tree and storm cell with thunder lightning.`n`n### Acceptance Criteria`n- Fractal tree branches growing with harmonics.`n- Flashing cloud volume on thunder kick hits."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(preset): Implement Jellyfish bioluminescent pulse & Mycelium"
    Body = "### Description`nImplement bioluminescent swimming jellyfish and glowing fungal mycelium network.`n`n### Acceptance Criteria`n- Soft-body bell contraction swimming on kick beats.`n- Spreading glowing fungal mycelium hyphae."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(preset): Implement Erupting Volcano mountain"
    Body = "### Description`nImplement 3D Volcano with molten lava rivers and volcanic ash bursts on kicks.`n`n### Acceptance Criteria`n- Mountain terrain with glowing crater caldera.`n- Lava bomb particle ejection triggered on audio transients."
    Labels = "enhancement,preset,nature"
  },
  @{
    Title = "feat(audio): Implement Autocorrelation BPM Detection & Tap Tempo"
    Body = "### Description`nImplement continuous auto-tempo detection using autocorrelation algorithms and a manual Tap-Tempo badge in the UI.`n`n### Acceptance Criteria`n- BPM detection accuracy within +/- 1 BPM on rhythmic tracks.`n- Interactive tap button allowing manual tempo lock."
    Labels = "enhancement,audio"
  },
  @{
    Title = "feat(audio): Implement Playlist Queue Manager"
    Body = "### Description`nImplement multi-track queue manager with drag-and-drop file adding, shuffle, repeat, and auto-next track playback.`n`n### Acceptance Criteria`n- Persistent queue state in browser memory.`n- Drag and drop reordering of tracks.`n- Seamless track transition."
    Labels = "enhancement,audio,ui"
  },
  @{
    Title = "feat(studio): Implement Visualizer Studio stage composer"
    Body = "### Description`nImplement Studio mode allowing users to choose stage families (Chroma, Liquid, Tunnel, Volume, The Force) and customize geometries, materials, and motion in real-time.`n`n### Acceptance Criteria`n- Intuitive preset builder UI.`n- Live parameter slider controls.`n- Save / Export custom recipe presets locally."
    Labels = "enhancement,studio,ui"
  },
  @{
    Title = "feat(shader): Implement Motion Persistence / Feedback buffer pass"
    Body = "### Description`nImplement temporal feedback buffer post-processing pass for glowing motion trails and persistence.`n`n### Acceptance Criteria`n- Ping-pong render target setup in EffectComposer.`n- Decay factor slider (0.0 to 0.98).`n- 60 FPS performance."
    Labels = "enhancement,shader"
  },
  @{
    Title = "feat(export): Implement Batch Recording Mode"
    Body = "### Description`nImplement Batch Recording allowing creators to cycle through selected presets automatically during a single video recording session.`n`n### Acceptance Criteria`n- Multi-preset selection checklist in Export modal.`n- Configurable duration per preset (e.g. 10s per preset).`n- Smooth cross-fade transition between presets during recording."
    Labels = "enhancement,export"
  },
  @{
    Title = "feat(export): Implement Aspect Ratio Framing & GIF animated export"
    Body = "### Description`nImplement live canvas aspect ratio framing (16:9, 9:16 vertical TikTok/Reels, 1:1 square) and lightweight animated GIF export.`n`n### Acceptance Criteria`n- Toggleable framing overlays on canvas.`n- Client-side GIF generation with optimized palette."
    Labels = "enhancement,export"
  }
)

Write-Host "Total tickets to create: $($tickets.Count)"

foreach ($t in $tickets) {
  Write-Host "Creating issue: $($t.Title)..."
  & $ghPath issue create --repo $repo --title $t.Title --body $t.Body --label $t.Labels
  Start-Sleep -Milliseconds 600
}

Write-Host "All $($tickets.Count) tickets created successfully!"
