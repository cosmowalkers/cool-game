import type { GameRecord, GameSettings, Grade } from "@/game/types";

const SETTINGS_KEY = "nowork:settings";
const RECORD_KEY = "nowork:record";

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.55,
  effectsVolume: 0.7,
  tutorialSeen: false,
};

const DEFAULT_RECORD: GameRecord = {
  bestScore: 0,
  bestGrade: null,
  cleared: false,
};

const GRADE_RANK: Record<Grade, number> = { C: 1, B: 2, A: 3, S: 4 };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 隐私模式下本地存储可能不可写，不影响本局游戏。
  }
}

export function loadSettings(): GameSettings {
  return read(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(settings: GameSettings): void {
  write(SETTINGS_KEY, settings);
}

export function loadRecord(): GameRecord {
  return read(RECORD_KEY, DEFAULT_RECORD);
}

export function updateRecord(
  current: GameRecord,
  score: number,
  grade: Grade | null,
  cleared: boolean
): { record: GameRecord; isNewBest: boolean } {
  const isNewBest = score > current.bestScore;
  const nextGrade =
    grade &&
    (!current.bestGrade || GRADE_RANK[grade] > GRADE_RANK[current.bestGrade])
      ? grade
      : current.bestGrade;
  const record = {
    bestScore: Math.max(current.bestScore, score),
    bestGrade: nextGrade,
    cleared: current.cleared || cleared,
  };
  write(RECORD_KEY, record);
  return { record, isNewBest };
}
