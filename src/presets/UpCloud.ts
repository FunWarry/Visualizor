import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

function blendColor(base: THREE.Color, c1: THREE.Color, c2: THREE.Color, factor = 0.06): THREE.Color {
  const mixed = new THREE.Color().lerpColors(c2, c1, 0.6);
  return new THREE.Color().lerpColors(base, mixed, factor);
}

const CLOUD_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const CLOUD_FRAG = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uCamY;
  uniform float uCloudFloor;
  uniform float uSunGlare;
  uniform float uStepScale;
  uniform float uFastShadow;
  uniform float uSkyCutoff;
  uniform float uBass;

  uniform vec3 uSkyColor;
  uniform vec3 uCloudColor;
  uniform vec3 uCloudShadowColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunGlareColor;
  uniform vec3 uSunlightColor;

  uniform int uMarchSteps1;
  uniform int uMarchSteps2;
  uniform int uMarchSteps3;
  uniform int uMarchSteps4;

  varying vec2 vUv;

  const float constantTime = 1000.0;
  const float cloudGain = 1.9;
  const vec3 sundir = normalize(vec3(-1.0, 0.0, -1.0));

  float hash(float p) {
    p = fract(p * 0.011);
    p *= (p + 7.5);
    p *= (p + p);
    return fract(p);
  }

  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(
      mix(mix(hash(n + 0.0), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
      mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
      f.z
    );
  }

  float map5(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    q *= 2.01;
    f += 0.06250 * noise(q);
    q *= 2.02;
    f += 0.03125 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map4(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    q *= 2.01;
    f += 0.06250 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map3(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map2(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float mapLod(vec3 p, int lod) {
    if (lod == 5) return map5(p);
    if (lod == 4) return map4(p);
    if (lod == 3) return map3(p);
    return map2(p);
  }

  vec4 integrate(vec4 sum, float dif, float den, vec3 bgcol, float t) {
    vec3 lin = uCloudColor * 1.4 + uSunlightColor * dif;
    float shade = clamp(den * 1.05, 0.0, 1.0);
    vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), uCloudShadowColor, shade), den);
    col.xyz *= lin;
    col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
    col.a *= 0.44;
    col.rgb *= col.a;
    return sum + col * (1.0 - sum.a);
  }

  vec4 marchPass(vec4 sum, inout float t, vec3 ro, vec3 rd, vec3 bgcol, int maxSteps, int lod) {
    for (int i = 0; i < 40; i++) {
      if (i >= maxSteps) break;
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;

      float den = mapLod(pos, lod);

      if (den > 0.008) {
        float dif;
        if (uFastShadow > 0.5) {
          dif = clamp(pow(den, 0.72) * 0.95 - den * 0.08, 0.0, 1.0);
        } else {
          dif = clamp((den - mapLod(pos + 0.3 * sundir, lod)) / 0.6, 0.0, 1.0);
        }
        sum = integrate(sum, dif, den, bgcol, t);
      }
      t += max(0.075, 0.02 * t) * uStepScale;
    }
    return sum;
  }

  vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol) {
    vec4 sum = vec4(0.0);
    float t = 0.0;
    if (uMarchSteps1 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps1, 5);
    if (uMarchSteps2 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps2, 4);
    if (uMarchSteps3 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps3, 3);
    if (uMarchSteps4 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps4, 2);
    return clamp(sum, 0.0, 1.0);
  }

  mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
  }

  vec3 skyColor(vec3 rd) {
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);
    vec3 col = uSkyColor - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
    col += 0.2 * uSunColor * pow(sun, 8.0);
    col += 0.2 * uSunGlareColor * pow(sun, 3.0) * uSunGlare;
    return col;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    if (uResolution.y > 0.0) {
      p.x *= uResolution.x / uResolution.y;
    }

    float m_x = 0.125 + sin(uTime * 0.1 + 3.14159265) * 0.25 + 0.25;
    float m_y = uCamY;

    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m_x), 0.4 * m_y, cos(3.0 * m_x)));
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));

    if (rd.y > uSkyCutoff) {
      gl_FragColor = vec4(skyColor(rd), 1.0);
      return;
    }

    vec3 col = skyColor(rd);
    vec4 res = raymarch(ro, rd, col);
    col = col * (1.0 - res.w) + res.xyz;

    col += uSunColor * uBass * 0.2 * smoothstep(0.1, 0.7, res.w);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class UpCloudPreset extends BasePreset {
  public override readonly id = 'upcloud';
  public override readonly name = 'Up Cloud';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Volumetric raymarched sky clouds with silver lining sunlight rim.';
  public override cameraConfig = {
    position: [0, 0, 1] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private cloudMesh!: THREE.Mesh;
  private cloudMaterial!: THREE.ShaderMaterial;

  private readonly baseSky = new THREE.Color(0x78c6df);
  private readonly baseCloud = new THREE.Color(0xc9d8f2);
  private readonly baseShadow = new THREE.Color(0x1b3354);
  private readonly baseSun = new THREE.Color(0xffa24c);
  private readonly baseGlare = new THREE.Color(0xff6633);
  private readonly baseSunlight = new THREE.Color(0xffb06a);

  private speedBoost = 0.0;
  private audioSmooth = 0.0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 0.5 },
      { id: 'cloudHeight', name: 'Cloud Height', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.22 },
      { id: 'sunGlare', name: 'Sun Glare', min: 0.0, max: 2.0, step: 0.1, defaultValue: 0.55 },
      { id: 'reactivity', name: 'Bass Breathing', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const cloudGeom = new THREE.PlaneGeometry(2, 2);

    const prim = new THREE.Color(ctx.theme.primary);
    const sec = new THREE.Color(ctx.theme.secondary);

    this.cloudMaterial = new THREE.ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1920, 1080) },
        uTime: { value: 0 },
        uSpeed: { value: 0.8 },
        uCamY: { value: 0.5374 },
        uCloudFloor: { value: 2.37 },
        uSunGlare: { value: 1.0 },
        uStepScale: { value: 1.0 },
        uFastShadow: { value: 0.0 },
        uSkyCutoff: { value: 0.28 },
        uBass: { value: 0 },
        uSkyColor: { value: blendColor(this.baseSky, prim, sec) },
        uCloudColor: { value: blendColor(this.baseCloud, sec, prim, 0.05) },
        uCloudShadowColor: { value: blendColor(this.baseShadow, prim, sec, 0.04) },
        uSunColor: { value: blendColor(this.baseSun, prim, sec, 0.04) },
        uSunGlareColor: { value: blendColor(this.baseGlare, prim, sec, 0.03) },
        uSunlightColor: { value: blendColor(this.baseSunlight, prim, sec, 0.04) },
        uMarchSteps1: { value: 6 },
        uMarchSteps2: { value: 10 },
        uMarchSteps3: { value: 14 },
        uMarchSteps4: { value: 18 }
      }
    });

    this.cloudMesh = new THREE.Mesh(cloudGeom, this.cloudMaterial);
    this.cloudMesh.frustumCulled = false;
    this.group.add(this.cloudMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const cloudHeight = this.paramStore.getValue('cloudHeight');
    const sunGlare = this.paramStore.getValue('sunGlare');
    const reactivity = this.paramStore.getValue('reactivity');

    const audioTarget = Math.min(0.7, Math.max(0.0, audio.rms * reactivity * 0.5));
    this.audioSmooth += 0.018 * (audioTarget - this.audioSmooth);

    const boostStep = this.audioSmooth > this.speedBoost ? 0.002 : 0.00065;
    this.speedBoost += boostStep * (this.audioSmooth - this.speedBoost);

    const baseSpeed = 0.35 + speed * 0.9;
    const speedFactor = 0.025 + speed * 0.055;
    const finalSpeed = baseSpeed * (1.0 + this.speedBoost * speedFactor);

    const uniforms = this.cloudMaterial.uniforms;
    uniforms.uTime.value = time;
    uniforms.uSpeed.value = finalSpeed;
    uniforms.uCamY.value = (1.0 - cloudHeight) * 0.33 + 0.28;
    uniforms.uCloudFloor.value = 2.18 + cloudHeight * 0.68 - audio.bass * 0.25 * reactivity;
    uniforms.uSunGlare.value = 0.5 + sunGlare * 1.0;
    uniforms.uBass.value = audio.bass * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const prim = new THREE.Color(theme.primary);
    const sec = new THREE.Color(theme.secondary);
    const u = this.cloudMaterial.uniforms;

    u.uSkyColor.value.copy(blendColor(this.baseSky, prim, sec));
    u.uCloudColor.value.copy(blendColor(this.baseCloud, sec, prim, 0.05));
    u.uCloudShadowColor.value.copy(blendColor(this.baseShadow, prim, sec, 0.04));
    u.uSunColor.value.copy(blendColor(this.baseSun, prim, sec, 0.04));
    u.uSunGlareColor.value.copy(blendColor(this.baseGlare, prim, sec, 0.03));
    u.uSunlightColor.value.copy(blendColor(this.baseSunlight, prim, sec, 0.04));
  }

  protected override onDispose(): void {
    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      this.cloudMaterial?.dispose();
    }
  }
}
