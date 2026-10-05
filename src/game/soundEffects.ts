/**
 * Zero-Dependency Procedural 8-Bit Web Audio Sound Synthesizer.
 * Creates authentic retro RPG audio effects using pure HTML5 Web Audio API,
 * requiring zero external sound files or network downloads!
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

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

  public playSwordSwing() {
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
