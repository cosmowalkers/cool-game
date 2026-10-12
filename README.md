# cool-game

Cool Games 是多个 Web 游戏的统一 monorepo。每个游戏保留独立的应用边界，统一入口由 `apps/portal` 提供。

## 目录

```text
apps/
  nowork/    # NOWORK · 下班大逃亡
  portal/    # 游戏统一入口
scripts/
  assemble-dist.mjs
```

## 开发

```bash
pnpm install
pnpm dev          # 启动统一入口
pnpm dev:nowork   # 单独启动 NOWORK
```

开发时入口和游戏分别运行在不同端口。生产构建会把入口和 NOWORK 组装到同一个 `dist/`：

```text
dist/
  index.html
  assets/
  nowork/
    index.html
    assets/
```

## 构建

```bash
pnpm build
```

后续新增 Web 游戏时，在 `apps/` 下增加一个独立应用，再在 `apps/portal/src/content/zh-CN.ts` 的游戏注册表中添加入口信息。根构建会自动扫描 `apps/*/dist` 并按应用目录名组装，不需要再修改组装脚本。
