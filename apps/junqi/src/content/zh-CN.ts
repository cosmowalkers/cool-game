import { RANK_NAMES, type Rank, type Side } from "../game/engine";

export interface RuleSection {
  title: string;
  lines: string[];
}

export const copy = {
  brand: "军棋",
  title: "翻棋对决",
  tagline: "五十枚暗棋混扣棋盘，翻子认军衔，落子定胜负。",
  start: "开始对局",
  backHome: "返回首页",
  rules: "游戏规则",
  close: "关闭",
  unitLabel: "军事推演单元",
  modeLabel: "对战模式",
  humanVsAi: "人机对战",
  localTwoPlayer: "双人对战",
  aiHint: "你执红方在下，AI 执黑方在上",
  localHint: "红方在下先行，双方轮流行动",
  red: "红方",
  black: "黑方",
  aiThinking: "AI 思考中",
  redTurn: "红方",
  blackTurn: "黑方",
  hiddenPiece: "未翻开的棋子",
  emptyPoint: "空位",
  flipHint: "点击任意暗子翻开 · 翻开的棋子才能移动",
  flagUnreachable: "这枚军旗暂时够不着",
  noMoves: "该棋子当前无法移动",
  flipCount: (n: number) => `暗子 ${n}`,
  winTitle: (side: Side) => `${side === "red" ? "红方" : "黑方"}获胜`,
  youWin: "你赢了！",
  aiWins: "AI 获胜",
  winCongrats: "军旗已夺，战斗结束！",
  drawTitle: "握手言和",
  drawSub: "双方鏖战至步数上限，判为和棋",
  winViewBoard: "查看棋盘",
  winPlayAgain: "再来一局",
  restart: "重新开始",
  undo: "悔棋",
  boardLabel: "军棋棋盘",
  rankName: (rank: Rank) => RANK_NAMES[rank],
  sideName: (side: Side) => (side === "red" ? "红方" : "黑方"),
  rankTitle: "军衔大小",
  bombNote: "遇任何棋子同归于尽",
  mineNote: "不可移动，仅工兵可挖",
  flagNote: "不可移动，被夺即负",
  railNote: "直行任意格，工兵可转弯",
  ruleSections: [
    {
      title: "翻棋玩法",
      lines: [
        "开局双方共 50 枚棋子混合洗匀后随机扣满棋盘（行营留空），不分半场归属——你的司令可能就躺在对方阵地里。",
        "每回合二选一：翻开任意一枚暗子，或者移动一枚已翻开的己方棋子。翻子同样消耗一整回合。",
        "暗子不能移动，只有翻开的棋子才能动；翻出来的棋子属于谁，就归谁指挥。",
        "军旗一定藏在自己阵地一侧（棋盘由中间的山界分成上下两半）的随机一个点上，背面朝上——所以想扛旗，就得先进对方阵地把旗翻出来。",
      ],
    },
    {
      title: "吃子规则",
      lines: [
        "军衔大小：司令 > 军长 > 师长 > 旅长 > 团长 > 营长 > 连长 > 排长 > 工兵。",
        "大吃小，同级相遇双方同归于尽。",
        "炸弹与任何棋子相遇，双方同归于尽。",
        "地雷不可移动，仅工兵可挖并存活；其他棋子碰地雷则自己被炸掉，地雷留在原地。",
        "军旗不可移动，被任何棋子夺得即告负。",
      ],
    },
    {
      title: "棋盘 · 铁路 · 行营",
      lines: [
        "双轨是铁路：任何棋子沿铁路直线可走任意格，中间被挡住就停。",
        "单线是公路：所有可动棋子一步一格，只能走到相邻的据点。",
        "工兵是唯一能在铁路上转弯的棋子，可走遍整张铁路网。",
        "上（黑）下（红）两半之间只有三条铁路贯通——左右两条干线和中路那条短接线；夹在这三条铁路之间的两列是「山界」，不能通行。",
        "圆圈是行营：行营内的棋子受保护，敌方不能攻击。",
        "双圈是大本营：棋子可以自由进出，地雷与军旗除外。",
      ],
    },
    {
      title: "胜负判定",
      lines: [
        "夺得对方军旗，立即获胜。",
        "司令阵亡后必须亮出己方军旗——旗一露面，对方就会直扑过来。",
        "对方无合法行动（已无暗子可翻、且无子可动）时获胜。",
        "双方走到 300 步仍未分胜负，判为和棋。",
      ],
    },
  ] as RuleSection[],
} as const;
