import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class MandelFractalPreset implements VisualizerPreset {
  id = 'mandel-fractal';
  name = 'Mandel Fractal';
  category = 'Abstract & Space' as const;
  description = 'Hypnotic audio-reactive Mandelbrot & Julia fractal zoom with chromatic shifts.';

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private currentZoom: number = 1.0;

  init(ctx: PresetContext) {
    // Screen-filling quad in 3D scene aligned with camera
    const geom = new THREE.PlaneGeometry(30, 20);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uZoom: { value: 1.0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
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
        uniform float uZoom;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;

        // Complex squared
        vec2 complexSquare(vec2 c) {
          return vec2(c.x * c.x - c.y * c.y, 2.0 * c.x * c.y);
        }

        void main() {
          vec2 c = (vUv - 0.5) * vec2(3.0, 2.0) / uZoom;
          // Slowly morph center
          c += vec2(-0.743643887037158704752191506114774, 0.131825904205311970493132056385139);

          vec2 z = c;
          vec2 juliaC = vec2(sin(uTime * 0.2) * 0.3 * (1.0 + uMid), cos(uTime * 0.15) * 0.3);

          float n = 0.0;
          float maxIter = 40.0 + uTreble * 30.0;

          for (float i = 0.0; i < 70.0; i += 1.0) {
            if (i >= maxIter) break;
            if (dot(z, z) > 4.0) {
              n = i;
              break;
            }
            z = complexSquare(z) + mix(c, juliaC, 0.35 + uMid * 0.2);
          }

          if (n == 0.0) {
            gl_FragColor = vec4(0.01, 0.01, 0.03, 1.0);
          } else {
            float t = n / maxIter;
            vec3 col = mix(uColor1, uColor2, sin(t * 6.28 + uTime * 0.5) * 0.5 + 0.5);
            col = mix(col, uAccent, pow(t, 2.0) * (0.8 + uBass));
            gl_FragColor = vec4(col, 1.0);
          }
        }
      `
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.z = -5;
    ctx.scene.add(this.mesh);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    // Zoom in progressively, accelerate on bass
    const zoomSpeed = 0.4 + audio.bass * 1.2;
    this.currentZoom *= 1.0 + delta * zoomSpeed;
    if (this.currentZoom > 500.0) {
      this.currentZoom = 1.0; // cycle
    }

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uZoom.value = this.currentZoom;
    this.material.uniforms.uBass.value = audio.bass;
    this.material.uniforms.uMid.value = audio.mid;
    this.material.uniforms.uTreble.value = audio.treble;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
