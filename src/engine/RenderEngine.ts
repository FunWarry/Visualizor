import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { VisualizerPreset, VisualizerTheme, AudioFeatures, PostProcessingConfig, PresetCameraConfig } from '../types';
import { CameraController } from './CameraController';
import { TextOverlayEngine } from '../overlay/TextOverlayEngine';
import { getPreset } from '../presets';

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
    uVignette: { value: 0.0 },
    uFilmGrain: { value: 0.0 },
    uChromaticAberration: { value: 0.0 },
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

    vec2 applyKaleido(vec2 uv, float segments, vec2 res) {
      if (segments <= 1.0) return uv;
      float aspect = res.x / max(res.y, 1.0);
      vec2 p = uv - 0.5;
      p.x *= aspect;

      float r = length(p);
      float a = atan(p.y, p.x);
      if (a < 0.0) a += 6.283185307;

      float seg = 6.283185307 / segments;
      a = mod(a, seg);
      if (a > seg * 0.5) a = seg - a;

      vec2 kp = vec2(cos(a), sin(a)) * r;
      kp.x /= aspect;
      vec2 kUv = kp + 0.5;

      // Seamless mirror reflection at edges (triangle wave folding between 0.0 and 1.0)
      // Eliminates black borders and seams completely
      return 1.0 - abs(fract(kUv * 0.5) * 2.0 - 1.0);
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

      // 2. Kaleidoscope (aspect-corrected & seamless mirror wrapped)
      uv = applyKaleido(uv, uKaleidoscope, uResolution);

      // 3. Liquid Drip / Wave distortion
      uv = applyDrip(uv, uDrip, uTime, uAudioBass);

      // 4. CRT Barrel Distortion (seamlessly clamped to screen edges, never cutting out into black borders)
      float effectiveCrtBend = (uKaleidoscope > 0.001) ? 0.0 : uCrtBend;
      uv = crtDistort(uv, effectiveCrtBend);

      // 5. Pixelize / Retro Arcade
      uv = applyPixelize(uv, uPixelize, uResolution);

      uv = clamp(uv, 0.0, 1.0);

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

      // Vignette (smooth corner-weighted cinematic falloff, never clipping to solid black bands)
      if (uVignette > 0.01) {
        vec2 p = uv - 0.5;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        p.x *= aspect;
        float dist = length(p);
        float maxCornerDist = length(vec2(0.5 * aspect, 0.5));
        float normDist = dist / max(maxCornerDist, 0.001);
        float vig = 1.0 - smoothstep(0.35, 1.1, normDist) * uVignette * 0.8;
        color *= clamp(vig, 0.0, 1.0);
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
  private readonly afterimagePass: AfterimagePass;
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

    this.initConfigProperties();

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

    // Post-Processing Composer & Passes
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );
    this.afterimagePass = new AfterimagePass(this.config.persistence);
    this.persistencePass = new ShaderPass(PersistenceShader);
    this.masterPass = new ShaderPass(MasterShader);
    this.initPostProcessing();

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

    this.initLighting();

    // Initialize animated text overlay engine (Ticket #43)
    this.textOverlay = new TextOverlayEngine(width, height, this.renderer.getPixelRatio());

    window.addEventListener('resize', () => this.resize(window.innerWidth, window.innerHeight));
  }

  private initConfigProperties(): void {
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
  }

  private initPostProcessing(): void {
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.afterimagePass.enabled = this.config.persistence > 0.01;
    this.composer.addPass(this.afterimagePass);
    this.composer.addPass(this.persistencePass);
    this.composer.addPass(this.masterPass);
  }

  private initLighting(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(-6, -5, -6);
    this.scene.add(rimLight);
  }

  private restoreSavedPresetCamera(presetId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const savedCamJson = localStorage.getItem(`visualizor_camera_${presetId}`);
      if (!savedCamJson) return false;
      const savedCam = JSON.parse(savedCamJson);
      this.cameraController.importState(savedCam, true);
      this.config.autoRotate = this.cameraController.autoRotate;
      this.config.autoRotateSpeed = this.cameraController.autoRotateSpeed;
      return true;
    } catch (err) {
      console.warn('Failed to parse saved camera state for preset', presetId, err);
      return false;
    }
  }

  private applyDefaultPresetCamera(cfg?: PresetCameraConfig): void {
    if (cfg?.position) {
      const targetVec = cfg.target ? new THREE.Vector3(...cfg.target) : new THREE.Vector3(0, 0, 0);
      this.cameraController.setCameraPosition(cfg.position[0], cfg.position[1], cfg.position[2], targetVec);
      const autoRotate = cfg.autoRotate ?? true;
      const autoRotateSpeed = (cfg.autoRotateSpeed !== undefined && cfg.autoRotateSpeed >= 0) ? cfg.autoRotateSpeed : (autoRotate ? 0.35 : 0);
      this.cameraController.autoRotate = autoRotate;
      this.config.autoRotate = autoRotate;
      this.cameraController.autoRotateSpeed = autoRotateSpeed;
      this.config.autoRotateSpeed = autoRotateSpeed;
    } else {
      this.cameraController.setCameraPosition(0, 4.5, 12, new THREE.Vector3(0, 0, 0));
      this.cameraController.autoRotate = true;
      this.cameraController.autoRotateSpeed = 0.35;
      this.config.autoRotate = true;
      this.config.autoRotateSpeed = 0.35;
    }

    if (cfg?.rotAngle !== undefined) {
      this.cameraController.setOrbit(cfg.rotAngle, true);
    }
    if (cfg?.tiltAngle !== undefined) {
      this.cameraController.setTilt(cfg.tiltAngle, true);
    }
    if (cfg?.zoom !== undefined) {
      this.cameraController.setZoom(cfg.zoom, true, cfg.zoom > 1 || cfg.zoom < 0);
    }

    if (cfg?.bloomIntensity !== undefined) {
      const intensity = cfg.bloomIntensity;
      this.bloomPass.strength = intensity * 0.72;
      this.bloomPass.threshold = Math.max(0.05, 1.0 - (intensity * 0.3));
      this.bloomPass.radius = 0.3 + (intensity * 0.3);
    }
  }

  private initPresetCamera(preset: VisualizerPreset): void {
    if (this.restoreSavedPresetCamera(preset.id)) return;
    this.applyDefaultPresetCamera(preset.cameraConfig);
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

    // Apply preset-specific camera configuration or restored saved camera
    this.initPresetCamera(preset);

    // Apply preset-specific bloom intensity if defined
    const intensity = preset.cameraConfig?.bloomIntensity ?? 0.5;
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

    this.updateParticleConfig(this.config);
  }

  public setTheme(theme: VisualizerTheme) {
    this.currentTheme = theme;
    this.scene.background = new THREE.Color(theme.background);
    this.activePreset?.onThemeChange?.(theme);
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
    const density = this.config.particleDensity ?? 1.0;
    const spread = this.config.particleSpread ?? 1.0;

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Points) {
          const geom = obj.geometry;
          if (geom?.attributes?.position) {
            const totalCount = geom.attributes.position.count;
            if (density <= 0) {
              obj.visible = false;
              geom.setDrawRange(0, 0);
            } else {
              obj.visible = true;
              const activeCount = Math.max(1, Math.floor(totalCount * Math.min(1.0, density)));
              geom.setDrawRange(0, activeCount);
            }
          }
          if (spread > 0) {
            obj.scale.set(spread, spread, spread);
          }
          if (obj.material instanceof THREE.ShaderMaterial && obj.material.uniforms?.uSpread) {
            obj.material.uniforms.uSpread.value = spread;
          }
        }
      });
    }

    const preset = this.activePreset;
    if (!preset) return;
    if (typeof (preset as any).onParticleConfigChange === 'function') {
      (preset as any).onParticleConfigChange(density, spread);
    }
    if (typeof preset.setCustomParameter === 'function') {
      if (newConfig.particleDensity !== undefined) {
        preset.setCustomParameter('density', newConfig.particleDensity);
        preset.setCustomParameter('particleCount', newConfig.particleDensity);
      }
      if (newConfig.particleSpread !== undefined) {
        preset.setCustomParameter('spread', newConfig.particleSpread);
      }
    }
  }

  public updateConfig(newConfig: Partial<PostProcessingConfig>) {
    Object.assign(this.config, newConfig);
    this.updateBloomConfig(newConfig);
    if (newConfig.persistence !== undefined) {
      this.afterimagePass.enabled = newConfig.persistence > 0.01;
      this.afterimagePass.uniforms['damp'].value = newConfig.persistence;
    }
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
    const hasKaleido = (this.config.kaleidoscope ?? 0) > 0.001;
    uniforms.uCrtBend.value = hasKaleido ? 0.0 : this.config.crtBend;
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
      this.afterimagePass.enabled = true;
      this.afterimagePass.uniforms['damp'].value = this.config.persistence;
      this.persistencePass.enabled = true;
      this.persistencePass.uniforms.uPersistence.value = this.config.persistence;
      this.persistencePass.uniforms.tFeedback.value = currentReadTarget.texture;
    } else {
      this.afterimagePass.enabled = false;
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
    this.afterimagePass.setSize(width, height);
    this.feedbackTargets[0].setSize(width, height);
    this.feedbackTargets[1].setSize(width, height);
    this.textOverlay.resize(width, height, this.renderer.getPixelRatio());

    this.activePreset?.resize?.(width, height);
  }

  public setCanvasBackground(mode: 'dark' | 'white' | 'custom', customColor?: string): void {
    const colorHex = mode === 'dark' ? '#000000' : (mode === 'white' ? '#ffffff' : (customColor ?? this.currentTheme.background ?? '#111116'));
    const color = new THREE.Color(colorHex);
    this.scene.background = color;
    this.renderer.setClearColor(color);
  }

  public setImageOverlay(img: HTMLImageElement | null): void {
    this.textOverlay.setImageOverlay(img);
  }

  public setImageOverlayOpacity(opacity: number): void {
    this.textOverlay.setImageOverlayOpacity(opacity);
  }

  public setImageOverlayScale(scale: number): void {
    this.textOverlay.setImageOverlayScale(scale);
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

  public saveCameraForPreset(presetId: string): void {
    if (typeof localStorage === 'undefined') return;
    const state = this.cameraController.exportState();
    localStorage.setItem(`visualizor_camera_${presetId}`, JSON.stringify(state));
  }

  public resetCameraForPreset(presetId: string): void {
    if (!presetId) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`visualizor_camera_${presetId}`);
    }
    const targetPreset = this.activePreset?.id === presetId ? this.activePreset : getPreset(presetId);
    this.applyDefaultPresetCamera(targetPreset?.cameraConfig);
  }

  public hasSavedCameraForPreset(presetId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    return Boolean(localStorage.getItem(`visualizor_camera_${presetId}`));
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
    if (this.activePreset?.cameraConfig) {
      this.resetCameraForPreset(this.activePreset.id);
    } else {
      this.config.autoRotate = true;
      this.cameraController.reset();
    }
  }
}
