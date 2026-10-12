export type GameTone = "yellow" | "coral" | "blue";

export interface GameEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image?: string;
  tone: GameTone;
  status: "available" | "coming";
}

export const copy = {
  brand: "COOL GAMES",
  eyebrow: "COSMOWALKERS / PLAYGROUND",
  title: "今天玩什么？",
  description: "把想玩的小游戏放在一起，打开就能开始。",
  available: "开始游戏",
  coming: "即将加入",
  gameCount: (count: number) => `${count} 款游戏`,
  backToPortal: "返回游戏入口",
} as const;

export const games: GameEntry[] = [
  {
    id: "nowork",
    title: "NOWORK",
    subtitle: "下班大逃亡",
    description: "背上书包，冲破需求、会议和老板的封锁，准点逃离公司。",
    href: import.meta.env.VITE_NOWORK_URL || "/nowork/",
    image: "/assets/nowork-player.png",
    tone: "yellow",
    status: "available",
  },
];
