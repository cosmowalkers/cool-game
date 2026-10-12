import type { GameSettings } from "@/game/types";

type SfxName =
  | "shoot"
  | "hit"
  | "damage"
  | "pickup"
  | "skill"
  | "warning"
  | "boss"
  | "victory"
  | "gameover";

const MELODY = [0, 7, 12, 7, 3, 10, 12, 15, 12, 10, 7, 3, 5, 8, 10, 5];

export class AudioDirector {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private settings: GameSettings;
  private bossLayer = false;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    this.context ??= new AudioContext();
    this.masterGain ??= this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.setValueAtTime(1, this.context.currentTime);
    if (this.context.state !== "running") await this.context.resume();
  }

  startMusic(): void {
    void this.unlock().then(() => {
      if (this.musicTimer || this.settings.musicVolume <= 0) return;
      this.playMusicStep();
      this.musicTimer = setInterval(() => this.playMusicStep(), 190);
    });
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.step = 0;
  }

  setBossLayer(active: boolean): void {
    this.bossLayer = active;
  }

  sfx(name: SfxName): void {
    if (this.settings.effectsVolume <= 0) return;
    void this.unlock().then(() => {
      const presets: Record<SfxName, [number, number, OscillatorType, number]> = {
        shoot: [720, 430, "square", 0.045],
        hit: [190, 120, "sawtooth", 0.07],
        damage: [150, 55, "square", 0.24],
        pickup: [480, 920, "sine", 0.18],
        skill: [95, 860, "sawtooth", 0.55],
        warning: [430, 430, "square", 0.12],
        boss: [75, 48, "sawtooth", 0.5],
        victory: [440, 880, "triangle", 0.7],
        gameover: [210, 70, "sine", 0.7],
      };
      const [from, to, type, duration] = presets[name];
      this.tone(from, to, duration, type, this.settings.effectsVolume * 0.25);
    }).catch(() => {
      // A later user interaction can retry unlocking the context.
    });
  }

  destroy(): void {
    this.stopMusic();
    void this.context?.close();
    this.context = null;
    this.masterGain = null;
  }

  private playMusicStep(): void {
    if (!this.context || this.settings.musicVolume <= 0) return;
    const note = MELODY[this.step % MELODY.length];
    const root = this.bossLayer ? 92 : 110;
    const frequency = root * 2 ** (note / 12);
    this.tone(
      frequency,
      frequency * 0.995,
      0.16,
      this.step % 4 === 0 ? "square" : "triangle",
      this.settings.musicVolume * 0.06
    );
    if (this.step % 4 === 0) {
      this.tone(
        this.bossLayer ? 52 : 58,
        44,
        0.12,
        "sine",
        this.settings.musicVolume * 0.09
      );
    }
    if (this.bossLayer && this.step % 2 === 1) {
      this.tone(180, 95, 0.05, "square", this.settings.musicVolume * 0.03);
    }
    this.step += 1;
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + Math.min(0.012, duration * 0.2)
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.masterGain ?? this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
