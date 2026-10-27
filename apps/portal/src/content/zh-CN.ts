export type GameTone = "yellow" | "coral" | "blue";

export interface GameEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image?: string;
  art?: "gomoku" | "junqi" | "cube";
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
    id: "junqi",
    title: "军棋",
    subtitle: "翻棋对决",
    description: "运筹帷幄，步步为营。翻子搏杀，夺旗致胜。",
    href: import.meta.env.VITE_JUNQI_URL || "/junqi/",
    art: "junqi",
    tone: "blue",
    status: "available",
  },
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
  {
    id: "gomoku",
    title: "GOMOKU",
    subtitle: "五子棋",
    description: "落子成线，支持人机对战和双人对战。",
    href: import.meta.env.VITE_GOMOKU_URL || "/gomoku/",
    art: "gomoku",
    tone: "blue",
    status: "available",
  },
  {
    id: "cube",
    title: "CUBE",
    subtitle: "3D 魔方",
    description: "拖动查看魔方，旋转每一面，让六种颜色回到各自的位置。",
    href: import.meta.env.VITE_CUBE_URL || "/cube/",
    art: "cube",
    tone: "coral",
    status: "available",
  },
];
