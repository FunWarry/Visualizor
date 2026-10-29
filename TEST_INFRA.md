# Visualizor Testing Infrastructure Documentation (TEST_INFRA)

## 1. Architectural Overview

The Visualizor Opaque-Box E2E Testing Infrastructure provides an automated, zero-dependency, ultra-fast testing pipeline executing in Node.js. It features a complete headless emulation environment simulating the Web Audio API, WebGL 2.0 / Three.js capabilities, DOM tree, and Web MIDI API without requiring heavy external browser engines.

### Key Characteristics
- **Execution Speed**: 117 tests across 20 suites execute in under **500 milliseconds**.
- **Zero Flakiness**: Deterministic, self-contained, isolated test contexts with zero race conditions.
- **Progressive Testability & Contract Integrity**: Strict opaque-box validation against the interface contracts defined in `PROJECT.md` and `visuval_gap_analysis.md`.
- **Zero Defect Quality Gate**: 100% compliant with SonarLint / SonarQube strict typing and `npx tsc --noEmit`.

---

## 2. Directory Layout & Organization

```
tests/
├── tsconfig.json                      # TypeScript configuration for tests directory
├── runner.ts                          # Comprehensive test runner collecting and running all suites
├── runner.cjs                         # Executable CommonJS/ESM CLI wrapper (`node tests/runner.cjs`)
├── harness/
│   ├── env.ts                         # Headless DOM, WebGL (Proxy-backed), Web Audio & Web MIDI mocks
│   ├── test-context.ts                # Matcher framework (describe, it, test, expect, runAllSuites)
│   ├── contracts.ts                   # Canonical interface contracts, math models, and validators
│   └── fixtures.ts                    # AudioFeatures, themes, and SpyVisualizerPreset fixtures
├── tier1-features/                    # Tier 1: Feature Coverage (>=5 tests per feature)
│   ├── themes.test.ts                 # Ticket #39: 28 Color Themes
│   ├── rail.test.ts                   # Ticket #40: 15-Tool Navigation Rail
│   ├── tuning.test.ts                 # Ticket #41: Preset Fine-Tuning Controls
│   ├── camera.test.ts                 # Ticket #42: Camera & 3D Viewpoints
│   ├── overlay.test.ts                # Ticket #43: Text & Typography Overlays
│   ├── studio.test.ts                 # Ticket #44: Studio Forge & Recipe Builder
│   ├── midi.test.ts                   # Ticket #45: Web MIDI Controller Mapping
│   ├── presets.test.ts                # Ticket #38: 71-Preset Catalog & Lifecycle
│   └── audio-dsp.test.ts              # Core Audio DSP, multi-band FFT & BPM Engine
├── tier2-boundaries/                  # Tier 2: Boundary & Corner Cases (>=5 tests per feature)
│   ├── themes-boundary.test.ts        # Rapid switching, malformed hex, saturation limits
│   ├── rail-boundary.test.ts          # Rapid toggle, mobile viewport, missing DOM elements
│   ├── tuning-boundary.test.ts        # Out-of-bounds slider, NaN fallback, step snapping
│   ├── camera-boundary.test.ts        # Zenith/nadir poles, zoom limits, extreme kick shake
│   ├── overlay-boundary.test.ts       # Empty string, 2000-char clamp, unicode, script injection
│   ├── studio-boundary.test.ts        # Negative Force attraction, zero density, invalid recipes
│   ├── midi-boundary.test.ts          # Truncated MIDI packets, unmapped CCs, 100-event bursts
│   ├── presets-boundary.test.ts       # Double dispose, zero canvas resize, extreme delta time
│   └── audio-boundary.test.ts         # Prolonged silence, max clipping, rapid tap, mic denial
├── tier3-combinations/                # Tier 3: Cross-Feature Combinations (>=10 tests)
│   └── combinations.test.ts           # Theme + camera orbit, preset switch + MIDI CC, text + kick
└── tier4-scenarios/                   # Tier 4: Real-World Application Scenarios (>=5 scenarios)
    └── scenarios.test.ts              # Live DJ performance, music video recording, studio tuning
```

---

## 3. Test Tiers Specification

### Tier 1: Feature Coverage (48 tests)
- **Themes (#39)**: 28 canonical theme catalog verification, contract shape validation, `getTheme()` resolution, fallback mechanisms, `RenderEngine.setTheme()` background updates and preset notification.
- **UI Rail Tools (#40)**: 15-tool inventory declaration, active state pill styling, toggling drawer opening and closing, switching active panels, hide UI chrome mode, responsive height detents.
- **Preset Fine-Tuning (#41)**: Parameter definition schemas, parameter range clamping, collapsed drawer fallback for non-tunable presets, ignoring unknown IDs, parameter state persistence.
- **Camera & 3D Viewpoints (#42)**: Spherical coordinates orbit and tilt, `[-PI/2, PI/2]` tilt limits avoiding gimbal lock, vertical zoom distance mapping, continuous auto-rotation, beat kick camera impulse decay.
- **Text & Typography Overlays (#43)**: 3-line independent text layers, 9-point anchor matrix, typography font and color models, 5 animation modes, whitespace sanitization and length clamping.
- **Studio Forge & Recipe Builder (#44)**: 5 Engine Families (`Chroma`, `Liquid`, `Tunnel`, `Volume`, `The Force`), multi-layer stage initialization, recipe JSON serialization, title validation, real-time stage uniform modulation, clean disposal.
- **Web MIDI Controller Mapping (#45)**: Device enumeration via `navigator.requestMIDIAccess()`, CC byte parsing `0xB0`, MIDI Learn mode, default CC routing table, Note-On zero velocity normalization, parameter dispatch.
- **Presets Catalog & Lifecycle (#38)**: 38+ presets categorized into 7 genres, `init()` mesh population, `update()` 60 FPS animation loop, `onThemeChange()` material updates, `dispose()` memory cleanup.
- **Audio DSP Engine**: Multi-band FFT normalized band extraction, RMS amplitude calculation, `BeatDetector` thresholding and exponential energy decay, `BPMDetector` interval median, tap tempo, playlist queue management.

### Tier 2: Boundary & Corner Cases (46 tests)
- **Themes Boundaries**: 50 rapid sequential theme switches, invalid/null/numeric IDs fallback, 3-digit and 6-digit hex parsing, pure black/white boundary palettes, color saturation modulation at 0% (grayscale) and 100% (gamut).
- **UI Rail Boundaries**: Rapid open/close toggling (30 iterations), missing DOM panel elements handling, sequential hopping across all 15 tools leaving only last tool open, extreme mobile viewport (320x480), double-click drawer closing.
- **Preset Tuning Boundaries**: NaN and Infinity inputs fallback to schema defaults, extreme values (-100,000 to +100,000) strictly clamped within min/max, step resolution snapping, unknown and empty parameter IDs ignored, full parameter reset.
- **Camera Boundaries**: Pole zenith (+PI/2) and nadir (-PI/2) angle calculation without NaN or division by zero, extreme zoom slider values (<0, >1, NaN) clamped, speed 0.0 camera holding, maximum audio kick shake displacement capped.
- **Text Overlay Boundaries**: Whitespace-only, tabs, newlines, and null bytes sanitize and disable line, 2000-character input clamped to 200 characters, unicode/emojis/math symbols preserved, HTML/script tag injection treated as literal text, font size clamped [8px, 120px], max canvas texture dimensions respected.
- **Studio Forge Boundaries**: Negative The Force attraction (-2.0 repulsion mode) maintains stable physics velocity, zero volume density avoids division by zero, all stage sliders at maximum 2.0 execute without overflow, empty title recipe rejected, corrupted JSON discarded safely, mode switch unsaved changes confirmation.
- **Web MIDI Boundaries**: Truncated/empty MIDI byte arrays return null safely, out-of-bounds CC values (>127, <0) clamped, unmapped CCs ignored, 100-event rapid bursts processed sequentially, learn mode cancellation preserves existing bindings, MIDI channel nibble extraction across channels 1-16.
- **Preset Lifecycle Boundaries**: Double call to `dispose()` idempotent without errors, zero audio features update executes smoothly, extreme delta time (10 seconds) clamped preventing physics explosion, rapid switching across 10 presets leaves zero lingering meshes, zero canvas resize handled safely.
- **Audio DSP Boundaries**: Complete silence produces zero energies without NaN, maximum clipping amplitude clamps RMS cleanly to 1.0, sudden volume transition from prolonged silence triggers kick, tap tempo frequencies >300 BPM filtered, empty playlist queue operations handled safely, microphone permission denial simulation returns false gracefully.

### Tier 3: Cross-Feature Combinations (10 tests)
1. Theme switch during camera auto-orbit updates material colors while camera position actively rotates.
2. Preset switch during active MIDI CC modulation applies incoming CC parameter updates to newly mounted preset.
3. Text overlay pulse animation dynamically scales proportionally with `AudioEngine` beat kicks and bass energy.
4. Studio Forge stage parameter modulation combined with theme color change and camera shake.
5. Microphone streaming driving multi-band FFT, beat detector, camera shake kick, and post-processing bloom.
6. Playlist track change triggering BPM detection, theme harmonization, and preset auto-cycle.
7. UI rail drawer toggling while camera auto-orbit renders active frames without pointer event interference.
8. MIDI CC modulating audio sensitivity while simultaneously modulating post-processing chromatic aberration.
9. Motion persistence feedback ping-pong buffer swap during rapid preset switching maintaining render target integrity.
10. Aspect ratio framing guide change (16:9 -> 9:16 -> 1:1) with camera aspect ratio resize and high-res screenshot capture.

### Tier 4: Real-World Application Scenarios (5 scenarios)
1. **Live DJ Club Performance Simulation**: Full 60-frame live performance simulation with live microphone input, 128 BPM tap tempo calibration, MIDI CC knobs assigned to Volume and Bloom, 'Synthwave' theme, 'SynthwaveTerrain' preset, auto-orbit camera, and bass drop kick transients.
2. **Music Video Production & Recording Workflow**: 16:9 4K framing configuration, 3-line animated typography overlay (Title, Artist, Lyrics), 'Sunset' theme with high bloom and film grain post-processing, automated preset cycling ('AuroraMandala' -> 'BlackHole' -> 'NeonTunnel'), and frame capture.
3. **Studio Forge Custom Recipe Tuning Session**: Launching Studio stage composer, tuning 5 engine layers (The Force repulsion physics -1.2, deep tunnel 1.8, liquid warp 1.6, volume density 1.4), rendering live stage simulation, saving recipe to registry, switching away to another preset, and restoring the custom recipe with exact uniform preservation.
4. **Live Club Visuals with MIDI Learn and Fast Preset Hopping**: Activating MIDI Learn on `bloomStrength`, learning CC #14, hopping rapidly across 10 distinct presets with random themes, continuously modulating bloom and speed via MIDI, and verifying zero WebGL resource leaks.
5. **Stress Resilience & Ambient Mode Transition**: Entering Zen / Ambient mode (hiding UI overlays), streaming bursty noisy audio with silence spikes, rapid aspect ratio transitions across ultrawide (21:9), mobile (9:16), and standard (16:9), and exiting ambient mode with full UI and audio state intact.

---

## 4. How to Execute Tests

### CLI Command
```powershell
node tests/runner.cjs
```

### Typecheck Verification
```powershell
npx tsc -p tests/tsconfig.json --noEmit
```

### Quality Gate Verification
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npx tsc --noEmit
npm run sonar
npm run build
```
