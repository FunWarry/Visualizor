import { AudioFeatures } from '../types';

export class BeatDetector {
  private history: number[] = new Array(40).fill(0);
  private historyIndex = 0;
  public beatEnergy = 0;
  public isBeat = false;

  update(bassEnergy: number, decay: number = 0.9): boolean {
    let sum = 0;
    for (let i = 0; i < this.history.length; i++) {
      sum += this.history[i];
    }
    const avg = sum / this.history.length;

    let variance = 0;
    for (let i = 0; i < this.history.length; i++) {
      variance += Math.pow(this.history[i] - avg, 2);
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
  private peakTimestamps: number[] = [];

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
    if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > 2.5) {
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
  private streamDestination: MediaStreamAudioDestinationNode | null = null;

  // Audio Sources
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;

  // Demo Synth
  private demoInterval: any = null;
  public isDemoPlaying = false;

  // Analysis Buffers & Detectors
  private freqData!: Uint8Array;
  private timeData!: Uint8Array;
  private beatDetector = new BeatDetector();
  public bpmDetector = new BPMDetector();

  // Playlist Queue
  public playlist: PlaylistTrack[] = [];
  public currentTrackIndex = -1;
  public isShuffle = false;
  public isRepeat = false;

  public isMicActive = false;
  public currentTrackName = 'No track loaded';
  public currentArtistName = 'Visuval Audio Engine';
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
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.streamDestination = this.ctx.createMediaStreamDestination();

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.analyser.connect(this.streamDestination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.audioElement) {
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.gainNode);
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Playlist Management
  public addFilesToPlaylist(files: File[]) {
    files.forEach(file => {
      const track: PlaylistTrack = {
        id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Audio',
        file
      };
      this.playlist.push(track);
    });

    if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
      this.playPlaylistIndex(0);
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
      this.playPlaylistIndex(nextIdx);
    } else {
      const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
      this.playPlaylistIndex(nextIdx);
    }
  }

  public prevTrack() {
    if (this.playlist.length === 0) return;
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.playPlaylistIndex(prevIdx);
  }

  private handleTrackEnded() {
    this.onTrackEnded?.();
    if (this.isRepeat) {
      this.seek(0);
      this.togglePlay();
    } else if (this.playlist.length > 1) {
      this.nextTrack();
    }
  }

  public async loadAudioFile(file: File) {
    this.addFilesToPlaylist([file]);
  }

  public async togglePlay() {
    this.initContext();
    if (this.isDemoPlaying) {
      this.stopDemo();
      return;
    }

    if (!this.audioElement || !this.audioElement.src) {
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
  }

  public async toggleMic(): Promise<boolean> {
    this.initContext();
    if (this.isMicActive) {
      this.disableMic();
      return false;
    } else {
      this.stopDemo();
      if (this.audioElement && !this.audioElement.paused) {
        this.audioElement.pause();
        this.isPlaying = false;
      }

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.ctx && this.gainNode) {
          this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
          this.micSourceNode.connect(this.gainNode);
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
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.isMicActive = false;
  }

  public playDemo() {
    this.initContext();
    this.disableMic();
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.isPlaying = false;
    }

    if (this.isDemoPlaying) return;
    this.isDemoPlaying = true;
    this.isPlaying = true;
    this.currentTrackName = 'Cyber Pulse (Demo Synth)';
    this.currentArtistName = 'Visuval Procedural Audio';

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

    this.analyser.getByteFrequencyData(this.freqData as any);
    this.analyser.getByteTimeDomainData(this.timeData as any);

    const subBass = this.calcBand(1, 4) * this.sensitivity;
    const bass = this.calcBand(4, 14) * this.sensitivity;
    const mid = this.calcBand(14, 180) * this.sensitivity;
    const treble = this.calcBand(180, 600) * this.sensitivity;

    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const norm = (this.timeData[i] - 128) / 128.0;
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
