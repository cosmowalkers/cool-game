# CLAUDE.md

## 项目概述

NOWORK（下班大逃亡）是 React + Phaser 实现的单人纵版办公室街机射击游戏。
React 负责菜单、HUD 和结算，Phaser 负责每帧更新、碰撞、敌人、关卡及音频。

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm build
```

## 架构约定

- `src/game/GameScene.ts` 是游戏运行时的权威实现。
- `src/game/levels.ts` 只保存关卡、波次和 Boss 配置。
- `src/game/bridge.ts` 是 Phaser 与 React 的唯一通信入口。
- 高频坐标不写入 React state；HUD 只同步分数、生命、关卡等低频状态。
- 用户可见文案统一放在 `src/content/zh-CN.ts`。
- 游戏正式美术位于 `public/assets/`，使用项目原创 SVG。
- 本地记录仅包含最高分、评级、通关状态和音量设置。

## 游戏规则

- 每局 3 条生命，生命耗尽后整局结束。
- 三关各 5 个普通波次，随后进入 Boss 战。
- 普通敌人可逃脱；精英和 Boss 必须击败。
- 武器最高四级，受伤降低一级。
- 「强制下班」可清除弹幕并伤害全场敌人，最多储存两次。
- 关卡推进由敌人状态决定，不使用倒计时作为通关条件。

## 验证

涉及玩法时至少执行：

```bash
pnpm typecheck
pnpm build
```

涉及布局、Canvas 或资源时，还需验证桌面和手机竖屏视口，确认 Canvas 非空、资源加载成功、
HUD 不遮挡战场以及触控技能按钮可操作。
