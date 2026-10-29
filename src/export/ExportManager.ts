import { ExportSettings, VisualizerPreset } from '../types';
import { RenderEngine } from '../engine/RenderEngine';
import { AudioEngine } from '../audio/AudioEngine';

export class ExportManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;

  constructor(
    private readonly renderEngine: RenderEngine,
    private readonly audioEngine: AudioEngine
  ) {}

  public async startExport(
    settings: ExportSettings,
    durationSeconds: number,
    onProgress: (percent: number, timeLeft: number) => void,
    onComplete: (videoBlob: Blob, downloadUrl: string) => void
  ) {
    if (this.isRecording) return;
    this.isRecording = true;
    this.recordedChunks = [];

    const canvas = this.renderEngine.renderer.domElement;
    const canvasStream = canvas.captureStream(settings.fps);
    const audioStream = this.audioEngine.getAudioStream();

    // Combine canvas video track + Web Audio destination track
    const combinedTracks: MediaStreamTrack[] = [
      ...canvasStream.getVideoTracks()
    ];

    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedTracks.push(...audioStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(combinedTracks);

    // Mime type selection
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const bitrateMap = {
      medium: 5_000_000,
      high: 12_000_000,
      ultra: 25_000_000
    };

    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrateMap[settings.quality] || 12_000_000
    });

    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const downloadUrl = URL.createObjectURL(blob);
      onComplete(blob, downloadUrl);
    };

    this.mediaRecorder.start(100);

    const startTime = Date.now();
    const totalMs = durationSeconds * 1000;

    const progressInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(progressInterval);
        return;
      }
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
      const remainingSeconds = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      onProgress(progress, remainingSeconds);

      if (elapsed >= totalMs) {
        clearInterval(progressInterval);
        this.stopExport();
      }
    }, 250);
  }

  /**
   * Batch Recording Mode: Cycles sequentially through presets during a single recording
   */
  public async startBatchExport(
    settings: ExportSettings,
    presetList: VisualizerPreset[],
    secondsPerPreset: number,
    onPresetSwitch: (preset: VisualizerPreset, index: number) => void,
    onProgress: (percent: number, timeLeft: number) => void,
    onComplete: (videoBlob: Blob, downloadUrl: string) => void
  ) {
    if (this.isRecording || presetList.length === 0) return;

    const totalDuration = presetList.length * secondsPerPreset;
    let currentPresetIdx = 0;

    // Set first preset immediately
    this.renderEngine.setPreset(presetList[0]);
    onPresetSwitch(presetList[0], 0);

    const switchInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(switchInterval);
        return;
      }
      currentPresetIdx++;
      if (currentPresetIdx < presetList.length) {
        const nextPreset = presetList[currentPresetIdx];
        this.renderEngine.setPreset(nextPreset);
        onPresetSwitch(nextPreset, currentPresetIdx);
      } else {
        clearInterval(switchInterval);
      }
    }, secondsPerPreset * 1000);

    await this.startExport(
      settings,
      totalDuration,
      onProgress,
      (blob, downloadUrl) => {
        clearInterval(switchInterval);
        onComplete(blob, downloadUrl);
      }
    );
  }

  public stopExport() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
