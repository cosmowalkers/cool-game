import { loadRecord, loadSettings, saveSettings, updateRecord } from "@/game/storage";
import type {
  GameCommand,
  GameRecord,
  GameSettings,
  GameSnapshot,
  Grade,
} from "@/game/types";

const initialSnapshot: GameSnapshot = {
  status: "menu",
  level: 1,
  wave: 0,
  totalWaves: 5,
  levelName: "",
  lives: 3,
  maxLives: 3,
  score: 0,
  combo: 0,
  weaponLevel: 1,
  skillCharges: 1,
  bossName: null,
  bossHealth: null,
  bossMaxHealth: null,
  banner: null,
  stats: { defeated: 0, escaped: 0, maxCombo: 0 },
  finalGrade: null,
  isNewBest: false,
};

let snapshot = initialSnapshot;
let settings = loadSettings();
let record = loadRecord();

const snapshotListeners = new Set<() => void>();
const settingsListeners = new Set<() => void>();
const recordListeners = new Set<() => void>();
const commandListeners = new Set<(command: GameCommand) => void>();

function notify(listeners: Set<() => void>): void {
  for (const listener of listeners) listener();
}

export const gameBridge = {
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => {
    snapshotListeners.add(listener);
    return () => snapshotListeners.delete(listener);
  },
  patch: (patch: Partial<GameSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    notify(snapshotListeners);
  },
  reset: () => {
    snapshot = { ...initialSnapshot, status: "playing" };
    notify(snapshotListeners);
  },
  finish: (grade: Grade | null, cleared: boolean) => {
    const result = updateRecord(record, snapshot.score, grade, cleared);
    record = result.record;
    snapshot = {
      ...snapshot,
      status: cleared ? "victory" : "gameover",
      finalGrade: grade,
      isNewBest: result.isNewBest,
    };
    notify(snapshotListeners);
    notify(recordListeners);
  },
  getSettings: () => settings,
  subscribeSettings: (listener: () => void) => {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  },
  setSettings: (next: GameSettings) => {
    settings = next;
    saveSettings(next);
    notify(settingsListeners);
    gameBridge.command({ type: "settings", settings: next });
  },
  getRecord: () => record,
  subscribeRecord: (listener: () => void) => {
    recordListeners.add(listener);
    return () => recordListeners.delete(listener);
  },
  command: (command: GameCommand) => {
    for (const listener of commandListeners) listener(command);
  },
  onCommand: (listener: (command: GameCommand) => void) => {
    commandListeners.add(listener);
    return () => commandListeners.delete(listener);
  },
};

export function gradeRun(
  score: number,
  lives: number,
  escaped: number,
  skillCharges: number
): Grade {
  const adjusted = score + lives * 2500 + skillCharges * 1200 - escaped * 350;
  if (adjusted >= 55_000) return "S";
  if (adjusted >= 38_000) return "A";
  if (adjusted >= 24_000) return "B";
  return "C";
}

export type { GameRecord, GameSettings };
