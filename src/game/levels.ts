import { levelCopy } from "@/content/zh-CN";

export type EnemyKind =
  | "folder"
  | "message"
  | "meeting"
  | "requirement"
  | "report"
  | "alert";

export type Formation = "line" | "vee" | "sweep" | "alternating";

export interface WaveSpec {
  label: string;
  kind: EnemyKind;
  count: number;
  formation: Formation;
  support?: EnemyKind;
  elite?: EnemyKind;
  guaranteedDrop?: "coffee" | "skill";
}

export interface LevelSpec {
  name: string;
  zone: string;
  accent: number;
  background: string;
  bossName: string;
  bossTexture: string;
  bossHealth: number;
  bossPhases: number;
  intro: string;
  bossLine: string;
  waves: WaveSpec[];
}

export const LEVELS: readonly LevelSpec[] = [
  {
    name: levelCopy[0].name,
    zone: levelCopy[0].zone,
    accent: 0x32d7a1,
    background: "bg-workstation",
    bossName: levelCopy[0].bossName,
    bossTexture: "boss-demand",
    bossHealth: 130,
    bossPhases: 2,
    intro: levelCopy[0].intro,
    bossLine: levelCopy[0].bossLine,
    waves: [
      { label: levelCopy[0].waves[0], kind: "folder", count: 7, formation: "line" },
      {
        label: levelCopy[0].waves[1],
        kind: "message",
        count: 9,
        formation: "alternating",
        support: "folder",
        guaranteedDrop: "coffee",
      },
      {
        label: levelCopy[0].waves[2],
        kind: "requirement",
        count: 7,
        formation: "vee",
        support: "message",
      },
      {
        label: levelCopy[0].waves[3],
        kind: "report",
        count: 6,
        formation: "sweep",
        support: "folder",
        guaranteedDrop: "skill",
      },
      {
        label: levelCopy[0].waves[4],
        kind: "requirement",
        count: 8,
        formation: "alternating",
        support: "report",
        elite: "requirement",
      },
    ],
  },
  {
    name: levelCopy[1].name,
    zone: levelCopy[1].zone,
    accent: 0xffcc33,
    background: "bg-meeting",
    bossName: levelCopy[1].bossName,
    bossTexture: "boss-meeting",
    bossHealth: 175,
    bossPhases: 2,
    intro: levelCopy[1].intro,
    bossLine: levelCopy[1].bossLine,
    waves: [
      {
        label: levelCopy[1].waves[0],
        kind: "meeting",
        count: 7,
        formation: "line",
        support: "message",
      },
      {
        label: levelCopy[1].waves[1],
        kind: "report",
        count: 7,
        formation: "sweep",
        support: "meeting",
        guaranteedDrop: "coffee",
      },
      {
        label: levelCopy[1].waves[2],
        kind: "alert",
        count: 6,
        formation: "alternating",
        support: "meeting",
      },
      {
        label: levelCopy[1].waves[3],
        kind: "meeting",
        count: 8,
        formation: "vee",
        support: "requirement",
        guaranteedDrop: "skill",
      },
      {
        label: levelCopy[1].waves[4],
        kind: "report",
        count: 9,
        formation: "alternating",
        support: "alert",
        elite: "meeting",
      },
    ],
  },
  {
    name: levelCopy[2].name,
    zone: levelCopy[2].zone,
    accent: 0xff5b45,
    background: "bg-elevator",
    bossName: levelCopy[2].bossName,
    bossTexture: "boss-owner",
    bossHealth: 260,
    bossPhases: 3,
    intro: levelCopy[2].intro,
    bossLine: levelCopy[2].bossLine,
    waves: [
      {
        label: levelCopy[2].waves[0],
        kind: "alert",
        count: 7,
        formation: "alternating",
        support: "folder",
      },
      {
        label: levelCopy[2].waves[1],
        kind: "requirement",
        count: 9,
        formation: "vee",
        support: "message",
        guaranteedDrop: "coffee",
      },
      {
        label: levelCopy[2].waves[2],
        kind: "meeting",
        count: 9,
        formation: "sweep",
        support: "report",
      },
      {
        label: levelCopy[2].waves[3],
        kind: "alert",
        count: 8,
        formation: "alternating",
        support: "requirement",
        guaranteedDrop: "skill",
      },
      {
        label: levelCopy[2].waves[4],
        kind: "report",
        count: 10,
        formation: "vee",
        support: "meeting",
        elite: "alert",
      },
    ],
  },
] as const;

