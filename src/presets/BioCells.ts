import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uSize;
  uniform float uBass;
  uniform int uWorleyRadius;

  float length2(vec2 p) { return dot(p, p); }

  float hash21(vec2 p) {
    return fract(sin(fract(sin(p.x) * 43.13311) + p.y) * 31.0011);
  }

  float worley(vec2 p) {
    float d = 1e30;
    int r = uWorleyRadius;
    for (int xo = -1; xo <= 1; ++xo) {
      if (abs(xo) > r) continue;
      for (int yo = -1; yo <= 1; ++yo) {
        if (abs(yo) > r) continue;
        vec2 tp = floor(p) + vec2(float(xo), float(yo));
        d = min(d, length2(p - tp - vec2(hash21(tp))));
      }
    }
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float timeOffset = 0.15 * sin(uTime * uSpeed * 2.0 + 10.0 * (uv.x - uv.y) + uBass * 0.2);
    return 3.0 * exp(-4.0 * abs(2.0 * d - 1.0 + timeOffset));
  }

  float fworley(vec2 p) {
    float t = uTime * uSpeed;
    return sqrt(sqrt(sqrt(
      1.1 *
      worley(p * 5.0 + 0.3 + t * 0.0525) *
      sqrt(worley(p * 50.0 / uSize + 0.3 + t * -0.15)) *
      sqrt(sqrt(worley(p * -10.0 + 9.3)))
    )));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float t = fworley(uv * uResolution.xy / 1500.0);
    t *= exp(-length2(abs(0.7 * uv - 1.0)));

    float tExp = pow(t, 0.5 - t);
    vec3 c1 = uColor1 * (1.0 - t);
    vec3 c2 = uColor2 * tExp;

    gl_FragColor = vec4(pow(t, 1.0 - t) * (c1 + c2), 1.0);
  }
`;

function getLuminanceAdjustedThemeColors(theme: VisualizerTheme): { color1: THREE.Color; color2: THREE.Color } {
  const c1 = new THREE.Color(theme.primary);
  const c2 = new THREE.Color(theme.secondary);
  const lum = 0.299 * c1.r + 0.587 * c1.g + 0.114 * c1.b;
  const factor = lum > 0.5 ? 0.38 : (lum > 0.28 ? 0.52 : 0.68);
  return {
    color1: new THREE.Color(c1.r * factor + 0.018, c1.g * factor + 0.02, c1.b * factor + 0.028),
    color2: c2
  };
}

export class BioCellsPreset extends BasePreset {
  public override readonly id = 'biocells';
  public override readonly name = 'Bio Cells';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Multi-scale Worley noise biological cell membranes with organic mitosis.';
  public override cameraConfig = {
    position: [0, 0, 1] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private audioSmoothBass = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Mitosis Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Membrane Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Cell Scale', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.35 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const { color1, color2 } = getLuminanceAdjustedThemeColors(ctx.theme);
    const geom = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth || 1920, window.innerHeight || 1080) },
        uTime: { value: 0 },
        uSpeed: { value: 0.95 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uSize: { value: 1.35 },
        uBass: { value: 0 },
        uWorleyRadius: { value: 1 }
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthWrite: false,
      depthTest: false
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    if (!this.material) return;

    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const cellSize = this.paramStore.getValue('density');

    const targetBass = audio.bass * reactivity;
    this.audioSmoothBass += 0.045 * (targetBass - this.audioSmoothBass);

    const uniforms = this.material.uniforms;
    uniforms.uTime.value = time;
    uniforms.uSpeed.value = 0.475 * 2.0 * speed;
    uniforms.uSize.value = cellSize * (1.0 + this.audioSmoothBass * 0.08);
    uniforms.uBass.value = this.audioSmoothBass;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    if (!this.material) return;
    const { color1, color2 } = getLuminanceAdjustedThemeColors(theme);
    this.material.uniforms.uColor1.value.copy(color1);
    this.material.uniforms.uColor2.value.copy(color2);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.audioSmoothBass = 0;
  }
}
