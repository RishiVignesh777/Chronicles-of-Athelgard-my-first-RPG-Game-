/**
 * Zero-Dependency Procedural 8-Bit Web Audio Sound Synthesizer & Level BGM Manager.
 * Creates authentic retro RPG audio effects and atmospheric level music using
 * pure HTML5 Web Audio API, plus optional external MP3/OGG/WAV backgroundMusicUrl playback
 * with smooth crossfade/fade transitions and automatic autoplay unlock.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private _enabled: boolean = true;

  // External Audio Element BGM state
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmTargetUrl: string | null = null;
  private bgmFadeTimer: number | null = null;
  private bgmBaseVolume: number = 0.35;
  private pendingBgm: { url: string | null | undefined; levelIndex: number } | null = null;

  // Procedural Web Audio ambient music loop state
  private ambientInterval: number | null = null;
  private ambientMasterGain: GainNode | null = null;
  private ambientStep: number = 0;
  private currentLevelIndex: number = 0;

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(val: boolean) {
    this._enabled = val;
    if (!val) {
      this.pauseActiveBgm();
    } else {
      this.resumeActiveBgm();
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Call on first user gesture (keydown / pointerdown) to unlock browser audio autoplay.
   */
  public unlock(): void {
    this.initContext();
    if (this.pendingBgm && this._enabled) {
      const { url, levelIndex } = this.pendingBgm;
      this.pendingBgm = null;
      this.playBackgroundMusic(url, levelIndex);
    } else if (this._enabled && this.bgmAudio && this.bgmAudio.paused && this.bgmTargetUrl) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  // ============================================================================
  // LEVEL BACKGROUND MUSIC MANAGER (External URL + Procedural Ambient Fallback)
  // ============================================================================
  public playBackgroundMusic(url?: string | null, levelIndex: number = 0): void {
    const normalizedUrl = url && url.trim() !== '' ? url.trim() : null;
    this.currentLevelIndex = levelIndex;

    // Remember desired BGM in case user unmutes or interacts later
    if (!this._enabled) {
      this.bgmTargetUrl = normalizedUrl;
      this.pendingBgm = { url: normalizedUrl, levelIndex };
      return;
    }

    // If same external URL is already playing, keep it seamlessly
    if (normalizedUrl && this.bgmTargetUrl === normalizedUrl && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    this.stopBackgroundMusic();
    this.bgmTargetUrl = normalizedUrl;

    if (normalizedUrl && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.loop = true;
        audio.volume = 0;
        audio.src = normalizedUrl;
        this.bgmAudio = audio;

        const onError = () => {
          console.warn(`[SoundSynthesizer] Failed to load backgroundMusicUrl (${normalizedUrl}). Falling back to procedural ambient music.`);
          if (this.bgmAudio === audio) {
            this.stopExternalAudio();
            this.startProceduralAmbient(levelIndex);
          }
        };

        audio.addEventListener('error', onError, { once: true });

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              if (this.bgmAudio === audio && this._enabled) {
                this.fadeAudioVolume(audio, 0, this.bgmBaseVolume, 700);
              }
            })
            .catch(() => {
              // Browser blocked autoplay before user interaction; retry on first gesture
              this.pendingBgm = { url: normalizedUrl, levelIndex };
            });
        }
        return;
      } catch {
        // Fallback to procedural ambient
      }
    }

    // Default / Fallback: Procedural level-themed ambient arpeggio
    this.startProceduralAmbient(levelIndex);
  }

  public fadeOutBackgroundMusic(durationMs: number = 400): void {
    this.stopProceduralAmbient(durationMs / 1000);
    if (this.bgmAudio) {
      const audio = this.bgmAudio;
      this.fadeAudioVolume(audio, audio.volume, 0, durationMs, () => {
        if (this.bgmAudio === audio) {
          audio.pause();
        }
      });
    }
  }

  public stopBackgroundMusic(): void {
    this.pendingBgm = null;
    this.stopExternalAudio();
    this.stopProceduralAmbient(0.15);
  }

  private stopExternalAudio(): void {
    if (this.bgmFadeTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmFadeTimer);
      this.bgmFadeTimer = null;
    }
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.src = '';
      } catch {
        // Ignore cleanup errors
      }
      this.bgmAudio = null;
    }
  }

  private pauseActiveBgm(): void {
    if (this.bgmAudio && !this.bgmAudio.paused) {
      this.bgmAudio.pause();
    }
    this.stopProceduralAmbient(0.1);
  }

  private resumeActiveBgm(): void {
    if (this.bgmTargetUrl && this.bgmAudio) {
      this.bgmAudio.play().catch(() => {
        this.pendingBgm = { url: this.bgmTargetUrl, levelIndex: this.currentLevelIndex };
      });
      this.fadeAudioVolume(this.bgmAudio, this.bgmAudio.volume, this.bgmBaseVolume, 400);
    } else if (this.bgmTargetUrl) {
      this.playBackgroundMusic(this.bgmTargetUrl, this.currentLevelIndex);
    } else {
      this.startProceduralAmbient(this.currentLevelIndex);
    }
  }

  private fadeAudioVolume(
    audio: HTMLAudioElement,
    from: number,
    to: number,
    durationMs: number,
    onDone?: () => void
  ): void {
    if (typeof window === 'undefined') return;
    if (this.bgmFadeTimer !== null) {
      window.clearInterval(this.bgmFadeTimer);
      this.bgmFadeTimer = null;
    }
    const steps = Math.max(1, Math.floor(durationMs / 35));
    let currentStep = 0;
    audio.volume = Math.max(0, Math.min(1, from));

    this.bgmFadeTimer = window.setInterval(() => {
      currentStep++;
      const progress = Math.min(1, currentStep / steps);
      try {
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * progress));
      } catch {
        // Ignore volume clamping error
      }
      if (progress >= 1) {
        if (this.bgmFadeTimer !== null) {
          window.clearInterval(this.bgmFadeTimer);
          this.bgmFadeTimer = null;
        }
        onDone?.();
      }
    }, 35);
  }

  private startProceduralAmbient(levelIndex: number): void {
    if (!this._enabled || typeof window === 'undefined') return;
    this.stopProceduralAmbient(0.05);

    try {
      this.initContext();
      if (!this.ctx) return;

      // If browser hasn't unlocked AudioContext yet, queue for first interaction
      if (this.ctx.state === 'suspended') {
        this.pendingBgm = { url: null, levelIndex };
      }

      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.001, this.ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.8);
      master.connect(this.ctx.destination);
      this.ambientMasterGain = master;
      this.ambientStep = 0;

      // Distinct modal scales per chapter mood
      const scales = [
        [220.0, 261.63, 329.63, 392.0, 329.63, 293.66], // Ch1: Forest A minor pentatonic
        [146.83, 174.61, 207.65, 220.0, 174.61, 155.56], // Ch2: Crypt dark Phrygian
        [196.0, 246.94, 293.66, 392.0, 329.63, 293.66], // Ch3: Citadel heroic G major/mixolydian
      ];
      const scale = scales[levelIndex % scales.length];

      const playPulse = () => {
        if (!this.ctx || !this._enabled || !this.ambientMasterGain) return;
        if (this.ctx.state === 'suspended') return;
        const t = this.ctx.currentTime;
        const freq = scale[this.ambientStep % scale.length];
        this.ambientStep++;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = levelIndex % 3 === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);

        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.35, t + 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 1.15);

        osc.connect(noteGain);
        noteGain.connect(this.ambientMasterGain);
        osc.start(t);
        osc.stop(t + 1.2);
      };

      playPulse();
      this.ambientInterval = window.setInterval(playPulse, 950);
    } catch {
      // Audio safety fallback
    }
  }

  private stopProceduralAmbient(fadeSeconds: number = 0.15): void {
    if (this.ambientInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientMasterGain && this.ctx) {
      const gainNode = this.ambientMasterGain;
      this.ambientMasterGain = null;
      try {
        const t = this.ctx.currentTime;
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(Math.max(0.001, gainNode.gain.value), t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, fadeSeconds));
        setTimeout(() => {
          try { gainNode.disconnect(); } catch { /* ignore */ }
        }, fadeSeconds * 1000 + 60);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // ============================================================================
  // RETRO 8-BIT SOUND EFFECTS
  // ============================================================================
  public playSwordSwing() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.14);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      // Audio safety fallback
    }
  }

  public playHit() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      // Audio safety fallback
    }
  }

  public playEnemyDefeat() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {
      // Audio safety fallback
    }
  }

  public playCoin() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.23);
    } catch {
      // Audio safety fallback
    }
  }

  public playChestOpen() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 fanfare
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Audio safety fallback
    }
  }

  public playPlayerHurt() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.19);
    } catch {
      // Audio safety fallback
    }
  }

  public playLevelComplete() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Audio safety fallback
    }
  }

  public playVictoryFanfare() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const chords = [
        { freqs: [523.25, 659.25, 783.99], time: 0, dur: 0.2 },      // C major
        { freqs: [587.33, 739.99, 880.00], time: 0.22, dur: 0.2 },   // D major
        { freqs: [659.25, 830.61, 987.77], time: 0.44, dur: 0.2 },   // E major
        { freqs: [783.99, 987.77, 1046.5, 1318.5], time: 0.68, dur: 0.8 } // High C triumphant chord
      ];
      chords.forEach(c => {
        c.freqs.forEach(f => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = t + c.time;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, start);
          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + c.dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + c.dur + 0.05);
        });
      });
    } catch {
      // Audio safety fallback
    }
  }

  public playStep() {
    if (!this._enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Audio safety fallback
    }
  }
}

export const soundEffects = new SoundSynthesizer();
