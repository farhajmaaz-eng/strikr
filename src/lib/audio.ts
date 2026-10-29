type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const constructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return constructor ?? null;
}

export class BellAudio {
  private context: AudioContext | null = null;

  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context && context.state !== 'running') {
      try {
        await context.resume();
      } catch {
        // Autoplay policy still locked; the next gesture will retry.
      }
    }
  }

  playBell(volume = 0.75, strikes = 1): void {
    const context = this.ensureContext();
    if (!context || volume <= 0) return;
    if (context.state === 'suspended') void context.resume();

    const start = context.currentTime + 0.02;
    for (let index = 0; index < strikes; index += 1) {
      this.strike(context, start + index * 0.32, volume);
    }
  }

  playCountdown(volume = 0.75): void {
    const context = this.ensureContext();
    if (!context || volume <= 0) return;
    if (context.state === 'suspended') void context.resume();
    this.beep(context, context.currentTime + 0.01, 760, 0.09, volume * 0.55);
  }

  playStartCue(volume = 0.75): void {
    const context = this.ensureContext();
    if (!context || volume <= 0) return;
    if (context.state === 'suspended') void context.resume();
    const start = context.currentTime + 0.01;
    this.beep(context, start, 520, 0.1, volume * 0.5);
    this.beep(context, start + 0.12, 780, 0.12, volume * 0.55);
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    const Constructor = getAudioContextConstructor();
    if (!Constructor) return null;
    try {
      this.context = new Constructor();
      return this.context;
    } catch {
      return null;
    }
  }

  private strike(context: AudioContext, start: number, volume: number): void {
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.5), start + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 1.35);
    master.connect(context.destination);

    const partials = [
      { frequency: 880, gain: 0.5, type: 'sine' as OscillatorType },
      { frequency: 1318.5, gain: 0.28, type: 'sine' as OscillatorType },
      { frequency: 1760, gain: 0.18, type: 'triangle' as OscillatorType },
    ];

    for (const partial of partials) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = partial.type;
      oscillator.frequency.setValueAtTime(partial.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(partial.frequency * 0.995, start + 1.2);
      gain.gain.setValueAtTime(partial.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 1.4);
    }
  }

  private beep(
    context: AudioContext,
    start: number,
    frequency: number,
    duration: number,
    volume: number,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}

export const bellAudio = new BellAudio();
