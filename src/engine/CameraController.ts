import * as THREE from 'three';

export interface CameraViewpoint {
  readonly id: string;
  readonly name: string;
  readonly rotAngle: number;
  readonly tiltAngle: number;
  readonly zoom: number;
}

export const CANONICAL_VIEWPOINTS: Record<string, CameraViewpoint> = {
  default: { id: 'default', name: 'Front (Default)', rotAngle: 0, tiltAngle: 0, zoom: 0.5 },
  front: { id: 'front', name: 'Front (Hero)', rotAngle: 0, tiltAngle: 0, zoom: 0.5 },
  top: { id: 'top', name: 'Top Down', rotAngle: 0, tiltAngle: Math.PI / 2 - 0.05, zoom: 0.5 },
  low: { id: 'low', name: 'Low Angle', rotAngle: 0, tiltAngle: -0.6, zoom: 0.6 },
  iso: { id: 'iso', name: 'Isometric 3/4', rotAngle: Math.PI / 4, tiltAngle: 0.5, zoom: 0.5 },
  isometric: { id: 'isometric', name: 'Isometric 3/4', rotAngle: Math.PI / 4, tiltAngle: 0.5, zoom: 0.5 },
  side: { id: 'side', name: 'Side Profile', rotAngle: Math.PI / 2, tiltAngle: 0, zoom: 0.5 }
};

export interface CameraControllerOptions {
  baseRadius?: number;
  minDistance?: number;
  maxDistance?: number;
  dpadStepAngle?: number;
  orbitSpeed?: number;
  shakeDecayRate?: number;
  lerpSpeed?: number;
}

export function computeZoomDistance(normalizedZoom: number): number {
  if (typeof normalizedZoom !== 'number' || isNaN(normalizedZoom)) return 0.7;
  const clamped = Math.max(0, Math.min(1, normalizedZoom));
  return 0.7 + (2.5 - 0.7) * clamped;
}

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public readonly target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Configuration properties
  public readonly baseRadius: number = 12.0;
  public readonly minDistance: number = 1.0;
  public readonly maxDistance: number = 50.0;
  public readonly dpadStepAngle: number = 0.1;
  public readonly shakeDecayRate: number = 8.0;
  public readonly lerpSpeed: number = 8.0;

  public static readonly MIN_TILT: number = -Math.PI / 2 + 0.05;
  public static readonly MAX_TILT: number = Math.PI / 2 - 0.05;

  // Spherical coordinates
  private radius: number = 12.0;
  private rotAngle: number = 0.0;
  private tiltAngle: number = 0.0;
  private normalizedZoom: number = 0.5;

  // Lerp targets for smooth transitions
  private targetRadius: number = 12.0;
  private targetRotAngle: number = 0.0;
  private targetTiltAngle: number = 0.0;
  private isTransitioning: boolean = false;
  private activeViewpointId: string = 'default';

  // Auto-orbit state
  public autoRotate: boolean = true;
  public autoRotateSpeed: number = 0.4;
  public autoRotateDirection: 1 | -1 = 1;

  // Audio kick shake
  public cameraShakeEnabled: boolean = true;
  public cameraShakeIntensity: number = 0.6;
  private shakeIntensity: number = 0.0;
  private readonly shakeOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, options?: CameraControllerOptions) {
    this.camera = camera;
    if (options?.baseRadius !== undefined) this.baseRadius = options.baseRadius;
    if (options?.minDistance !== undefined) this.minDistance = options.minDistance;
    if (options?.maxDistance !== undefined) this.maxDistance = options.maxDistance;
    if (options?.dpadStepAngle !== undefined) this.dpadStepAngle = options.dpadStepAngle;
    if (options?.orbitSpeed !== undefined) this.autoRotateSpeed = options.orbitSpeed;
    if (options?.shakeDecayRate !== undefined) this.shakeDecayRate = options.shakeDecayRate;
    if (options?.lerpSpeed !== undefined) this.lerpSpeed = options.lerpSpeed;

    this.reset();
  }

  public setPosition(rot: number, tilt: number, zoom?: number, immediate: boolean = false): void {
    const validRot = Number.isFinite(rot) ? rot : 0;
    const validTilt = Number.isFinite(tilt) ? tilt : 0;
    const clampedTilt = Math.max(CameraController.MIN_TILT, Math.min(CameraController.MAX_TILT, validTilt));

    if (zoom !== undefined) {
      this.setZoom(zoom, immediate);
    }

    if (immediate) {
      this.rotAngle = validRot;
      this.tiltAngle = clampedTilt;
      this.targetRotAngle = validRot;
      this.targetTiltAngle = clampedTilt;
      this.isTransitioning = false;
      this.applyTransform();
    } else {
      this.autoRotate = false;
      this.targetRotAngle = validRot;
      this.targetTiltAngle = clampedTilt;
      this.isTransitioning = true;
    }
  }

  public setZoom(zoom: number, immediate: boolean = false): void {
    const validZoom = Number.isFinite(zoom) ? zoom : 0.5;
    const clampedZoom = Math.max(0, Math.min(1, validZoom));
    this.normalizedZoom = clampedZoom;
    const multiplier = computeZoomDistance(clampedZoom);
    const targetDist = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.baseRadius * (multiplier / 1.6))
    );

    if (immediate) {
      this.radius = targetDist;
      this.targetRadius = targetDist;
      this.applyTransform();
    } else {
      this.targetRadius = targetDist;
      this.isTransitioning = true;
    }
  }

  public nudge(axis: 'orbit' | 'tilt', direction: 1 | -1, delta?: number): void {
    const step = (delta !== undefined ? delta : this.dpadStepAngle) * direction;
    if (axis === 'orbit') {
      this.nudgeOrbit(step);
    } else {
      this.nudgeTilt(step);
    }
  }

  public nudgeOrbit(delta: number): void {
    this.autoRotate = false;
    this.rotAngle += delta;
    this.targetRotAngle = this.rotAngle;
    this.isTransitioning = false;
    this.applyTransform();
  }

  public nudgeTilt(delta: number): void {
    this.autoRotate = false;
    const nextTilt = this.tiltAngle + delta;
    this.tiltAngle = Math.max(CameraController.MIN_TILT, Math.min(CameraController.MAX_TILT, nextTilt));
    this.targetTiltAngle = this.tiltAngle;
    this.isTransitioning = false;
    this.applyTransform();
  }

  public stepOrbit(direction: 1 | -1, step: number = this.dpadStepAngle): void {
    this.nudgeOrbit(direction * step);
  }

  public stepTilt(direction: 1 | -1, step: number = this.dpadStepAngle): void {
    this.nudgeTilt(direction * step);
  }

  public setAutoRotate(enabled: boolean, speed?: number, direction?: 1 | -1): void {
    this.autoRotate = enabled;
    if (speed !== undefined) this.autoRotateSpeed = Math.max(0, speed);
    if (direction !== undefined) this.autoRotateDirection = direction;
  }

  public setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = Math.max(0, speed);
  }

  public setRotationDirection(direction: 1 | -1): void {
    this.autoRotateDirection = direction;
  }

  public setCameraShakeEnabled(enabled: boolean): void {
    this.cameraShakeEnabled = enabled;
    if (!enabled) {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      this.applyTransform();
    }
  }

  public setCameraShakeIntensity(intensity: number): void {
    this.cameraShakeIntensity = Math.max(0, Math.min(1, intensity));
  }

  public triggerShake(intensity: number): void {
    if (!this.cameraShakeEnabled || this.cameraShakeIntensity <= 0) {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      return;
    }
    const valid = Number.isFinite(intensity) ? intensity : 0;
    const scaled = valid * this.cameraShakeIntensity;
    this.shakeIntensity = Math.min(1.0, Math.max(this.shakeIntensity, scaled));

    if (this.shakeIntensity > 0.005) {
      const dirX = Math.random() >= 0.5 ? 1 : -1;
      const dirY = Math.random() >= 0.5 ? 1 : -1;
      const dirZ = Math.random() >= 0.5 ? 1 : -1;
      this.shakeOffset.set(
        dirX * (0.2 + Math.random() * 0.3) * this.shakeIntensity * 0.4,
        dirY * (0.2 + Math.random() * 0.3) * this.shakeIntensity * 0.4,
        dirZ * (0.1 + Math.random() * 0.2) * this.shakeIntensity * 0.2
      );
      this.applyTransform();
    }
  }

  public setViewpoint(viewpointId: string, immediate: boolean = false): void {
    const key = viewpointId.toLowerCase();
    const vp = CANONICAL_VIEWPOINTS[key];
    if (!vp) return;
    this.activeViewpointId = vp.id;
    this.autoRotate = false;
    this.setPosition(vp.rotAngle, vp.tiltAngle, vp.zoom, immediate);
  }

  public reset(): void {
    this.activeViewpointId = 'default';
    this.rotAngle = 0;
    this.tiltAngle = 0;
    this.targetRotAngle = 0;
    this.targetTiltAngle = 0;
    this.normalizedZoom = 0.5;
    this.radius = this.baseRadius;
    this.targetRadius = this.baseRadius;
    this.autoRotate = true;
    this.shakeIntensity = 0;
    this.shakeOffset.set(0, 0, 0);
    this.isTransitioning = false;
    this.target.set(0, 0, 0);
    this.applyTransform();
  }

  public update(delta: number, audioBeat: boolean = false, audioBass: number = 0): void {
    const safeDelta = (delta >= 0.008 && delta <= 0.1) ? delta : (1 / 60);

    this.updateShake(safeDelta, audioBeat, audioBass);
    this.updateAutoRotate(safeDelta);
    this.updateTransition(safeDelta);
    this.applyTransform();
  }

  private updateShake(safeDelta: number, audioBeat: boolean, audioBass: number): void {
    if (this.cameraShakeEnabled && audioBeat) {
      const bassFactor = Number.isFinite(audioBass) ? audioBass : 0;
      this.triggerShake(Math.min(1.0, bassFactor * 0.8 + 0.3));
    }

    if (this.cameraShakeEnabled && this.shakeIntensity > 0.02) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity * 0.4,
        (Math.random() - 0.5) * this.shakeIntensity * 0.4,
        (Math.random() - 0.5) * this.shakeIntensity * 0.2
      );
      this.shakeIntensity *= Math.exp(-this.shakeDecayRate * safeDelta);
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeIntensity = 0;
    }
  }

  private updateAutoRotate(safeDelta: number): void {
    if (this.autoRotate && this.autoRotateSpeed > 0 && !this.isTransitioning) {
      const angleDelta = safeDelta * this.autoRotateSpeed * 0.5 * this.autoRotateDirection;
      this.rotAngle = (this.rotAngle + angleDelta) % (Math.PI * 2);
      this.targetRotAngle = this.rotAngle;
    }
  }

  private updateTransition(safeDelta: number): void {
    if (!this.isTransitioning) return;

    const factor = 1 - Math.exp(-this.lerpSpeed * safeDelta);
    let diffRot = ((this.targetRotAngle - this.rotAngle + Math.PI) % (Math.PI * 2));
    if (diffRot < 0) diffRot += Math.PI * 2;
    diffRot -= Math.PI;

    const diffTilt = this.targetTiltAngle - this.tiltAngle;
    const diffRadius = this.targetRadius - this.radius;

    this.rotAngle += diffRot * factor;
    this.tiltAngle += diffTilt * factor;
    this.radius += diffRadius * factor;

    if (
      Math.abs(diffRot) < 0.001 &&
      Math.abs(diffTilt) < 0.001 &&
      Math.abs(diffRadius) < 0.001
    ) {
      this.rotAngle = this.targetRotAngle;
      this.tiltAngle = this.targetTiltAngle;
      this.radius = this.targetRadius;
      this.isTransitioning = false;
    }
  }

  public applyTransform(): void {
    const cosTilt = Math.cos(this.tiltAngle);
    const sinTilt = Math.sin(this.tiltAngle);
    const sinRot = Math.sin(this.rotAngle);
    const cosRot = Math.cos(this.rotAngle);

    this.camera.position.set(
      this.target.x + this.radius * cosTilt * sinRot + this.shakeOffset.x,
      this.target.y + this.radius * sinTilt + this.shakeOffset.y,
      this.target.z + this.radius * cosTilt * cosRot + this.shakeOffset.z
    );
    this.camera.lookAt(this.target);
  }

  // Getters for inspection and testing
  public getCoordinates(): { rotAngle: number; tiltAngle: number; radius: number; zoom: number } {
    return {
      rotAngle: this.rotAngle,
      tiltAngle: this.tiltAngle,
      radius: this.radius,
      zoom: this.normalizedZoom
    };
  }

  public getRotAngle(): number {
    return this.rotAngle;
  }

  public getTiltAngle(): number {
    return this.tiltAngle;
  }

  public getZoom(): number {
    return this.normalizedZoom;
  }

  public getDistance(): number {
    return this.radius;
  }

  public getActiveViewpoint(): string {
    return this.activeViewpointId;
  }

  public getShakeIntensity(): number {
    return this.shakeIntensity;
  }

  public getShakeOffset(): THREE.Vector3 {
    return this.shakeOffset;
  }
}
