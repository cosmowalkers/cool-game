/* ============================== 军棋 · 翻棋引擎 ============================== */

export const ROWS = 12;
export const COLS = 5;
/** 每方阵地占 6 行：黑方 0-5，红方 6-11 */
export const HALF_ROWS = 6;

/* ---- 棋子军衔 ---- */
export const enum Rank {
  Engineer = 1,  // 工兵
  Paichang = 2,  // 排长
  Lianzhang = 3, // 连长
  Yingzhang = 4, // 营长
  Tuanzhang = 5, // 团长
  Lvzhang = 6,  // 旅长
  Shizhang = 7, // 师长
  Junzhang = 8,  // 军长
  Siling = 9,    // 司令
  Bomb = 10,     // 炸弹
  Mine = 11,     // 地雷
  Flag = 12,     // 军旗
}

export const RANK_NAMES: Record<Rank, string> = {
  [Rank.Engineer]: "工兵",
  [Rank.Paichang]: "排长",
  [Rank.Lianzhang]: "连长",
  [Rank.Yingzhang]: "营长",
  [Rank.Tuanzhang]: "团长",
  [Rank.Lvzhang]: "旅长",
  [Rank.Shizhang]: "师长",
  [Rank.Junzhang]: "军长",
  [Rank.Siling]: "司令",
  [Rank.Bomb]: "炸弹",
  [Rank.Mine]: "地雷",
  [Rank.Flag]: "军旗",
};

export type Side = "red" | "black";

export interface Piece {
  rank: Rank;
  side: Side;
  faceUp: boolean;
}

export type Cell = Piece | null;

export interface Position { row: number; col: number; }

export type Board = Cell[][];

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]] as const;
/** 8 邻域：翻子风险 / 落点威胁评估用 */
const NB8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;

/* ---- 棋盘特殊位置 ---- */

/** 行营（受保护位置，开局为空） */
export const CAMP_POSITIONS: Position[] = [
  { row: 2, col: 1 }, { row: 2, col: 3 },
  { row: 3, col: 2 },
  { row: 4, col: 1 }, { row: 4, col: 3 },
  { row: 7, col: 1 }, { row: 7, col: 3 },
  { row: 8, col: 2 },
  { row: 9, col: 1 }, { row: 9, col: 3 },
];

/** 大本营 */
export const HQ_POSITIONS: { red: Position[]; black: Position[] } = {
  red: [{ row: 11, col: 1 }, { row: 11, col: 3 }],
  black: [{ row: 0, col: 1 }, { row: 0, col: 3 }],
};

/** 双方阵地所在行 */
export const TERRITORY_ROWS: Record<Side, number[]> = {
  black: [0, 1, 2, 3, 4, 5],
  red: [6, 7, 8, 9, 10, 11],
};

/** 横向铁路所在行 */
const RAILWAY_ROWS = new Set([1, 5, 6, 10]);
/** 纵向铁路所在列（左右两条干线，贯穿全场） */
const RAILWAY_COLS = new Set([0, 4]);
/**
 * 山界所在列：两方势力之间由三条铁路贯通（第 0、2、4 列），
 * 每两条铁路之间有一道山界（第 1、3 列），山界处不能通行。
 * 中路那条铁路只存在于两方前线之间（第 5~6 行），是一条短接线。
 */
const MOUNTAIN_COLS = new Set([1, 3]);
const MID_RAIL_COL = 2;

const railKey = (r: number, c: number) => `${r},${c}`;
const RAIL_CELLS = new Set<string>();
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++)
    if (RAILWAY_ROWS.has(r) || RAILWAY_COLS.has(c)) RAIL_CELLS.add(railKey(r, c));
// 中路铁路短接线：两方前线之间
for (let r = HALF_ROWS - 1; r <= HALF_ROWS; r++) RAIL_CELLS.add(railKey(r, MID_RAIL_COL));

/** 斜线公路：行营周围 3×3 范围内的 8 个相邻兵站都可一步进入行营。 */
export const DIAGONAL_ROADS: [Position, Position][] = CAMP_POSITIONS.flatMap((camp) =>
  ([
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ] as const)
    .map(([dr, dc]) => [{ row: camp.row, col: camp.col }, { row: camp.row + dr, col: camp.col + dc }] as [Position, Position])
    .filter(([, to]) => isOnBoard(to.row, to.col))
);

export function isCamp(pos: Position): boolean {
  return CAMP_POSITIONS.some((p) => p.row === pos.row && p.col === pos.col);
}

export function isHeadquarters(pos: Position, side?: Side): boolean {
  const all = side
    ? HQ_POSITIONS[side]
    : [...HQ_POSITIONS.red, ...HQ_POSITIONS.black];
  return all.some((p) => p.row === pos.row && p.col === pos.col);
}

export function isRailway(pos: Position): boolean {
  return RAIL_CELLS.has(railKey(pos.row, pos.col));
}

export function isOnBoard(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/**
 * 山界：两方势力之间由三条铁路贯通（第 0、2、4 列），每两条铁路之间有一道山界
 * （第 1、3 列），山界处不能通行。只有这三条铁路能跨越前线。
 */
export function isMountainStep(from: Position, to: Position): boolean {
  if (from.col !== to.col) return false;
  if (!MOUNTAIN_COLS.has(from.col)) return false; // 三条铁路照常通行
  return (
    (from.row === HALF_ROWS - 1 && to.row === HALF_ROWS) ||
    (from.row === HALF_ROWS && to.row === HALF_ROWS - 1)
  );
}

/** 山界所在的列（用于绘制山形标记） */
export const MOUNTAIN_COLUMNS: number[] = [...MOUNTAIN_COLS];

/* ---- 初始棋子 ---- */

export function createPieces(side: Side): Piece[] {
  const pieces: Piece[] = [];
  const add = (rank: Rank, count: number) => {
    for (let i = 0; i < count; i++) pieces.push({ rank, side, faceUp: false });
  };
  add(Rank.Siling, 1);
  add(Rank.Junzhang, 1);
  add(Rank.Shizhang, 2);
  add(Rank.Lvzhang, 2);
  add(Rank.Tuanzhang, 2);
  add(Rank.Yingzhang, 2);
  add(Rank.Lianzhang, 3);
  add(Rank.Paichang, 3);
  add(Rank.Engineer, 3);
  add(Rank.Bomb, 2);
  add(Rank.Mine, 3);
  add(Rank.Flag, 1);
  return pieces;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 可摆放棋子的点：60 格去掉 10 个行营，正好 50 个 */
export function boardSlots(): Position[] {
  const slots: Position[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!isCamp({ row: r, col: c })) slots.push({ row: r, col: c });
  return slots;
}

/**
 * 翻棋开局：双方共 50 枚棋子混合洗匀后随机扣满 50 个非行营点，全部背面朝上。
 * 不分半场归属——你的司令可能躺在对方阵地里，行营开局留空。
 * 军旗固定藏在己方两个大本营中的一个，背面朝上。
 */
export function createBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
  const slots = boardSlots();
  const taken = new Set<string>();
  for (const side of ["black", "red"] as Side[]) {
    const own = HQ_POSITIONS[side].filter((s) => !taken.has(railKey(s.row, s.col)));
    const cell = own[Math.floor(Math.random() * own.length)];
    board[cell.row][cell.col] = { rank: Rank.Flag, side, faceUp: false };
    taken.add(railKey(cell.row, cell.col));
  }
  const rest = shuffle([
    ...createPieces("red").filter((p) => p.rank !== Rank.Flag),
    ...createPieces("black").filter((p) => p.rank !== Rank.Flag),
  ]);
  let i = 0;
  for (const slot of slots) {
    if (taken.has(railKey(slot.row, slot.col))) continue;
    board[slot.row][slot.col] = rest[i++];
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/* ---- 移动规则 ---- */

/**
 * 公路：相邻节点一步（含行营对角斜线）。
 * 铁路：所有棋子沿铁路直线走任意格；工兵可沿铁路转弯走遍整条铁路网。
 * 行营内的棋子受保护，不能被攻击；大本营内的棋子不能再次移动；山界两侧中路不通。
 */
export function getMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece || !piece.faceUp) return [];
  if (piece.rank === Rank.Flag || piece.rank === Rank.Mine || isHeadquarters(pos)) return [];

  const found = new Map<string, Position>();
  const add = (r: number, c: number) => {
    if (!found.has(railKey(r, c))) found.set(railKey(r, c), { row: r, col: c });
  };

  const canCapture = (r: number, c: number) => {
    const t = board[r][c];
    if (!t || !t.faceUp || t.side === piece.side) return false;
    if (isCamp({ row: r, col: c })) return false; // 行营内不可攻击
    return true;
  };

  /* ---- 铁路移动 ---- */
  if (RAIL_CELLS.has(railKey(pos.row, pos.col))) {
    if (piece.rank === Rank.Engineer) {
      // 工兵：沿铁路网的 BFS，可任意转弯，但不能穿过任何棋子
      const visited = new Set([railKey(pos.row, pos.col)]);
      const queue: Position[] = [pos];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const [dr, dc] of DIRS) {
          const nr = cur.row + dr, nc = cur.col + dc;
          const key = railKey(nr, nc);
          if (!isOnBoard(nr, nc) || !RAIL_CELLS.has(key) || visited.has(key)) continue;
          if (isMountainStep(cur, { row: nr, col: nc })) continue;
          const t = board[nr][nc];
          if (t) {
            if (canCapture(nr, nc)) add(nr, nc); // 只能吃掉挡路的对方明子，不能穿过
          } else {
            visited.add(key);
            add(nr, nc);
            queue.push({ row: nr, col: nc });
          }
        }
      }
    } else {
      // 其他棋子：沿铁路直线任意格，遇子即停
      for (const [dr, dc] of DIRS) {
        for (let step = 1; ; step++) {
          const nr = pos.row + dr * step, nc = pos.col + dc * step;
          if (!isOnBoard(nr, nc) || !RAIL_CELLS.has(railKey(nr, nc))) break;
          const prev = { row: pos.row + dr * (step - 1), col: pos.col + dc * (step - 1) };
          if (isMountainStep(prev, { row: nr, col: nc })) break;
          const t = board[nr][nc];
          if (t) {
            if (canCapture(nr, nc)) add(nr, nc);
            break;
          }
          add(nr, nc);
        }
      }
    }
  }

  /* ---- 公路移动：上下左右相邻一格 ---- */
  for (const [dr, dc] of DIRS) {
    const nr = pos.row + dr, nc = pos.col + dc;
    if (!isOnBoard(nr, nc)) continue;
    if (isMountainStep(pos, { row: nr, col: nc })) continue;
    const t = board[nr][nc];
    if (t) {
      if (canCapture(nr, nc)) add(nr, nc);
    } else {
      add(nr, nc);
    }
  }

  /* ---- 公路斜线（行营对角） ---- */
  for (const [a, b] of DIAGONAL_ROADS) {
    let target: Position | null = null;
    if (a.row === pos.row && a.col === pos.col) target = b;
    else if (b.row === pos.row && b.col === pos.col) target = a;
    if (!target) continue;
    const t = board[target.row][target.col];
    if (t) {
      if (canCapture(target.row, target.col)) add(target.row, target.col);
    } else {
      add(target.row, target.col);
    }
  }

  return [...found.values()];
}

/* ---- 碰子结算 ---- */

export interface CombatResult {
  attackerSurvives: boolean;
  defenderSurvives: boolean;
}

export function resolveCombat(attacker: Piece, defender: Piece): CombatResult {
  const ar = attacker.rank;
  const dr = defender.rank;

  // 炸弹与任何棋子同归于尽
  if (ar === Rank.Bomb || dr === Rank.Bomb) {
    return { attackerSurvives: false, defenderSurvives: false };
  }
  // 地雷：只有工兵能挖，其他棋子碰雷只有自己阵亡，地雷留在原地
  if (dr === Rank.Mine) {
    return ar === Rank.Engineer
      ? { attackerSurvives: true, defenderSurvives: false }
      : { attackerSurvives: false, defenderSurvives: true };
  }
  // 军旗：被夺（能否夺由 getMoves 的护旗规则把关）
  if (dr === Rank.Flag) return { attackerSurvives: true, defenderSurvives: false };
  if (ar === Rank.Flag) return { attackerSurvives: false, defenderSurvives: true };
  // 同级同归于尽
  if (ar === dr) return { attackerSurvives: false, defenderSurvives: false };
  return ar > dr
    ? { attackerSurvives: true, defenderSurvives: false }
    : { attackerSurvives: false, defenderSurvives: true };
}

/* ---- 推进一步（界面与自对弈共用同一套规则） ---- */

/** 军旗是否还活着 */
export function flagAlive(board: Board, side: Side): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === side && p.rank === Rank.Flag) return true;
    }
  return false;
}

/**
 * 司令阵亡必须亮出军旗（标准军棋规则）。
 * 翻棋里军旗本是暗的，司令一死就自动翻开，攻方随即知道该往哪里打。
 */
function revealFlagIfSilingLost(board: Board, side: Side): void {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === side && p.rank === Rank.Siling) return; // 司令还在，不用亮
    }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === side && p.rank === Rank.Flag) p.faceUp = true;
    }
}

/**
 * 执行一次走子（含碰子结算与「司令阵亡亮军旗」），返回新局面。
 * 不修改传入的棋盘。
 */
export function applyMove(board: Board, from: Position, to: Position): Board {
  const piece = board[from.row][from.col];
  if (!piece) return cloneBoard(board);
  const dest = board[to.row][to.col];
  const nb = cloneBoard(board);
  const mover = nb[from.row][from.col]!;

  if (dest && dest.faceUp && dest.side !== piece.side) {
    const r = resolveCombat(piece, dest);
    if (!r.attackerSurvives) nb[from.row][from.col] = null;
    if (!r.defenderSurvives) nb[to.row][to.col] = null;
    if (r.attackerSurvives && !r.defenderSurvives) {
      nb[to.row][to.col] = mover;
      nb[from.row][from.col] = null;
    }
  } else {
    nb[to.row][to.col] = mover;
    nb[from.row][from.col] = null;
  }

  revealFlagIfSilingLost(nb, "red");
  revealFlagIfSilingLost(nb, "black");
  return nb;
}

/** 翻开一枚暗子（翻开后按它本来的归属颜色行动） */
export function applyFlip(board: Board, pos: Position): Board {
  const nb = cloneBoard(board);
  const p = nb[pos.row][pos.col];
  if (p) p.faceUp = true;
  return nb;
}


/* ---- 胜负判定 ---- */

/** 全场暗子（翻棋里任意暗子都能翻，不分敌我） */
export function getFlappable(board: Board): Position[] {
  const list: Position[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] && !board[r][c]!.faceUp) list.push({ row: r, col: c });
  return list;
}

/** 某方是否还有合法行动：还能翻暗子，或者还有子可走 */
export function hasLegalAction(board: Board, side: Side): boolean {
  if (getFlappable(board).length > 0) return true;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell || !cell.faceUp || cell.side !== side) continue;
      if (cell.rank === Rank.Flag || cell.rank === Rank.Mine) continue;
      if (getMoves(board, { row: r, col: c }).length > 0) return true;
    }
  }
  return false;
}

export function checkWin(board: Board): Side | null {
  let redFlag = false;
  let blackFlag = false;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell?.rank === Rank.Flag) {
        if (cell.side === "red") redFlag = true;
        else blackFlag = true;
      }
    }
  }

  // 军旗被任何可攻击的棋子夺得后立即获胜。
  if (!redFlag) return "black";
  if (!blackFlag) return "red";

  // 无合法行动判负
  if (!hasLegalAction(board, "red")) return "black";
  if (!hasLegalAction(board, "black")) return "red";

  return null;
}

/** 总步数上限：防止双方空耗，走到上限判和 */
export const MAX_MOVES = 300;

/* ---- AI ---- */

export interface AiAction {
  type: "flip" | "move";
  from?: Position;
  to?: Position;
  pos?: Position;
  score: number;
}

const other = (side: Side): Side => (side === "red" ? "black" : "red");

/** 子力价值：仅在公开信息下做的粗略估计，用于交换取舍 */
const PIECE_VALUE: Record<number, number> = {
  [Rank.Engineer]: 14, [Rank.Paichang]: 12, [Rank.Lianzhang]: 18, [Rank.Yingzhang]: 26,
  [Rank.Tuanzhang]: 35, [Rank.Lvzhang]: 45, [Rank.Shizhang]: 60, [Rank.Junzhang]: 80,
  [Rank.Siling]: 100, [Rank.Bomb]: 42, [Rank.Mine]: 20, [Rank.Flag]: 0,
};
const valueOf = (p: Piece) => PIECE_VALUE[p.rank] ?? 0;
const dist = (a: Position, b: Position) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

/** 8 邻域里各有多少：对方明子 / 己方明子 / 暗子。全部来自公开信息。 */
function neighbors(board: Board, pos: Position, side: Side) {
  let enemy = 0, own = 0, dark = 0;
  for (const [dr, dc] of NB8) {
    const r = pos.row + dr, c = pos.col + dc;
    if (!isOnBoard(r, c)) continue;
    const p = board[r][c];
    if (!p) continue;
    if (!p.faceUp) dark++;
    else if (p.side === side) own++;
    else enemy++;
  }
  return { enemy, own, dark };
}

/** 已翻开棋子的总价值 */
function visibleMaterial(board: Board, side: Side): number {
  let v = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.faceUp && p.side === side) v += valueOf(p);
    }
  return v;
}

/** 某方已翻开的指定军衔棋子的位置 */
function findVisible(board: Board, side: Side, rank: Rank): Position[] {
  const out: Position[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.faceUp && p.side === side && p.rank === rank) out.push({ row: r, col: c });
    }
  return out;
}

/**
 * AI 决策。翻棋是暗棋，AI 只能使用公开信息：
 * 棋盘位置、已翻开棋子的身份、以及"哪里还有暗子"。
 * 严禁读取暗子的 side / rank —— 否则等于偷看对手底牌。
 */
export function chooseAiMove(board: Board, aiSide: Side): AiAction | null {
  const humanSide = other(aiSide);
  /** 推进度：越靠近对方底线数值越大（0 ~ 11） */
  const advance = (side: Side, row: number) => (side === "red" ? ROWS - 1 - row : row);

  const actions: AiAction[] = [];
  const enemyFlag = findVisible(board, humanSide, Rank.Flag)[0] ?? null;
  const myMat = visibleMaterial(board, aiSide);
  const foeMat = visibleMaterial(board, humanSide);
  /** 粗略的明子优势度：正数表示局面占优，占优就更愿意交换 */
  const edge = (myMat - foeMat) / Math.max(60, myMat + foeMat);
  const dark = getFlappable(board);

  /**
   * 自家军旗。军旗未翻开时对方动不了它，不用管；一旦翻开（被对方摸到或司令阵亡被迫亮旗），
   * 就必须留人回防，否则纯拼速度必输。
   */
  const myFlag = findVisible(board, aiSide, Rank.Flag)[0] ?? null;
  const myFlagExposed = !!myFlag;

  /**
   * 作战计划。翻棋的胜负全落在军旗上，而双方军旗都藏在自己阵地一侧，
   * 所以主线就是「翻对方阵地 → 摸到军旗 → 全力冲旗」。
   * 但自家军旗一旦暴露，就得留人回防，否则竞速必输。
   */
  const plan: "rush" | "open" = enemyFlag ? "rush" : "open";
  const inHalf = (row: number, side: Side) => TERRITORY_ROWS[side].includes(row);

  /* ---- 候选一：翻子（只看位置，绝不看暗子的身份） ---- */
  if (dark.length > 0) {
    let ownActive = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const p = board[r][c];
        if (p && p.faceUp && p.side === aiSide && p.rank !== Rank.Flag && p.rank !== Rank.Mine) ownActive++;
      }
    // 手上能动的子越少，越需要翻开新棋子扩充兵力
    const base = 30 + Math.max(0, 18 - ownActive * 1.6);
    for (const pos of dark) {
      const nb = neighbors(board, pos, aiSide);
      let score = base - nb.enemy * 10 + nb.own * 6 + (Math.random() - 0.5) * 16;
      // 翻对方阵地才有机会摸到对方军旗；翻自家阵地只会暴露自己的旗
      if (inHalf(pos.row, humanSide)) score += 34;
      if (inHalf(pos.row, aiSide)) score -= 20;
      actions.push({ type: "flip", pos, score });
    }
  }

  /* ---- 候选二：走子 ---- */
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (!piece || !piece.faceUp || piece.side !== aiSide) continue;
      if (piece.rank === Rank.Flag || piece.rank === Rank.Mine) continue;
      const from: Position = { row: r, col: c };

      for (const to of getMoves(board, from)) {
        const dest = board[to.row][to.col];
        let score = 0;

        if (dest && dest.faceUp && dest.side === humanSide) {
          const result = resolveCombat(piece, dest);
          const mine = valueOf(piece);
          const theirs = valueOf(dest);
          if (dest.rank === Rank.Flag) score += 10000;
          if (result.attackerSurvives && !result.defenderSurvives) {
            score += 55 + theirs * 4 - Math.max(0, mine - theirs) * 1.1; // 拿大子换小子要扣分
          } else if (!result.attackerSurvives && result.defenderSurvives) {
            score -= 70 + mine * 5;
          } else {
            score += (theirs - mine) * 6; // 同归于尽：换得划算才做
          }
          score += edge * 45;
        } else if (!dest) {
          // 前进步数看目标行，而不是来源行
          score += advance(aiSide, to.row) * (plan === "open" ? 4 : 1);
          if (isCamp(to)) score += 20;     // 进营避险
          if (isCamp(from)) score -= 16;   // 别赖在营里不动
          if (piece.rank === Rank.Engineer) score += advance(aiSide, to.row) * 2;
        }
        // 落点威胁：旁边有更强的敌方明子就慎入（进营则安全）
        if (!isCamp(to)) {
          for (const [dr, dc] of NB8) {
            const r2 = to.row + dr, c2 = to.col + dc;
            if (!isOnBoard(r2, c2)) continue;
            const e = board[r2][c2];
            if (!e || !e.faceUp || e.side === aiSide) continue;
            // 军旗与地雷都不能移动，构不成威胁
            if (e.rank === Rank.Bomb) score -= 26;
            else if (e.rank > piece.rank && e.rank !== Rank.Flag && e.rank !== Rank.Mine) score -= 15;
          }
        }
        // 己方明子呼应
        for (const [dr, dc] of NB8) {
          const r2 = to.row + dr, c2 = to.col + dc;
          if (!isOnBoard(r2, c2)) continue;
          const a = board[r2][c2];
          if (a && a.faceUp && a.side === aiSide) score += 4;
        }
        // 军旗已找到就全力冲旗；自家旗也暴露时得分心回防，rush 力度下调
        if (enemyFlag) score -= dist(to, enemyFlag) * (myFlagExposed ? 14 : 26);

        // 护旗：贴到自家军旗四周挡刀，已经守在那儿的子不要乱跑
        if (myFlag) {
          const dg = dist(to, myFlag);
          if (dg === 1) score += 34;
          else if (dg === 2) score += 10;
          if (dist(from, myFlag) === 1 && dg > 1 && !enemyFlag) score -= 26;
        }

        score += (Math.random() - 0.5) * 26;
        actions.push({ type: "move", from, to, score });
      }
    }
  }

  if (actions.length === 0) return null;

  actions.sort((a, b) => b.score - a.score);
  const pool = actions.slice(0, Math.max(1, Math.ceil(actions.length * 0.3)));
  return pool[Math.random() < 0.15 ? Math.floor(Math.random() * pool.length) : 0];
}
