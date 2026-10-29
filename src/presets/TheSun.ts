import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class TheSunPreset implements VisualizerPreset {
  id = 'the-sun';
  name = 'The Sun';
  category = 'Abstract & Space' as const;
  description = 'Solar corona with turbulent flares, pulsating prominence loops and radiant energy.';

  private group!: THREE.Group;
  private coreMesh!: THREE.Mesh;
  private coronaMesh!: THREE.Mesh;
  private flarePoints!: THREE.Points;
  private coreMaterial!: THREE.ShaderMaterial;
  private coronaMaterial!: THREE.ShaderMaterial;
  private flareMaterial!: THREE.PointsMaterial;
  private flarePositions!: Float32Array;
  private flareBaseRadius!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Fiery core with custom vertex displacement & turbulent noise shader
    const coreGeom = new THREE.IcosahedronGeometry(2.5, 4);
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          vNormal = normal;
          vPosition = position;
          
          float noise = sin(position.x * 4.0 + uTime * 2.0) 
                      * cos(position.y * 4.0 + uTime * 2.5) 
                      * sin(position.z * 4.0 + uTime * 3.0);
          
          float disp = 1.0 + (noise * 0.15 * (1.0 + uBass * 1.5));
          vDisplacement = noise;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * disp, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          float heat = clamp(0.5 + vDisplacement * 0.5 + uBass * 0.4, 0.0, 1.0);
          vec3 col = mix(uColor1, uColor2, heat);
          col += vec3(1.0, 0.9, 0.5) * pow(heat, 3.0) * (0.8 + uBass);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    // 2. Solar corona outer atmosphere
    const coronaGeom = new THREE.SphereGeometry(3.6, 32, 32);
    this.coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uCoronaColor: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCoronaColor;
        uniform float uEnergy;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(uCoronaColor, intensity * (0.6 + uEnergy * 0.8));
        }
      `
    });
    this.coronaMesh = new THREE.Mesh(coronaGeom, this.coronaMaterial);
    this.group.add(this.coronaMesh);

    // 3. Solar flare particle prominence
    const flareCount = 1500;
    const flareGeom = new THREE.BufferGeometry();
    this.flarePositions = new Float32Array(flareCount * 3);
    this.flareBaseRadius = new Float32Array(flareCount);

    for (let i = 0; i < flareCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 2.6 + Math.random() * 2.8;
      this.flareBaseRadius[i] = rad;

      this.flarePositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      this.flarePositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      this.flarePositions[i * 3 + 2] = rad * Math.cos(phi);
    }
    flareGeom.setAttribute('position', new THREE.BufferAttribute(this.flarePositions, 3));

    this.flareMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.flarePoints = new THREE.Points(flareGeom, this.flareMaterial);
    this.group.add(this.flarePoints);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.y += delta * 0.2;
    this.group.rotation.x += delta * 0.08;

    this.coreMaterial.uniforms.uTime.value = time;
    this.coreMaterial.uniforms.uBass.value = audio.bass;

    this.coronaMaterial.uniforms.uTime.value = time;
    this.coronaMaterial.uniforms.uEnergy.value = audio.mid + audio.beatEnergy * 0.6;

    // Flares pulsate outward with mid & treble energy
    const pos = (this.flarePoints.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const pulse = 1.0 + audio.treble * 0.5 + (audio.beat ? 0.4 : 0);

    for (let i = 0; i < this.flareBaseRadius.length; i++) {
      const idx = i * 3;
      const bx = this.flarePositions[idx];
      const by = this.flarePositions[idx + 1];
      const bz = this.flarePositions[idx + 2];

      const flareWobble = Math.sin(time * 4.0 + i) * 0.15 * audio.mid;
      pos[idx] = bx * (pulse + flareWobble);
      pos[idx + 1] = by * (pulse + flareWobble);
      pos[idx + 2] = bz * (pulse + flareWobble);
    }
    this.flarePoints.geometry.attributes.position.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.coreMaterial.uniforms.uColor1.value.set(theme.primary);
    this.coreMaterial.uniforms.uColor2.value.set(theme.accent);
    this.coronaMaterial.uniforms.uCoronaColor.value.set(theme.accent);
    this.flareMaterial.color.set(theme.accent);
  }

  dispose() {
    this.coreMesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.coronaMesh.geometry.dispose();
    this.coronaMaterial.dispose();
    this.flarePoints.geometry.dispose();
    this.flareMaterial.dispose();
    this.group.removeFromParent();
  }
}
