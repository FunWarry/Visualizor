import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const BAR_RINGS = [
  { count: 16, radius: 3.0 },
  { count: 24, radius: 5.0 },
  { count: 36, radius: 7.5 },
  { count: 48, radius: 10.0 },
  { count: 60, radius: 12.5 },
  { count: 72, radius: 15.0 }
];

const TOTAL_BARS = 256; // Exactly 256 columns to satisfy instanced mesh contract

const BARS_VERTEX_SHADER = `
  attribute float aGlow;
  attribute float aEnergy;
  attribute float aRingNorm;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vGlow;
  varying float vEnergy;
  varying float vRingNorm;

  void main() {
    vPosition = position;
    vGlow = aGlow;
    vEnergy = aEnergy;
    vRingNorm = aRingNorm;

    mat4 mvInstance = modelViewMatrix * instanceMatrix;
    vNormal = normalize(transpose(inverse(mat3(mvInstance))) * normal);

    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;

    gl_Position = projectionMatrix * mvInstance * vec4(position, 1.0);
  }
`;

const BARS_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uBarGlow;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vGlow;
  varying float vEnergy;
  varying float vRingNorm;

  void main() {
    float t = vPosition.y + 0.5;
    vec3 innerCol = mix(uColor1, uColor2, t);
    vec3 outerCol = mix(uColor2, uColor1 * 0.6 + uColor2 * 1.4, t);
    vec3 baseColor = mix(innerCol, outerCol, vRingNorm);

    vec3 hotColor = mix(baseColor, vec3(1.0, 0.95, 0.85), vEnergy * 0.25);

    float scanSpeed = 3.0 + vEnergy * 5.0;
    float scanPos = fract(uTime * scanSpeed * 0.1);
    float scan = smoothstep(scanPos - 0.15, scanPos, t) * smoothstep(scanPos + 0.15, scanPos, t);
    hotColor += uColor2 * scan * 0.6 * vGlow * (0.2 + uBarGlow * 0.5);

    float stream = sin(vPosition.x * 25.0 + uTime * 8.0) * sin(vPosition.z * 25.0 - uTime * 6.0);
    stream = smoothstep(0.7, 1.0, stream);
    hotColor += uColor2 * stream * 0.15 * vEnergy;

    float topGlow = smoothstep(0.5, 0.95, t);
    hotColor += uColor2 * topGlow * vGlow * 0.5 * (0.2 + uBarGlow * 0.5);

    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
    hotColor += uColor2 * fresnel * (0.15 + vEnergy * 0.3) * (0.2 + uBarGlow * 0.5);

    float radius = length(vPosition.xz) / 0.4;
    float edgeGlow = smoothstep(0.6, 1.0, radius);
    hotColor += uColor2 * edgeGlow * 0.15 * (0.2 + uBarGlow * 0.5);

    gl_FragColor = vec4(hotColor, 1.0);
  }
`;

const CORE_VERTEX_SHADER = `
  uniform float uPulse;
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position * uPulse;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const CORE_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uBass;
  uniform float uAudio;
  varying vec3 vNormal;

  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 col = mix(uColor1, uColor2, 0.45 + fresnel * 0.35);
    col += uColor2 * fresnel * (0.35 + uBass * 0.5);
    col *= 0.75 + uAudio * 0.45;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface BarDatum {
  ringNorm: number;
  angle: number;
  baseRadius: number;
  targetHeight: number;
  currentHeight: number;
  currentTwist: number;
}

export class ThreeDBarsPreset extends BasePreset {
  public override readonly id = 'bars3d';
  public override readonly name = '3D Bars';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Concentric cybernetic rings of hexagonal audio pillars with pulsating energy core.';
  public override cameraConfig = {
    position: [0, 14, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };

  private instancedMesh!: THREE.InstancedMesh;
  private barGeometry!: THREE.CylinderGeometry;
  private barMaterial!: THREE.ShaderMaterial;
  private coreMesh!: THREE.Mesh;
  private coreGeometry!: THREE.SphereGeometry;
  private coreMaterial!: THREE.ShaderMaterial;

  private barGlowAttr!: THREE.InstancedBufferAttribute;
  private barEnergyAttr!: THREE.InstancedBufferAttribute;
  private barRingNormAttr!: THREE.InstancedBufferAttribute;

  private readonly barData: BarDatum[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly tmpLookTarget = new THREE.Vector3();

  private prevBass = 0;
  private explosionForce = 0;
  private flashIntensity = 0;
  private kickPulse = 0;
  private lastTime: number | undefined = undefined;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Column Spacing', min: 0.5, max: 1.5, step: 0.05, defaultValue: 0.8 },
      { id: 'reactivity', name: 'Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'deformation', name: 'Column Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Grid Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.lastTime = undefined;
    this.barData.length = 0;

    // Hexagonal prism column (radius 0.35, height 1.0, 6 segments)
    this.barGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 6);

    BAR_RINGS.forEach((ring, ringIdx) => {
      const ringNorm = ringIdx / (BAR_RINGS.length - 1);
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        this.barData.push({
          ringNorm,
          angle,
          baseRadius: ring.radius,
          targetHeight: 1.0,
          currentHeight: 0.1,
          currentTwist: 0.0
        });
      }
    });

    const glowArray = new Float32Array(TOTAL_BARS);
    const energyArray = new Float32Array(TOTAL_BARS);
    const ringNormArray = new Float32Array(TOTAL_BARS);

    for (let i = 0; i < TOTAL_BARS; i++) {
      ringNormArray[i] = this.barData[i].ringNorm;
    }

    this.barGlowAttr = new THREE.InstancedBufferAttribute(glowArray, 1);
    this.barEnergyAttr = new THREE.InstancedBufferAttribute(energyArray, 1);
    this.barRingNormAttr = new THREE.InstancedBufferAttribute(ringNormArray, 1);

    this.barGeometry.setAttribute('aGlow', this.barGlowAttr);
    this.barGeometry.setAttribute('aEnergy', this.barEnergyAttr);
    this.barGeometry.setAttribute('aRingNorm', this.barRingNormAttr);

    const primaryColor = new THREE.Color(ctx.theme.primary);
    const accentColor = new THREE.Color(ctx.theme.accent);

    this.barMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor },
        uBarGlow: { value: 0.5 },
        uTime: { value: 0.0 }
      },
      vertexShader: BARS_VERTEX_SHADER,
      fragmentShader: BARS_FRAGMENT_SHADER,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    this.instancedMesh = new THREE.InstancedMesh(this.barGeometry, this.barMaterial, TOTAL_BARS);
    this.instancedMesh.count = TOTAL_BARS;
    this.instancedMesh.frustumCulled = false;
    this.group.add(this.instancedMesh);

    // Central pulsing sphere core
    this.coreGeometry = new THREE.SphereGeometry(1.35, 32, 32);
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor },
        uBass: { value: 0.0 },
        uAudio: { value: 0.0 },
        uPulse: { value: 1.0 }
      },
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    this.coreMesh = new THREE.Mesh(this.coreGeometry, this.coreMaterial);
    this.coreMesh.frustumCulled = false;
    this.coreMesh.position.y = 1.4;
    this.group.add(this.coreMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    if (!this.instancedMesh || !this.coreMesh) return;

    const dt = this.lastTime !== undefined ? Math.min(time - this.lastTime, 0.1) : delta || 1 / 60;
    this.lastTime = time;

    const lerpFactor = 0.15 * (dt * 60);
    const reactivity = this.paramStore.getValue('reactivity');
    const heightScale = this.paramStore.getValue('deformation');
    const spacing = this.paramStore.getValue('speed');
    const density = this.paramStore.getValue('density');

    const scaledBass = audio.bass * reactivity;
    const scaledMid = audio.mid * reactivity;
    const scaledTreble = audio.treble * reactivity;
    const scaledAvg = audio.rms * reactivity;

    // Transient kick impact detection
    if (scaledBass > this.prevBass + 0.15 && scaledBass > 0.35) {
      if (scaledBass > 0.5) {
        this.explosionForce = Math.min(1.0, (scaledBass - 0.5) * 3.0);
      }
      this.flashIntensity = Math.min(scaledBass * 1.5, 1.0);
    }
    this.prevBass = scaledBass;
    this.explosionForce *= 0.92;
    if (this.explosionForce < 0.01) this.explosionForce = 0;
    this.flashIntensity *= 0.88;

    this.kickPulse = audio.beat ? 1.0 : this.kickPulse * 0.9;

    this.barMaterial.uniforms.uTime.value = time;
    this.barMaterial.uniforms.uBarGlow.value = 0.5 * reactivity;

    const activeCount = density >= 1.0 ? TOTAL_BARS : Math.max(1, Math.floor(TOTAL_BARS * density));
    this.instancedMesh.count = activeCount;

    this.updateBarInstances(audio, time, lerpFactor, reactivity, heightScale, spacing, scaledBass, scaledMid, scaledTreble);

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.barGlowAttr.needsUpdate = true;
    this.barEnergyAttr.needsUpdate = true;

    // Organic cybernetic drift
    this.group.rotation.y = Math.sin(time * 0.12) * 0.2;
    this.group.rotation.x = Math.sin(time * 0.08) * 0.015 * scaledBass;

    // Core sphere update
    this.coreMaterial.uniforms.uBass.value = scaledBass;
    this.coreMaterial.uniforms.uAudio.value = scaledAvg;
    this.coreMaterial.uniforms.uPulse.value = 1.0 + this.flashIntensity * 1.5;
    this.coreMesh.rotation.y = time * 0.35 + scaledBass * 0.25;
    this.coreMesh.position.y = 1.4 + Math.sin(time * 1.8) * 0.12 * scaledBass + this.kickPulse * 1.2;
  }

  private updateBarInstances(
    audio: AudioFeatures,
    time: number,
    lerpFactor: number,
    reactivity: number,
    heightScale: number,
    spacing: number,
    scaledBass: number,
    scaledMid: number,
    scaledTreble: number
  ): void {
    const glowArr = this.barGlowAttr.array as Float32Array;
    const energyArr = this.barEnergyAttr.array as Float32Array;
    const freqLength = audio.frequencyData.length;

    for (let i = 0; i < TOTAL_BARS; i++) {
      const datum = this.barData[i];
      const ringNorm = datum.ringNorm;

      const bandEnergy = (scaledBass * (1.0 - ringNorm) + scaledMid * 0.5 + scaledTreble * ringNorm);
      const freqIdx = Math.floor((i / TOTAL_BARS) * Math.min(63, freqLength - 1));
      const rawFreq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      const barEnergy = (rawFreq * reactivity * 0.5 + bandEnergy * 0.5) * 0.55;
      datum.targetHeight = (0.5 + barEnergy * 18.0) * heightScale;
      datum.currentHeight += (datum.targetHeight - datum.currentHeight) * lerpFactor;

      const h = Math.max(0.1, datum.currentHeight);
      const glowVal = Math.min(1.0, barEnergy * 1.5);
      const twistTarget = barEnergy * 0.8 + scaledBass * 0.4;
      datum.currentTwist += (twistTarget - datum.currentTwist) * lerpFactor * 0.5;

      const spacingScale = 0.7 + spacing * 0.6;
      const explosionPush = this.explosionForce * (1.0 + ringNorm * 0.5) * 2.5;
      const currentRadius = datum.baseRadius * spacingScale + explosionPush;

      const posX = Math.cos(datum.angle) * currentRadius;
      const posZ = Math.sin(datum.angle) * currentRadius;
      const undulation = Math.sin(time * 2.0 + i * 0.15) * 0.3 * scaledMid;
      const posY = h * 0.5 + undulation;

      this.dummy.position.set(posX, posY, posZ);
      this.dummy.scale.set(1.0, h, 1.0);

      const centerDist = Math.hypot(posX, posZ);
      if (centerDist < 0.0001) {
        this.dummy.quaternion.identity();
      } else {
        this.tmpLookTarget.set(0, posY, 0);
        this.dummy.lookAt(this.tmpLookTarget);
      }
      this.dummy.rotation.y += datum.currentTwist;
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      glowArr[i] = barEnergy;
      energyArr[i] = glowVal;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const primary = new THREE.Color(theme.primary);
    const accent = new THREE.Color(theme.accent);

    if (this.barMaterial?.uniforms) {
      this.barMaterial.uniforms.uColor1.value.copy(primary);
      this.barMaterial.uniforms.uColor2.value.copy(accent);
    }
    if (this.coreMaterial?.uniforms) {
      this.coreMaterial.uniforms.uColor1.value.copy(primary);
      this.coreMaterial.uniforms.uColor2.value.copy(accent);
    }
  }

  public override dispose(): void {
    this.barGeometry?.dispose();
    this.barMaterial?.dispose();
    this.coreGeometry?.dispose();
    this.coreMaterial?.dispose();
    this.barData.length = 0;
    this.prevBass = 0;
    this.explosionForce = 0;
    this.flashIntensity = 0;
    this.kickPulse = 0;
    this.lastTime = undefined;
    super.dispose();
  }
}
