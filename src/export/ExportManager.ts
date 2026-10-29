import { ExportSettings } from '../types';
import { RenderEngine } from '../engine/RenderEngine';
import { AudioEngine } from '../audio/AudioEngine';

export class ExportManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;

  constructor(
    private renderEngine: RenderEngine,
    private audioEngine: AudioEngine
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

  public stopExport() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
