export type GameStatus =
  | "menu"
  | "playing"
  | "paused"
  | "gameover"
  | "victory";

export type Grade = "S" | "A" | "B" | "C";

export interface RunStats {
  defeated: number;
  escaped: number;
  maxCombo: number;
}

export interface GameSnapshot {
  status: GameStatus;
  level: number;
  wave: number;
  totalWaves: number;
  levelName: string;
  lives: number;
  maxLives: number;
  score: number;
  combo: number;
  weaponLevel: number;
  skillCharges: number;
  bossName: string | null;
  bossHealth: number | null;
  bossMaxHealth: number | null;
  banner: string | null;
  stats: RunStats;
  finalGrade: Grade | null;
  isNewBest: boolean;
}

export interface GameSettings {
  musicVolume: number;
  effectsVolume: number;
  tutorialSeen: boolean;
}

export interface GameRecord {
  bestScore: number;
  bestGrade: Grade | null;
  cleared: boolean;
}

export type GameCommand =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" }
  | { type: "home" }
  | { type: "skill" }
  | { type: "settings"; settings: GameSettings };
