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

  // Analysis Buffers
  private freqData!: Uint8Array;
  private timeData!: Uint8Array;
  private beatDetector = new BeatDetector();

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
      this.onTrackEnded?.();
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

  public async loadAudioFile(file: File) {
    this.stopDemo();
    this.disableMic();
    this.initContext();

    const objectUrl = URL.createObjectURL(file);
    if (this.audioElement) {
      this.audioElement.src = objectUrl;
      this.currentTrackName = file.name.replace(/\.[^/.]+$/, '');
      this.currentArtistName = 'Local Audio';
      await this.audioElement.play();
      this.isPlaying = true;
    }
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
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 392.00]; // C Minor Pentatonic

    this.demoInterval = setInterval(() => {
      if (!this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;

      // 4-on-the-floor kick drum
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

      // Snare on beat 2 & 4
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

      // Melodic arpeggio
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
    }, 125); // 120 BPM
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
        bpm: 120
      };
    }

    this.analyser.getByteFrequencyData(this.freqData as any);
    this.analyser.getByteTimeDomainData(this.timeData as any);

    const subBass = this.calcBand(1, 4) * this.sensitivity;
    const bass = this.calcBand(4, 14) * this.sensitivity;
    const mid = this.calcBand(14, 180) * this.sensitivity;
    const treble = this.calcBand(180, 600) * this.sensitivity;

    // RMS calculation from waveform
    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const norm = (this.timeData[i] - 128) / 128.0;
      sumSquares += norm * norm;
    }
    const rms = Math.min(1.0, Math.sqrt(sumSquares / this.timeData.length) * 2.0 * this.sensitivity);

    const beat = this.beatDetector.update(bass);

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
      bpm: 120
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
