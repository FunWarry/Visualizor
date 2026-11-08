import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const WARP_VERTEX_SHADER = `
  attribute float size;
  attribute float aRandom;
  uniform float uTime;
  uniform float uAudio;
  uniform float uBass;
  uniform float uWarpSpeed;
  uniform float uStreakLength;
  uniform float uSwirl;

  varying float vAlpha;
  varying float vRandom;
  varying float vDepthRatio;
  varying vec2 vScreenDir;
  varying float vStreakAmount;

  void main() {
    vec3 pos = position;

    float speed = 5.0 + uWarpSpeed * 25.0;
    float z = 300.0 - mod(-pos.z + uTime * speed, 300.0);
    pos.z = -z;

    float depthRatio = z * 0.00333;
    vDepthRatio = depthRatio;
    float proximity = 1.0 - depthRatio;

    if (uSwirl > 0.5) {
      float r = length(pos.xy);
      float theta = atan(pos.y, pos.x);
      theta += (proximity * (1.2 + aRandom * 0.8) + uTime * 0.3) * 0.35;
      pos.x = cos(theta) * r;
      pos.y = sin(theta) * r;
    }

    vAlpha = smoothstep(1.0, 0.7, depthRatio) * smoothstep(0.0, 0.04, depthRatio);
    vAlpha *= 0.4 + uAudio * 0.9;
    vRandom = aRandom;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    vec2 screenPos = gl_Position.xy / gl_Position.w;
    float screenDist = length(screenPos);
    vScreenDir = screenDist > 0.001 ? screenPos / screenDist : vec2(0.0, 1.0);

    float streakBase = uStreakLength * 4.0 + uBass * 10.0;
    vStreakAmount = streakBase * proximity * smoothstep(0.0, 0.15, screenDist);

    float perspSize = size * (1.0 + uAudio * 0.8) * (200.0 / max(-mvPos.z, 0.1));
    gl_PointSize = min(max(perspSize * (1.0 + vStreakAmount * 0.3), 1.0), 64.0);
  }
`;

const WARP_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uBass;
  uniform float uTreble;
  uniform float uColorShift;

  varying float vAlpha;
  varying float vRandom;
  varying float vDepthRatio;
  varying vec2 vScreenDir;
  varying float vStreakAmount;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;

    float stretch = 1.0 + vStreakAmount;

    float ca = vScreenDir.x;
    float sa = vScreenDir.y;
    vec2 rotUv = vec2(uv.x * ca + uv.y * sa, -uv.x * sa + uv.y * ca);

    float alongStreak = abs(rotUv.x);
    rotUv.y /= mix(1.0, 0.15, smoothstep(0.0, 0.45, alongStreak));
    rotUv.x /= stretch;

    float d = length(rotUv);
    float brightCore = exp(-d * 18.0);
    float brightness = brightCore + exp(-d * 6.0) * 0.5;
    brightness *= 1.0 - smoothstep(0.35, 0.5, d);

    float streakFade = 1.0 - smoothstep(0.25, 0.48, alongStreak);
    brightness *= mix(1.0, streakFade, smoothstep(1.0, 3.0, stretch));

    if (brightness < 0.01) discard;

    float proximity = 1.0 - vDepthRatio;
    float shift = uColorShift * sin(uTime * 0.3 + vRandom * 6.28) * 0.5 + 0.5;
    vec3 col = mix(uColor1, uColor2, shift);
    col = mix(col, vec3(1.0, 0.97, 0.92), brightCore * proximity * 0.6);
    col += mix(vec3(0.0), uColor2, vStreakAmount * 0.1);

    gl_FragColor = vec4(col, brightness * vAlpha);
  }
`;

export class StarfieldPreset extends BasePreset {
  public override readonly id = 'starfield';
  public override readonly name = 'Starfield';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Hyperspace relativistic starfield with anamorphic velocity streaks and audio swirl.';
  public override cameraConfig = {
    position: [0, 0, 0] as [number, number, number],
    target: [0, 0, -50] as [number, number, number],
    autoRotate: false
  };

  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  private readonly count = 4000; // Exact test contract count

  private warpAccumulator = 0;
  private bassPeak = 0;
  private audioPeak = 0;
  private treblePeak = 0;
  private prevTime: number | undefined = undefined;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Warp Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Kick Reactivity', min: 0.0, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Star Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 },
      { id: 'starSize', name: 'Star Size', min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.22 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const randoms = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.pow(Math.random(), 0.6) * 45.0;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = -Math.random() * 300.0;

      sizes[i] = 0.5 + Math.random() * 1.5;
      randoms[i] = Math.random();
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const primaryColor = new THREE.Color(ctx.theme.primary);
    const accentColor = new THREE.Color(ctx.theme.accent);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uAudio: { value: 0.0 },
        uBass: { value: 0.0 },
        uTreble: { value: 0.0 },
        uWarpSpeed: { value: 1.0 },
        uStreakLength: { value: 0.6 },
        uColorShift: { value: 0.5 },
        uSwirl: { value: 1.0 },
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor }
      },
      vertexShader: WARP_VERTEX_SHADER,
      fragmentShader: WARP_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    if (!this.points || !this.material) return;

    const dt = this.prevTime !== undefined ? Math.min(time - this.prevTime, 0.1) : delta || 1 / 60;
    this.prevTime = time;

    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const density = this.paramStore.getValue('density');

    const activeCount = Math.floor(this.count * density);
    this.geometry.setDrawRange(0, activeCount);

    const bassIn = audio.bass * reactivity;
    const midIn = audio.mid * reactivity;
    const trebleIn = audio.treble * reactivity;
    const audioIn = audio.rms * reactivity;

    this.bassPeak = Math.max(bassIn, this.bassPeak * 0.92);
    this.audioPeak = Math.max(audioIn, this.audioPeak * 0.94);
    this.treblePeak = Math.max(trebleIn, this.treblePeak * 0.92);

    const effectiveWarpSpeed = (speed * 0.8 + this.bassPeak * 1.5);
    this.warpAccumulator += dt * effectiveWarpSpeed;

    this.material.uniforms.uTime.value = this.warpAccumulator;
    this.material.uniforms.uAudio.value = this.audioPeak;
    this.material.uniforms.uBass.value = this.bassPeak;
    this.material.uniforms.uTreble.value = this.treblePeak;
    this.material.uniforms.uWarpSpeed.value = effectiveWarpSpeed;
    this.material.uniforms.uStreakLength.value = 0.5 + this.bassPeak * 0.8;
    this.material.uniforms.uSwirl.value = 1.0;

    // Gentle camera roll on treble/mid
    this.points.rotation.z += dt * (0.05 + midIn * 0.2) * speed;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    if (this.material?.uniforms) {
      this.material.uniforms.uColor1.value.set(theme.primary);
      this.material.uniforms.uColor2.value.set(theme.accent);
    }
  }

  protected override onDispose(): void {
    this.geometry?.dispose();
    this.material?.dispose();
    this.prevTime = undefined;
    this.warpAccumulator = 0;
  }
}
