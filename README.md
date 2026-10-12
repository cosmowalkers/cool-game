# NOWORK · 下班大逃亡

单人纵版办公室街机射击游戏。玩家坐着办公椅一路突破工位、会议室和电梯口，
击败需求经理、会议主持人和老板，成功准点下班。

## 玩法

- 鼠标跟随或 `WASD` / 方向键移动
- 手机竖屏按住拖动
- 角色自动发射纸团
- 空格键或屏幕闪电按钮释放「强制下班」
- 每局 3 条生命，全部耗尽后从第一关重新挑战
- 三关各 5 个普通波次和 1 场 Boss 战

普通敌人可以逃脱，但会中断连击并影响评级；精英敌人和 Boss 必须击败才能推进。
拾取咖啡可升级武器，最多四级。最终根据得分、剩余生命、技能次数和漏网任务评为
`S/A/B/C`。

## 技术栈

| 部分 | 选型 |
| --- | --- |
| 应用界面 | React 19 + TypeScript |
| 游戏引擎 | Phaser 3 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 + 项目 CSS |
| 图标 | Lucide React |
| 存档 | localStorage |

项目为纯前端单机游戏，不需要服务端。

## 开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

开发服务器默认监听局域网地址，方便使用手机联调。

## 目录

```text
public/assets/            原创 SVG 角色、敌人、Boss、道具和背景
src/content/zh-CN.ts      用户可见文案
src/game/GameScene.ts     Phaser 战斗、关卡和 Boss 状态机
src/game/levels.ts        三关波次配置
src/game/AudioDirector.ts 程序化音乐与音效
src/game/bridge.ts        Phaser 与 React 的状态/命令桥接
src/App.tsx               首页、HUD、设置、暂停和结算界面
```
