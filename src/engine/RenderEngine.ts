import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { VisualizerPreset, VisualizerTheme, AudioFeatures, PostProcessingConfig } from '../types';
import { CameraController } from './CameraController';
import { TextOverlayEngine } from '../overlay/TextOverlayEngine';

const PersistenceShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tFeedback: { value: null as THREE.Texture | null },
    uPersistence: { value: 0.0 }
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
    varying vec2 vUv;

    void main() {
      vec4 curr = texture2D(tDiffuse, vUv);
      if (uPersistence > 0.01) {
        vec4 prev = texture2D(tFeedback, vUv);
        vec3 trail = max(curr.rgb, prev.rgb * uPersistence);
        gl_FragColor = vec4(trail, max(curr.a, prev.a * uPersistence));
      } else {
        gl_FragColor = curr;
      }
    }
  `
};

const MasterShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tFeedback: { value: null as THREE.Texture | null },
    uPersistence: { value: 0.0 },
    uTime: { value: 0 },
    uVignette: { value: 0.5 },
    uFilmGrain: { value: 0.15 },
    uChromaticAberration: { value: 0.4 },
    uScanlines: { value: 0.0 },
    uCrtBend: { value: 0.0 },
    uAudioBass: { value: 0.0 },
    uKaleidoscope: { value: 0.0 },
    uMirror: { value: 0.0 },
    uPixelize: { value: 0.0 },
    uDrip: { value: 0.0 },
    uPhosphor: { value: 0.0 },
    uEdgeDetect: { value: 0.0 },
    uBrightness: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) }
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
    uniform float uKaleidoscope;
    uniform float uMirror;
    uniform float uPixelize;
    uniform float uDrip;
    uniform float uPhosphor;
    uniform float uEdgeDetect;
    uniform float uBrightness;
    uniform vec2 uResolution;
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

    vec2 applyKaleido(vec2 uv, float segments) {
      if (segments <= 1.0) return uv;
      vec2 p = uv - 0.5;
      float r = length(p);
      float a = atan(p.y, p.x);
      float seg = 6.283185307 / segments;
      a = mod(a, seg);
      if (a > seg * 0.5) a = seg - a;
      return vec2(cos(a), sin(a)) * r + 0.5;
    }

    vec2 applyMirror(vec2 uv, float m) {
      if (m < 0.5) return uv;
      vec2 res = uv;
      if (m < 1.5) res.x = abs(res.x - 0.5) + 0.5;
      else if (m < 2.5) res.y = abs(res.y - 0.5) + 0.5;
      else res = abs(res - 0.5) + 0.5;
      return res;
    }

    vec2 applyPixelize(vec2 uv, float px, vec2 res) {
      if (px <= 1.0) return uv;
      vec2 grid = max(res / px, vec2(8.0));
      return floor(uv * grid) / grid;
    }

    vec2 applyDrip(vec2 uv, float amount, float time, float bass) {
      if (amount <= 0.001) return uv;
      float factor = amount * 0.018 + bass * 0.012;
      uv.x += sin(uv.y * 16.0 + time * 3.2) * factor;
      uv.y += cos(uv.x * 14.0 + time * 2.6) * factor;
      return uv;
    }

    void main() {
      // 1. Mirror Symmetry
      vec2 uv = applyMirror(vUv, uMirror);

      // 2. Kaleidoscope
      uv = applyKaleido(uv, uKaleidoscope);

      // 3. Liquid Drip / Wave distortion
      uv = applyDrip(uv, uDrip, uTime, uAudioBass);

      // 4. CRT Barrel Distortion
      uv = crtDistort(uv, uCrtBend);

      // 5. Pixelize / Retro Arcade
      uv = applyPixelize(uv, uPixelize, uResolution);

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

      // Motion Persistence fallback
      if (uPersistence > 0.01) {
        vec3 fb = texture2D(tFeedback, uv).rgb;
        color = max(color, fb * uPersistence);
      }

      // Neon Edge Trace
      if (uEdgeDetect > 0.01) {
        vec2 off = 1.5 / max(uResolution, vec2(1.0));
        float lC = length(texture2D(tDiffuse, uv).rgb);
        float lL = length(texture2D(tDiffuse, uv - vec2(off.x, 0.0)).rgb);
        float lR = length(texture2D(tDiffuse, uv + vec2(off.x, 0.0)).rgb);
        float lU = length(texture2D(tDiffuse, uv + vec2(0.0, off.y)).rgb);
        float lD = length(texture2D(tDiffuse, uv - vec2(0.0, off.y)).rgb);
        float edge = (abs(lC - lL) + abs(lC - lR) + abs(lC - lU) + abs(lC - lD)) * 2.0;
        vec3 edgeCol = vec3(edge) * vec3(1.0, 0.7, 0.2);
        color = mix(color, max(color, edgeCol), uEdgeDetect);
      }

      // CRT Scanlines
      if (uScanlines > 0.01) {
        float scanline = sin(uv.y * 700.0) * 0.5 + 0.5;
        color *= 1.0 - (scanline * uScanlines * 0.35);
      }

      // Phosphor CRT Glow
      if (uPhosphor > 0.01) {
        float px = floor(mod(gl_FragCoord.x, 3.0));
        vec3 mask = (px == 0.0) ? vec3(1.25, 0.8, 0.8) : ((px == 1.0) ? vec3(0.8, 1.25, 0.8) : vec3(0.8, 0.8, 1.25));
        color *= mix(vec3(1.0), mask, uPhosphor * 0.55);
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

      // Brightness / Exposure
      if (abs(uBrightness) > 0.005) {
        color += vec3(uBrightness);
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
  private readonly persistencePass: ShaderPass;
  private readonly masterPass: ShaderPass;

  // Feedback targets for motion persistence
  public readonly feedbackTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private currentFeedbackIndex = 0;
  private readonly copyScene: THREE.Scene;
  private readonly copyCamera: THREE.OrthographicCamera;
  private readonly copyMaterial: THREE.MeshBasicMaterial;

  public activePreset: VisualizerPreset | null = null;
  public currentTheme: VisualizerTheme;
  public config: PostProcessingConfig;

  public readonly cameraController: CameraController;
  public readonly textOverlay: TextOverlayEngine;
  private readonly cameraBasePos = new THREE.Vector3(0, 0, 12);
  private readonly clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, initialTheme: VisualizerTheme) {
    this.currentTheme = initialTheme;
    this.config = {
      bloomStrength: 0.36,
      bloomRadius: 0.45,
      bloomThreshold: 0.85,
      persistence: 0.0,
      chromaticAberration: 0.0,
      filmGrain: 0.0,
      vignette: 0.0,
      scanlines: 0.0,
      crtBend: 0.0,
      cameraShake: true,
      autoRotate: true,
      autoRotateSpeed: 0.35,
      kaleidoscope: 0.0,
      mirror: 0.0,
      pixelize: 0.0,
      drip: 0.0,
      phosphor: 0.0,
      edgeDetect: 0.0,
      brightness: 0.0,
      particleDensity: 1.0,
      particleSpread: 1.0
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
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

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

    // Persistence Pass
    this.persistencePass = new ShaderPass(PersistenceShader);
    this.composer.addPass(this.persistencePass);

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
    this.copyMaterial = new THREE.MeshBasicMaterial({
      map: this.feedbackTargets[0].texture,
      transparent: false
    });
    const copyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copyMaterial);
    this.copyScene.add(copyQuad);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Initialize animated text overlay engine (Ticket #43)
    this.textOverlay = new TextOverlayEngine(width, height, this.renderer.getPixelRatio());

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

    // Apply preset-specific camera configuration
    const cfg = preset.cameraConfig;
    if (cfg?.position) {
      const targetVec = cfg.target ? new THREE.Vector3(...cfg.target) : new THREE.Vector3(0, 0, 0);
      this.cameraController.setCameraPosition(cfg.position[0], cfg.position[1], cfg.position[2], targetVec);
      if (cfg.autoRotate !== undefined) {
        this.cameraController.autoRotate = cfg.autoRotate;
        this.config.autoRotate = cfg.autoRotate;
      }
      if (cfg.autoRotateSpeed !== undefined) {
        this.cameraController.autoRotateSpeed = cfg.autoRotateSpeed;
        this.config.autoRotateSpeed = cfg.autoRotateSpeed;
      }
    } else {
      this.cameraController.setCameraPosition(0, 4.5, 12, new THREE.Vector3(0, 0, 0));
      this.cameraController.autoRotate = true;
      this.cameraController.autoRotateSpeed = 0.35;
      this.config.autoRotate = true;
      this.config.autoRotateSpeed = 0.35;
    }

    // Apply preset-specific bloom intensity if defined
    const intensity = cfg?.bloomIntensity ?? 0.5;
    this.bloomPass.strength = intensity * 0.72;
    this.bloomPass.threshold = Math.max(0.05, 1.0 - (intensity * 0.3));
    this.bloomPass.radius = 0.3 + (intensity * 0.3);

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

  private updateBloomConfig(newConfig: Partial<PostProcessingConfig>): void {
    if (newConfig.bloomStrength !== undefined) {
      const intensity = newConfig.bloomStrength;
      this.bloomPass.strength = intensity * 0.72;
      this.bloomPass.threshold = Math.max(0.05, 1.0 - (intensity * 0.3));
      this.bloomPass.radius = 0.3 + (intensity * 0.3);
      return;
    }
    if (newConfig.bloomRadius !== undefined) this.bloomPass.radius = newConfig.bloomRadius;
    if (newConfig.bloomThreshold !== undefined) this.bloomPass.threshold = newConfig.bloomThreshold;
  }

  private updateParticleConfig(newConfig: Partial<PostProcessingConfig>): void {
    const preset = this.activePreset;
    if (!preset || typeof preset.setCustomParameter !== 'function') return;
    if (newConfig.particleDensity !== undefined) {
      preset.setCustomParameter('density', newConfig.particleDensity);
      preset.setCustomParameter('particleCount', newConfig.particleDensity);
    }
    if (newConfig.particleSpread !== undefined) {
      preset.setCustomParameter('spread', newConfig.particleSpread);
    }
  }

  public updateConfig(newConfig: Partial<PostProcessingConfig>) {
    Object.assign(this.config, newConfig);
    this.updateBloomConfig(newConfig);
    if (newConfig.autoRotate !== undefined) {
      this.cameraController.autoRotate = newConfig.autoRotate;
    }
    if (newConfig.autoRotateSpeed !== undefined) {
      this.cameraController.autoRotateSpeed = newConfig.autoRotateSpeed;
    }
    if (newConfig.cameraShake !== undefined) {
      this.cameraController.cameraShakeEnabled = newConfig.cameraShake;
    }
    this.updateParticleConfig(newConfig);
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
    uniforms.uKaleidoscope.value = this.config.kaleidoscope ?? 0.0;
    uniforms.uMirror.value = this.config.mirror ?? 0.0;
    uniforms.uPixelize.value = this.config.pixelize ?? 0.0;
    uniforms.uDrip.value = this.config.drip ?? 0.0;
    uniforms.uPhosphor.value = this.config.phosphor ?? 0.0;
    uniforms.uEdgeDetect.value = this.config.edgeDetect ?? 0.0;
    uniforms.uBrightness.value = this.config.brightness ?? 0.0;
    uniforms.uResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height);

    if (this.config.persistence > 0.01) {
      this.persistencePass.enabled = true;
      this.persistencePass.uniforms.uPersistence.value = this.config.persistence;
      this.persistencePass.uniforms.tFeedback.value = currentReadTarget.texture;
    } else {
      this.persistencePass.enabled = false;
    }

    this.composer.render();

    // If persistence active, copy output to write target and swap
    if (this.config.persistence > 0.01) {
      this.renderer.setRenderTarget(currentWriteTarget);
      this.copyMaterial.map = this.composer.readBuffer.texture;
      this.copyMaterial.needsUpdate = true;
      this.renderer.render(this.copyScene, this.copyCamera);
      this.renderer.setRenderTarget(null);
      this.currentFeedbackIndex = 1 - this.currentFeedbackIndex;
    }

    // Animated text and typography overlay pass (Ticket #43)
    this.textOverlay.update(audio, delta);
    this.textOverlay.renderPass(this.renderer);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.feedbackTargets[0].setSize(width, height);
    this.feedbackTargets[1].setSize(width, height);
    this.textOverlay.resize(width, height, this.renderer.getPixelRatio());

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
