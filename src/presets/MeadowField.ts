import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class MeadowFieldPreset implements VisualizerPreset {
  id = 'meadow-field';
  name = 'Meadow Field & Sky';
  category = 'Organic & Nature' as const;
  description = 'Instanced meadow grass swaying in wind with reactive atmospheric cloud canopy.';

  private group!: THREE.Group;
  private grassMesh!: THREE.InstancedMesh;
  private skyCloud!: THREE.Mesh;
  private grassMaterial!: THREE.MeshStandardMaterial;
  private skyMaterial!: THREE.ShaderMaterial;
  private bladeCount = 1500;
  private dummy = new THREE.Object3D();
  private basePositions: { x: number; z: number; rotY: number }[] = [];

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Instanced Grass Blades
    const bladeGeom = new THREE.ConeGeometry(0.06, 1.4, 3);
    bladeGeom.translate(0, 0.7, 0); // anchor at base

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      roughness: 0.8,
      metalness: 0.1
    });

    this.grassMesh = new THREE.InstancedMesh(bladeGeom, this.grassMaterial, this.bladeCount);
    this.basePositions = [];

    for (let i = 0; i < this.bladeCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;
      const rotY = Math.random() * Math.PI * 2;
      this.basePositions.push({ x, z, rotY });

      this.dummy.position.set(x, -2, z);
      this.dummy.rotation.set(0, rotY, 0);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.grassMesh);

    // 2. Cloud canopy plane
    const cloudGeom = new THREE.PlaneGeometry(24, 24, 32, 32);
    cloudGeom.rotateX(Math.PI / 2);

    this.skyMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uColor: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uTreble;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv * 3.0 + vec2(uTime * 0.05, uTime * 0.03);
          float n = sin(uv.x * 4.0) * cos(uv.y * 4.0);
          float clouds = smoothstep(-0.2, 0.8, n) * (0.4 + uTreble * 0.4);
          gl_FragColor = vec4(uColor, clouds * 0.6);
        }
      `
    });

    this.skyCloud = new THREE.Mesh(cloudGeom, this.skyMaterial);
    this.skyCloud.position.y = 4;
    this.group.add(this.skyCloud);

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number) {
    this.skyMaterial.uniforms.uTime.value = time;
    this.skyMaterial.uniforms.uTreble.value = audio.treble;

    const windGust = Math.sin(time * 2.0) * (0.3 + audio.bass * 0.7);

    for (let i = 0; i < this.bladeCount; i++) {
      const p = this.basePositions[i];
      const bladeWind = windGust + Math.sin(time * 3.0 + p.x * 0.5) * 0.15;

      this.dummy.position.set(p.x, -2, p.z);
      this.dummy.rotation.set(bladeWind, p.rotY, bladeWind * 0.5);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.grassMaterial.color.set(theme.primary);
    this.skyMaterial.uniforms.uColor.value.set(theme.accent);
  }

  dispose() {
    this.grassMesh.geometry.dispose();
    this.grassMaterial.dispose();
    this.skyCloud.geometry.dispose();
    this.skyMaterial.dispose();
    this.group.removeFromParent();
  }
}

