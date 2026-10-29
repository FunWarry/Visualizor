import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { VisualizerPreset, VisualizerTheme, AudioFeatures, PostProcessingConfig } from '../types';
import { CameraController } from './CameraController';

const MasterShader = {
  uniforms: {
    tDiffuse: { value: null },
    tFeedback: { value: null },
    uPersistence: { value: 0.0 },
    uTime: { value: 0 },
    uVignette: { value: 0.5 },
    uFilmGrain: { value: 0.15 },
    uChromaticAberration: { value: 0.4 },
    uScanlines: { value: 0.0 },
    uCrtBend: { value: 0.0 },
    uAudioBass: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tFeedback;
    uniform float uPersistence;
    uniform float uTime;
    uniform float uVignette;
    uniform float uFilmGrain;
    uniform float uChromaticAberration;
    uniform float uScanlines;
    uniform float uCrtBend;
    uniform float uAudioBass;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 crtDistort(vec2 uv, float bend) {
      if (bend <= 0.001) return uv;
      vec2 cc = uv - 0.5;
      float dist = dot(cc, cc);
      return uv + cc * (dist * bend);
    }

    void main() {
      vec2 uv = crtDistort(vUv, uCrtBend);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Chromatic Aberration
      float split = uChromaticAberration * (0.003 + uAudioBass * 0.012);
      vec2 dir = uv - 0.5;
      float r = texture2D(tDiffuse, uv + dir * split).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir * split).b;
      vec3 color = vec3(r, g, b);

      // Motion Persistence (Feedback trails)
      if (uPersistence > 0.01) {
        vec3 fb = texture2D(tFeedback, uv).rgb;
        color = max(color, fb * uPersistence);
      }

      // CRT Scanlines
      if (uScanlines > 0.01) {
        float scanline = sin(uv.y * 700.0) * 0.5 + 0.5;
        color *= 1.0 - (scanline * uScanlines * 0.35);
      }

      // Vignette
      if (uVignette > 0.01) {
        float dist = distance(uv, vec2(0.5));
        float vig = smoothstep(0.85, 0.2, dist * (1.0 + uVignette * 0.8));
        color *= vig;
      }

      // Film Grain
      if (uFilmGrain > 0.01) {
        float noise = (random(uv + vec2(uTime * 15.0, uTime * 23.0)) - 0.5) * uFilmGrain;
        color += noise;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class RenderEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly masterPass: ShaderPass;

  // Feedback targets for motion persistence
  private readonly feedbackTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private currentFeedbackIndex = 0;
  private readonly copyScene: THREE.Scene;
  private readonly copyCamera: THREE.OrthographicCamera;
  private readonly copyMaterial: THREE.MeshBasicMaterial;

  public activePreset: VisualizerPreset | null = null;
  public currentTheme: VisualizerTheme;
  public config: PostProcessingConfig;

  public readonly cameraController: CameraController;
  private readonly cameraBasePos = new THREE.Vector3(0, 0, 12);
  private readonly clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, initialTheme: VisualizerTheme) {
    this.currentTheme = initialTheme;
    this.config = {
      bloomStrength: 1.2,
      bloomRadius: 0.45,
      bloomThreshold: 0.15,
      persistence: 0.0,
      chromaticAberration: 0.35,
      filmGrain: 0.12,
      vignette: 0.45,
      scanlines: 0.0,
      crtBend: 0.0,
      cameraShake: true,
      autoRotate: true,
      autoRotateSpeed: 0.4
    };

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(initialTheme.background);

    // Camera setup
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.cameraController = new CameraController(this.camera, {
      baseRadius: 12,
      orbitSpeed: this.config.autoRotateSpeed
    });

    // Synchronize camera state bidirectionally between config and cameraController
    Object.defineProperty(this.config, 'autoRotate', {
      get: () => this.cameraController.autoRotate,
      set: (val: boolean) => {
        this.cameraController.autoRotate = val;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(this.config, 'autoRotateSpeed', {
      get: () => this.cameraController.autoRotateSpeed,
      set: (val: number) => {
        this.cameraController.autoRotateSpeed = val;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(this.config, 'cameraShake', {
      get: () => this.cameraController.cameraShakeEnabled,
      set: (val: boolean) => {
        this.cameraController.setCameraShakeEnabled(val);
      },
      enumerable: true,
      configurable: true
    });

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Post-Processing Composer
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Unreal Bloom Pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    // Master Screen Effects Pass
    this.masterPass = new ShaderPass(MasterShader);
    this.composer.addPass(this.masterPass);

    // Ping-pong targets for motion persistence
    const targetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    };
    this.feedbackTargets = [
      new THREE.WebGLRenderTarget(width, height, targetOptions),
      new THREE.WebGLRenderTarget(width, height, targetOptions)
    ];

    // Ortho copy scene for ping-pong blit
    this.copyScene = new THREE.Scene();
    this.copyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.copyMaterial = new THREE.MeshBasicMaterial({ transparent: false });
    const copyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copyMaterial);
    this.copyScene.add(copyQuad);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    window.addEventListener('resize', () => this.resize(window.innerWidth, window.innerHeight));
  }

  public setPreset(preset: VisualizerPreset) {
    if (this.activePreset) {
      this.activePreset.dispose();
      const toRemove: THREE.Object3D[] = [];
      this.scene.children.forEach(child => {
        if (!(child instanceof THREE.Light)) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => this.scene.remove(obj));
    }

    this.activePreset = preset;
    this.camera.position.copy(this.cameraBasePos);
    this.camera.lookAt(0, 0, 0);

    preset.init({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      theme: this.currentTheme
    });
  }

  public setTheme(theme: VisualizerTheme) {
    this.currentTheme = theme;
    this.scene.background = new THREE.Color(theme.background);
    if (this.activePreset?.onThemeChange) {
      this.activePreset.onThemeChange(theme);
    }
  }

  public updateConfig(newConfig: Partial<PostProcessingConfig>) {
    Object.assign(this.config, newConfig);
    this.bloomPass.strength = this.config.bloomStrength;
    this.bloomPass.radius = this.config.bloomRadius;
    this.bloomPass.threshold = this.config.bloomThreshold;
    if (newConfig.autoRotate !== undefined) {
      this.cameraController.autoRotate = newConfig.autoRotate;
    }
    if (newConfig.autoRotateSpeed !== undefined) {
      this.cameraController.autoRotateSpeed = newConfig.autoRotateSpeed;
    }
    if (newConfig.cameraShake !== undefined) {
      this.cameraController.cameraShakeEnabled = newConfig.cameraShake;
    }
  }

  public render(audio: AudioFeatures) {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Delegate camera position, auto-orbit, shake, and lerping to cameraController
    this.cameraController.update(delta, audio.beat, audio.bass);
    this.config.autoRotate = this.cameraController.autoRotate;
    this.config.cameraShake = this.cameraController.cameraShakeEnabled;

    // Update active preset
    if (this.activePreset) {
      this.activePreset.update({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        width: this.renderer.domElement.width,
        height: this.renderer.domElement.height,
        theme: this.currentTheme
      }, audio, time, delta);
    }

    // Motion Persistence: feed previous target texture to shader
    const currentReadTarget = this.feedbackTargets[this.currentFeedbackIndex];
    const currentWriteTarget = this.feedbackTargets[1 - this.currentFeedbackIndex];

    const uniforms = this.masterPass.uniforms;
    uniforms.uTime.value = time;
    uniforms.uVignette.value = this.config.vignette;
    uniforms.uFilmGrain.value = this.config.filmGrain;
    uniforms.uChromaticAberration.value = this.config.chromaticAberration;
    uniforms.uScanlines.value = this.config.scanlines;
    uniforms.uCrtBend.value = this.config.crtBend;
    uniforms.uAudioBass.value = audio.bass;
    uniforms.uPersistence.value = this.config.persistence;
    uniforms.tFeedback.value = currentReadTarget.texture;

    this.composer.render();

    // If persistence active, copy output to write target and swap
    if (this.config.persistence > 0.01) {
      this.renderer.setRenderTarget(currentWriteTarget);
      this.copyMaterial.map = this.composer.readBuffer.texture;
      this.renderer.render(this.copyScene, this.copyCamera);
      this.renderer.setRenderTarget(null);
      this.currentFeedbackIndex = 1 - this.currentFeedbackIndex;
    }
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.feedbackTargets[0].setSize(width, height);
    this.feedbackTargets[1].setSize(width, height);

    if (this.activePreset?.resize) {
      this.activePreset.resize(width, height);
    }
  }

  public captureScreenshot(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  public setCameraPosition(rotAngle: number, tiltAngle: number, zoom?: number, immediate?: boolean): void {
    this.cameraController.setPosition(rotAngle, tiltAngle, zoom, immediate);
  }

  public setAutoRotate(enabled: boolean, speed?: number, direction?: 1 | -1): void {
    this.config.autoRotate = enabled;
    if (speed !== undefined) this.config.autoRotateSpeed = speed;
    this.cameraController.setAutoRotate(enabled, speed, direction);
  }

  public triggerCameraShake(intensity: number): void {
    this.cameraController.triggerShake(intensity);
  }

  public setCameraShake(enabled: boolean, intensity?: number): void {
    this.config.cameraShake = enabled;
    this.cameraController.setCameraShakeEnabled(enabled);
    if (intensity !== undefined) {
      this.cameraController.setCameraShakeIntensity(intensity);
    }
  }

  public setCameraViewpoint(viewpointId: string, immediate?: boolean): void {
    this.config.autoRotate = false;
    this.cameraController.setViewpoint(viewpointId, immediate);
  }

  public setViewpoint(viewpointId: string, immediate?: boolean): void {
    this.config.autoRotate = false;
    this.cameraController.setViewpoint(viewpointId, immediate);
  }

  public resetCamera(): void {
    this.config.autoRotate = true;
    this.cameraController.reset();
  }
}
