#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m' CYAN='\033[0;36m' NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Cool Games — 启动全部 Dev 服务${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

for port in 4100 4101 4102 4103 4104; do
  pid=$(lsof -ti "tcp:$port" 2>/dev/null || true)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null && sleep 1
done

echo -e "${GREEN}▶ Portal  :4100 | NOWORK :4101 | GOMOKU :4102 | 军棋 :4103 | 魔方 :4104${NC}"
echo ""

pnpm dev &       PORTAL_PID=$!
pnpm dev:nowork & NOWORK_PID=$!
pnpm dev:gomoku & GOMOKU_PID=$!
pnpm dev:junqi &  JUNQI_PID=$!
pnpm dev:cube &   CUBE_PID=$!

echo ""
echo -e "${CYAN}----------------------------------------${NC}"
echo -e "${GREEN}  等待就绪...${NC}"
echo -e "${CYAN}----------------------------------------${NC}"

wait_for() {
  local port=$1 name=$2 max=30 n=0
  while [ $n -lt $max ]; do
    if lsof -ti "tcp:$port" >/dev/null 2>&1; then
      echo -e "  ✓ ${GREEN}$name${NC} → http://localhost:$port"
      return 0
    fi
    sleep 1; n=$((n+1))
  done
  echo -e "  ✗ ${name} 超时"
}

wait_for 4100 "Portal"
wait_for 4101 "NOWORK"
wait_for 4102 "GOMOKU"
wait_for 4103 "军棋"
wait_for 4104 "魔方"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  打开 http://localhost:4100${NC}"
echo -e "${CYAN}========================================${NC}"
echo "Ctrl+C 停止"

cleanup() {
  kill $PORTAL_PID $NOWORK_PID $GOMOKU_PID $JUNQI_PID $CUBE_PID 2>/dev/null || true
  wait 2>/dev/null
  echo "已停止。"
}
trap cleanup EXIT INT TERM
wait
