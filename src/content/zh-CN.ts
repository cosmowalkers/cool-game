export const copy = {
  brand: "NOWORK",
  title: "下班大逃亡",
  tagline: "坐稳办公椅，冲破今天最后一道封锁。",
  start: "开始逃亡",
  continue: "继续逃亡",
  retry: "重新挑战",
  backHome: "返回首页",
  settings: "设置",
  fullScreen: "全屏",
  exitFullScreen: "退出全屏",
  pause: "暂停",
  pausedLabel: "PAUSED",
  paused: "工作暂停",
  pausedHint: "喘口气，回来继续冲向电梯。",
  music: "背景音乐",
  effects: "游戏音效",
  close: "关闭",
  bestScore: "最高分",
  bestGrade: "最高评级",
  cleared: "已成功下班",
  uncleared: "尚未逃出公司",
  level: "关卡",
  wave: "波次",
  score: "本局得分",
  combo: "摸鱼连击",
  weapon: "纸团火力",
  skill: "强制下班",
  lives: "工牌",
  boss: "封锁目标",
  gameOver: "今晚留下来加班",
  gameOverHint: "工牌已经刷不动了。整理一下文件，从第一关重新突围。",
  victory: "成功下班",
  victoryHint: "电梯门已经关上，工作消息全部免打扰。",
  defeated: "击退任务",
  escaped: "漏网任务",
  finalGrade: "下班评级",
  orientation: "请竖起手机",
  orientationHint: "NOWORK 使用竖屏战场，旋转设备后继续逃亡。",
  tutorialMoveDesktop: "移动鼠标或使用 WASD / 方向键",
  tutorialMoveTouch: "按住屏幕，拖动办公椅",
  tutorialSkillDesktop: "按空格释放「强制下班」",
  tutorialSkillTouch: "点击闪电按钮释放「强制下班」",
  firstLine: "今天，也要准时离开。",
  audioUnlock: "点击开始后启用声音",
  stageComplete: "封锁已突破",
  newBest: "新的最高记录",
  gradeFallback: "-",
  systemLabel: "系统",
  unitLabel: "办公室逃亡单元",
  exitLabel: "出口 18F",
  clockedOutLabel: "已打卡下班",
  overtimeLabel: "加班状态",
  keyboardMoveHint: "WASD / 方向键",
  keyboardSkillHint: "空格 · 强制下班",
  keyboardPauseHint: "ESC · 暂停",
} as const;

export const levelCopy = [
  {
    name: "第一关",
    zone: "工位突围",
    bossName: "需求经理",
    intro: "未读消息正在封锁通道。",
    bossLine: "这个需求很简单，顺手做一下。",
    waves: ["文件来袭", "消息轰炸", "临时需求", "报表追踪", "需求变更"],
  },
  {
    name: "第二关",
    zone: "会议室封锁",
    bossName: "会议主持人",
    intro: "会议邀请已经占满整个日历。",
    bossLine: "最后再占用大家五分钟。",
    waves: ["日程占领", "交叉讨论", "紧急插会", "结论待定", "再同步一次"],
  },
  {
    name: "第三关",
    zone: "电梯口决战",
    bossName: "老板",
    intro: "电梯就在前面，最后一段路。",
    bossLine: "年轻人，要有主人翁意识。",
    waves: ["出口拦截", "任务回流", "全员同步", "临门加塞", "加班封锁"],
  },
] as const;

export type CopyKey = keyof typeof copy;

export function t(key: CopyKey): string {
  return copy[key];
}

export function bossPhaseLabel(phase: number): string {
  return `审批升级 · 第 ${phase} 阶段`;
}
