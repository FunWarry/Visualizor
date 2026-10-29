import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class TopoMapPreset implements VisualizerPreset {
  id = 'topo-map';
  name = 'Topo Map & Cymatics';
  category = 'Structures' as const;
  description = '3D topographic contour terrain deformed by Chladni modal standing soundwaves.';

  private group!: THREE.Group;
  private terrainMesh!: THREE.Mesh;
  private contourLines!: THREE.LineSegments;
  private material!: THREE.ShaderMaterial;
  private lineMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Chladni resonant surface
    const gridRes = 80;
    const size = 16;
    const geometry = new THREE.PlaneGeometry(size, size, gridRes, gridRes);
    geometry.rotateX(-Math.PI / 2.5); // tilted view

    const pos = geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) },
        uElevationScale: { value: 2.0 }
      },
      wireframe: false,
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec3 vPos;

        void main() {
          // Topographic contour lines along Z / Y elevation
          float elev = vPos.z * 1.5;
          float contour = abs(fract(elev * 4.0 - 0.5) - 0.5) / fwidth(elev * 4.0);
          float line = 1.0 - clamp(contour, 0.0, 1.0);

          vec3 baseCol = mix(uColor1, uColor2, clamp(elev * 0.4 + 0.5, 0.0, 1.0));
          vec3 col = mix(baseCol, uAccent, line * 0.85);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.terrainMesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.terrainMesh);

    // 2. Wireframe contour accents
    const wireGeom = new THREE.WireframeGeometry(geometry);
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.25
    });
    this.contourLines = new THREE.LineSegments(wireGeom, this.lineMaterial);
    this.group.add(this.contourLines);

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.z += delta * 0.05;

    const pos = (this.terrainMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    
    // Modal numbers n, m modulated by audio frequencies
    const n = 3.0 + Math.floor(audio.bass * 3.0);
    const m = 5.0 + Math.floor(audio.mid * 4.0);
    const amp = 0.8 + audio.bass * 1.8 + audio.beatEnergy * 1.2;

    for (let i = 0; i < pos.length; i += 3) {
      const x = this.basePositions[i] * 0.35;
      const y = this.basePositions[i + 1] * 0.35;

      // Chladni 2D nodal equation: cos(n*x)*cos(m*y) - cos(m*x)*cos(n*y)
      const chladni = Math.cos(n * x) * Math.cos(m * y) - Math.cos(m * x) * Math.cos(n * y);
      const wave = Math.sin(Math.sqrt(x * x + y * y) * 5.0 - time * 3.0) * 0.2 * audio.treble;

      pos[i + 2] = (chladni * 0.5 + wave) * amp;
    }

    this.terrainMesh.geometry.attributes.position.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.lineMaterial.color.set(theme.accent);
  }

  dispose() {
    this.terrainMesh.geometry.dispose();
    this.material.dispose();
    this.contourLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.group.removeFromParent();
  }
}

