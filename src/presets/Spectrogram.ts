import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class SpectrogramPreset implements VisualizerPreset {
  id = 'spectrogram-radar';
  name = 'Spectrogram & Radar';
  category = 'Retro & Digital' as const;
  description = '3D waterfall audio spectrogram terrain with rotating phosphor green night radar scope.';

  private group!: THREE.Group;
  private waterfallMesh!: THREE.Mesh;
  private radarArm!: THREE.Line;
  private waterfallMaterial!: THREE.ShaderMaterial;
  private radarMaterial!: THREE.LineBasicMaterial;
  private historyBuffer!: Float32Array;
  private readonly rows = 64;
  private readonly cols = 64;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. 3D Waterfall Spectrogram Terrain
    const geom = new THREE.PlaneGeometry(16, 16, this.cols - 1, this.rows - 1);
    geom.rotateX(-Math.PI / 2.2);

    this.historyBuffer = new Float32Array(this.rows * this.cols);

    this.waterfallMaterial = new THREE.ShaderMaterial({
      wireframe: true,
      uniforms: {
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec3 vPos;

        void main() {
          float heightFactor = clamp(vPos.z * 0.4, 0.0, 1.0);
          vec3 col = mix(uColor1, uAccent, heightFactor);
          gl_FragColor = vec4(col, 0.85);
        }
      `
    });

    this.waterfallMesh = new THREE.Mesh(geom, this.waterfallMaterial);
    this.group.add(this.waterfallMesh);

    // 2. Rotating radar sweep line
    const radarGeom = new THREE.BufferGeometry();
    const radarPoints = [new THREE.Vector3(0, 0, 0.2), new THREE.Vector3(7, 0, 0.2)];
    radarGeom.setFromPoints(radarPoints);

    this.radarMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    this.radarArm = new THREE.Line(radarGeom, this.radarMaterial);
    this.radarArm.position.set(0, 0, 1);
    this.group.add(this.radarArm);

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    // Rotate radar arm
    this.radarArm.rotation.z -= delta * (1.5 + audio.mid * 2.0);

    // Shift waterfall history rows backward
    for (let r = this.rows - 1; r > 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        this.historyBuffer[r * this.cols + c] = this.historyBuffer[(r - 1) * this.cols + c];
      }
    }

    // Insert current frequency spectrum into row 0
    const freq = audio.frequencyData;
    const step = Math.floor(freq.length / this.cols);
    for (let c = 0; c < this.cols; c++) {
      this.historyBuffer[c] = (freq[c * step] / 255.0) * 3.5;
    }

    // Update geometry vertex positions
    const pos = (this.waterfallMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < this.rows * this.cols; i++) {
      pos[i * 3 + 2] = this.historyBuffer[i];
    }
    this.waterfallMesh.geometry.attributes.position.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.waterfallMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterfallMaterial.uniforms.uAccent.value.set(theme.accent);
    this.radarMaterial.color.set(theme.accent);
  }

  dispose() {
    this.waterfallMesh.geometry.dispose();
    this.waterfallMaterial.dispose();
    this.radarArm.geometry.dispose();
    this.radarMaterial.dispose();
    this.group.removeFromParent();
  }
}
