import { AudioFeatures } from '../types';

export class BeatDetector {
  private history: number[] = new Array(40).fill(0);
  private historyIndex = 0;
  public beatEnergy = 0;
  public isBeat = false;

  update(bassEnergy: number, decay: number = 0.9): boolean {
    let sum = 0;
    for (const val of this.history) {
      sum += val;
    }
    const avg = sum / this.history.length;

    let variance = 0;
    for (const val of this.history) {
      variance += Math.pow(val - avg, 2);
    }
    variance /= this.history.length;

    const threshold = avg * Math.max(1.18, Math.min(1.7, -12 * variance + 1.45));

    if (bassEnergy > threshold && bassEnergy > 0.3 && this.beatEnergy < 0.25) {
      this.isBeat = true;
      this.beatEnergy = 1.0;
    } else {
      this.isBeat = false;
      this.beatEnergy *= decay;
    }

    this.history[this.historyIndex] = bassEnergy;
    this.historyIndex = (this.historyIndex + 1) % this.history.length;

    return this.isBeat;
  }
}

export class BPMDetector {
  private tapTimes: number[] = [];
  public manualBPM: number | null = null;
  public detectedBPM = 120;
  private readonly peakTimestamps: number[] = [];

  recordBeat(timeSeconds: number) {
    if (this.manualBPM !== null) return;
    this.peakTimestamps.push(timeSeconds);
    if (this.peakTimestamps.length > 20) {
      this.peakTimestamps.shift();
    }

    if (this.peakTimestamps.length >= 4) {
      const intervals: number[] = [];
      for (let i = 1; i < this.peakTimestamps.length; i++) {
        const dt = this.peakTimestamps[i] - this.peakTimestamps[i - 1];
        if (dt >= 0.25 && dt <= 1.2) { // 50 to 240 BPM range
          intervals.push(dt);
        }
      }
      if (intervals.length >= 3) {
        intervals.sort((a, b) => a - b);
        const medianDt = intervals[Math.floor(intervals.length / 2)];
        const bpm = Math.round(60 / medianDt);
        if (bpm >= 60 && bpm <= 200) {
          this.detectedBPM = Math.round(this.detectedBPM * 0.75 + bpm * 0.25);
        }
      }
    }
  }

  tap(): number {
    const now = performance.now() / 1000;
    if (this.tapTimes.length > 0 && now - (this.tapTimes.at(-1) ?? 0) > 2.5) {
      this.tapTimes = [];
    }
    this.tapTimes.push(now);
    if (this.tapTimes.length > 8) this.tapTimes.shift();

    if (this.tapTimes.length >= 2) {
      let sum = 0;
      for (let i = 1; i < this.tapTimes.length; i++) {
        sum += this.tapTimes[i] - this.tapTimes[i - 1];
      }
      const avgDt = sum / (this.tapTimes.length - 1);
      const bpm = Math.round(60 / avgDt);
      if (bpm >= 50 && bpm <= 240) {
        this.manualBPM = bpm;
        this.detectedBPM = bpm;
      }
    }
    return this.detectedBPM;
  }

  resetManual() {
    this.manualBPM = null;
    this.tapTimes = [];
  }
}

export interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  file?: File;
  url?: string;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private reactivityGainNode: GainNode | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;

  // Audio Sources
  private readonly audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private screenStream: MediaStream | null = null;
  private screenSourceNode: MediaStreamAudioSourceNode | null = null;

  // Demo Synth
  private demoInterval: ReturnType<typeof setInterval> | null = null;
  public isDemoPlaying = false;

  // Analysis Buffers & Detectors
  private freqData!: Uint8Array<ArrayBuffer>;
  private timeData!: Uint8Array<ArrayBuffer>;
  private readonly beatDetector = new BeatDetector();
  public bpmDetector = new BPMDetector();

  // Playlist Queue
  public playlist: PlaylistTrack[] = [];
  public currentTrackIndex = -1;
  public isShuffle = false;
  public isRepeat = false;

  public isMicActive = false;
  public isScreenAudioActive = false;
  public isScreenAudioPassthrough = false;
  private screenPassthroughGain: GainNode | null = null;
  public onScreenAudioEnded?: () => void;
  public currentTrackName = 'No track loaded';
  public currentArtistName = 'Visualizor Audio Engine';
  public duration = 0;
  public currentTime = 0;
  public isPlaying = false;
  public volume = 0.8;
  public sensitivity = 1.0;

  // Callbacks
  public onTrackEnded?: () => void;
  public onTimeUpdate?: (current: number, total: number) => void;
  public onPlaylistChange?: (playlist: PlaylistTrack[], currentIndex: number) => void;
  public onBpmChange?: (bpm: number, isManual: boolean) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.currentTime = this.audioElement.currentTime;
        this.duration = this.audioElement.duration || 0;
        this.onTimeUpdate?.(this.currentTime, this.duration);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.handleTrackEnded();
    });
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.reactivityGainNode = this.ctx.createGain();
      this.reactivityGainNode.gain.setValueAtTime(this.sensitivity, this.ctx.currentTime);

      this.streamDestination = this.ctx.createMediaStreamDestination();

      // Audio routing (Strictly decoupled Volume vs Visual Reactivity):
      // 1. Local playback routes through gainNode ONLY to speakers and video recording stream:
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.connect(this.streamDestination);
      // 2. Visual reactivity routes through reactivityGainNode ONLY to analyser:
      this.reactivityGainNode.connect(this.analyser);
      // NOTE: gainNode does NOT connect to analyser, and analyser does NOT connect to ctx.destination!
      // Lowering or muting speaker volume never affects visual reactivity, and vice-versa.

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.audioElement) {
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.gainNode);
        this.audioSourceNode.connect(this.reactivityGainNode);
      }
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // Playlist Management
  public addFilesToPlaylist(files: File[]) {
    files.forEach(file => {
      const track: PlaylistTrack = {
        id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Audio',
        file
      };
      this.playlist.push(track);
    });

    if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
      void this.playPlaylistIndex(0);
    } else {
      this.onPlaylistChange?.(this.playlist, this.currentTrackIndex);
    }
  }

  public async playPlaylistIndex(index: number) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[index];

    this.stopDemo();
    this.disableMic();
    this.disableScreenAudioCapture();
    this.initContext();

    if (track.file && this.audioElement) {
      this.audioElement.src = URL.createObjectURL(track.file);
      this.currentTrackName = track.name;
      this.currentArtistName = track.artist;
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn('Playback error:', err);
      }
    }
    this.onPlaylistChange?.(this.playlist, this.currentTrackIndex);
  }

  public nextTrack() {
    if (this.playlist.length === 0) return;
    if (this.isShuffle) {
      const nextIdx = Math.floor(Math.random() * this.playlist.length);
      void this.playPlaylistIndex(nextIdx);
    } else {
      const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
      void this.playPlaylistIndex(nextIdx);
    }
  }

  public prevTrack() {
    if (this.playlist.length === 0) return;
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    void this.playPlaylistIndex(prevIdx);
  }

  private handleTrackEnded() {
    this.onTrackEnded?.();
    if (this.isRepeat) {
      this.seek(0);
      void this.togglePlay();
    } else if (this.playlist.length > 1) {
      this.nextTrack();
    }
  }

  public loadAudioFile(file: File) {
    this.addFilesToPlaylist([file]);
  }

  public async togglePlay() {
    this.initContext();
    if (this.isScreenAudioActive) {
      this.disableScreenAudioCapture();
      return;
    }
    if (this.isMicActive) {
      this.disableMic();
      return;
    }
    if (this.isDemoPlaying) {
      this.stopDemo();
      return;
    }

    if (!this.audioElement?.src) {
      this.playDemo();
      return;
    }

    if (this.audioElement.paused) {
      await this.audioElement.play();
      this.isPlaying = true;
    } else {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && this.duration > 0) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.duration));
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.screenPassthroughGain && this.ctx && this.isScreenAudioPassthrough) {
      this.screenPassthroughGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0, Math.min(3, val));
    if (this.reactivityGainNode && this.ctx) {
      this.reactivityGainNode.gain.setValueAtTime(this.sensitivity, this.ctx.currentTime);
    }
  }

  public getVolumeGainValue(): number {
    return this.gainNode?.gain.value ?? this.volume;
  }

  public getReactivityGainValue(): number {
    return this.reactivityGainNode?.gain.value ?? this.sensitivity;
  }

  public setScreenAudioPassthrough(enabled: boolean): void {
    this.isScreenAudioPassthrough = enabled;
    if (this.screenPassthroughGain && this.ctx) {
      this.screenPassthroughGain.gain.setValueAtTime(
        enabled ? this.volume : 0.0,
        this.ctx.currentTime
      );
    }
  }

  public async toggleMic(): Promise<boolean> {
    this.initContext();
    if (this.isMicActive) {
      this.disableMic();
      return false;
    } else {
      this.stopDemo();
      this.disableScreenAudioCapture();
      if (this.audioElement?.paused === false) {
        this.audioElement.pause();
        this.isPlaying = false;
      }

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.ctx && this.analyser) {
          this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
          this.micSourceNode.connect(this.reactivityGainNode ?? this.analyser);
          this.isMicActive = true;
          this.currentTrackName = 'Live Microphone';
          this.currentArtistName = 'Real-time Audio Input';
          return true;
        }
      } catch (err) {
        console.error('Error accessing microphone:', err);
        this.isMicActive = false;
        return false;
      }
    }
    return false;
  }

  private disableMic() {
    this.micStream?.getTracks().forEach(track => track.stop());
    this.micStream = null;
    this.micSourceNode?.disconnect();
    this.micSourceNode = null;
    this.isMicActive = false;
  }

  public async toggleScreenAudioCapture(): Promise<boolean> {
    this.initContext();
    if (this.isScreenAudioActive) {
      this.disableScreenAudioCapture();
      return false;
    }

    this.stopDemo();
    this.disableMic();
    if (this.audioElement?.paused === false) {
      this.audioElement.pause();
      this.isPlaying = false;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const audioTracks = this.screenStream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.disableScreenAudioCapture();
        throw new Error('NO_AUDIO_TRACK');
      }

      if (this.ctx && this.analyser) {
        this.screenSourceNode = this.ctx.createMediaStreamSource(this.screenStream);
        // Connect to reactivityGainNode -> analyser for visualization (prevents speaker feedback loops)
        this.screenSourceNode.connect(this.reactivityGainNode ?? this.analyser);
        if (this.streamDestination) {
          this.screenSourceNode.connect(this.streamDestination);
        }

        // Optional passthrough gain (strictly muted 0.0 by default to prevent audio feedback loop)
        this.screenPassthroughGain = this.ctx.createGain();
        this.screenPassthroughGain.gain.setValueAtTime(
          this.isScreenAudioPassthrough ? this.volume : 0.0,
          this.ctx.currentTime
        );
        this.screenSourceNode.connect(this.screenPassthroughGain);
        this.screenPassthroughGain.connect(this.ctx.destination);

        this.isScreenAudioActive = true;
        this.currentTrackName = 'System / Screen Audio';
        this.currentArtistName = 'Live Display Media Cast (Muted Return)';

        const onEndedHandler = () => {
          this.disableScreenAudioCapture();
          this.onScreenAudioEnded?.();
        };

        audioTracks[0].onended = onEndedHandler;
        const videoTracks = this.screenStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].onended = onEndedHandler;
        }

        return true;
      }
    } catch (err: unknown) {
      this.disableScreenAudioCapture();
      if ((err as Error)?.message === 'NO_AUDIO_TRACK') {
        throw err;
      }
      console.warn('System audio capture was cancelled or failed:', err);
      return false;
    }
    return false;
  }

  public disableScreenAudioCapture() {
    this.screenStream?.getTracks().forEach(track => track.stop());
    this.screenStream = null;
    this.screenSourceNode?.disconnect();
    this.screenSourceNode = null;
    this.screenPassthroughGain?.disconnect();
    this.screenPassthroughGain = null;
    this.isScreenAudioActive = false;
  }

  public playDemo() {
    this.initContext();
    this.disableMic();
    this.disableScreenAudioCapture();
    if (this.audioElement?.paused === false) {
      this.audioElement.pause();
      this.isPlaying = false;
    }

    if (this.isDemoPlaying) return;
    this.isDemoPlaying = true;
    this.isPlaying = true;
    this.currentTrackName = 'Cyber Pulse (Demo Synth)';
    this.currentArtistName = 'Visualizor Procedural Audio';

    let step = 0;
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 392.00];

    this.demoInterval = setInterval(() => {
      if (!this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;

      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        g.gain.setValueAtTime(1.0, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g);
        g.connect(this.gainNode);
        if (this.reactivityGainNode) g.connect(this.reactivityGainNode);
        osc.start(t);
        osc.stop(t + 0.22);
      }

      if (step % 8 === 4) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(this.gainNode);
        if (this.reactivityGainNode) g.connect(this.reactivityGainNode);
        osc.start(t);
        osc.stop(t + 0.15);
      }

      const note = scale[step % scale.length];
      const oscPluck = this.ctx.createOscillator();
      const gPluck = this.ctx.createGain();
      oscPluck.type = 'sawtooth';
      oscPluck.frequency.setValueAtTime(note, t);
      gPluck.gain.setValueAtTime(0.2, t);
      gPluck.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      oscPluck.connect(gPluck);
      gPluck.connect(this.gainNode);
      if (this.reactivityGainNode) gPluck.connect(this.reactivityGainNode);
      oscPluck.start(t);
      oscPluck.stop(t + 0.18);

      step = (step + 1) % 16;
    }, 125);
  }

  public stopDemo() {
    this.isDemoPlaying = false;
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }

  public getAudioStream(): MediaStream | null {
    return this.streamDestination?.stream || null;
  }

  public getContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  public getAnalyser(): AnalyserNode {
    this.initContext();
    return this.analyser!;
  }

  public getFeatures(): AudioFeatures {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(1024),
        timeDomainData: new Uint8Array(1024),
        subBass: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        rms: 0,
        beat: false,
        beatEnergy: 0,
        bpm: this.bpmDetector.detectedBPM
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const subBass = this.calcBand(1, 4) * this.sensitivity;
    const bass = this.calcBand(4, 14) * this.sensitivity;
    const mid = this.calcBand(14, 180) * this.sensitivity;
    const treble = this.calcBand(180, 600) * this.sensitivity;

    let sumSquares = 0;
    for (const val of this.timeData) {
      const norm = (val - 128) / 128.0;
      sumSquares += norm * norm;
    }
    const rms = Math.min(1.0, Math.sqrt(sumSquares / this.timeData.length) * 2.0 * this.sensitivity);

    const beat = this.beatDetector.update(bass);
    if (beat && this.ctx) {
      this.bpmDetector.recordBeat(this.ctx.currentTime);
      this.onBpmChange?.(this.bpmDetector.detectedBPM, this.bpmDetector.manualBPM !== null);
    }

    return {
      frequencyData: this.freqData,
      timeDomainData: this.timeData,
      subBass: Math.min(1.0, subBass),
      bass: Math.min(1.0, bass),
      mid: Math.min(1.0, mid),
      treble: Math.min(1.0, treble),
      rms,
      beat,
      beatEnergy: this.beatDetector.beatEnergy,
      bpm: this.bpmDetector.detectedBPM
    };
  }

  private calcBand(startBin: number, endBin: number): number {
    let sum = 0;
    const count = Math.max(1, endBin - startBin);
    for (let i = startBin; i < endBin && i < this.freqData.length; i++) {
      sum += this.freqData[i];
    }
    return (sum / count) / 255.0;
  }
}
