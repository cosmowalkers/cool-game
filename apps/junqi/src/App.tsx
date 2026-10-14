import { Bot, BookOpen, Flag, Minus, RotateCcw, Swords, Trophy, Undo2, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { copy, type RuleSection } from "./content/zh-CN";
import {
  applyFlip, applyMove, checkWin, chooseAiMove, cloneBoard, COLS, createBoard,
  CAMP_POSITIONS, DIAGONAL_ROADS, getFlappable, getMoves, HALF_ROWS, HQ_POSITIONS,
  isCamp, isMountainStep, MOUNTAIN_COLUMNS,
  MAX_MOVES, RANK_NAMES, Rank, ROWS,
  type Board, type Cell, type Piece, type Position, type Side,
} from "./game/engine";

type GameMode = "ai" | "local";
type Screen = "menu" | "playing";
type GameStatus = "playing" | "won" | "draw";

interface LastAction { from?: Position; to: Position; }

/** 横向铁路所在行 / 纵向铁路所在列（与引擎保持一致） */
const RAIL_ROWS = [1, 5, 6, 10];
const RAIL_COLS = [0, 4];
/** 中路铁路：两方前线之间的短接线 */
const MID_RAIL_COL = 2;

function IconButton({ label, children, onClick, disabled }: {
  label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label}
      onClick={onClick} disabled={disabled}>{children}</button>
  );
}

/** 棋子上的两字军衔，竖排 */
const PIECE_LABEL: Record<number, [string, string]> = {
  [Rank.Siling]: ["司", "令"],
  [Rank.Junzhang]: ["军", "长"],
  [Rank.Shizhang]: ["师", "长"],
  [Rank.Lvzhang]: ["旅", "长"],
  [Rank.Tuanzhang]: ["团", "长"],
  [Rank.Yingzhang]: ["营", "长"],
  [Rank.Lianzhang]: ["连", "长"],
  [Rank.Paichang]: ["排", "长"],
  [Rank.Engineer]: ["工", "兵"],
  [Rank.Bomb]: ["炸", "弹"],
  [Rank.Mine]: ["地", "雷"],
  [Rank.Flag]: ["军", "旗"],
};

const LADDER = [
  Rank.Siling, Rank.Junzhang, Rank.Shizhang, Rank.Lvzhang, Rank.Tuanzhang,
  Rank.Yingzhang, Rank.Lianzhang, Rank.Paichang, Rank.Engineer,
];

/* ============================== 标准军棋棋盘 ============================== */

const CELL = 100;
const PX = (col: number) => col * CELL + CELL / 2;
const PY = (row: number) => row * CELL + CELL / 2;
/** 铁路双轨到格心的距离：棋子正好卡在两根钢轨之间 */
const RAIL_OFF = 43;

function BoardSvg() {
  const midY = HALF_ROWS * CELL;
  const road: React.ReactNode[] = [];
  const railBed: React.ReactNode[] = [];
  const railLine: React.ReactNode[] = [];
  /** 山界锯齿山脊 */
  const ridge = (x0: number, w: number, y: number, dir: 1 | -1) => {
    const n = 4;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + (w * i) / n;
      pts.push(`${i === 0 ? "M" : "L"}${x} ${i % 2 === 0 ? y : y + dir * 11}`);
    }
    return pts.join(" ");
  };

  /* 横向铁路：整行一条轨道床 + 上下两根钢轨 */
  for (const r of RAIL_ROWS) {
    railBed.push(<rect key={`rbed${r}`} x={0} y={PY(r) - RAIL_OFF} width={COLS * CELL} height={RAIL_OFF * 2} className="rail-bed" />);
    railLine.push(<line key={`rl${r}a`} x1={0} y1={PY(r) - RAIL_OFF} x2={COLS * CELL} y2={PY(r) - RAIL_OFF} className="rail-line" />);
    railLine.push(<line key={`rl${r}b`} x1={0} y1={PY(r) + RAIL_OFF} x2={COLS * CELL} y2={PY(r) + RAIL_OFF} className="rail-line" />);
  }
  /* 纵向铁路：左右两条干线贯穿全场 */
  for (const c of RAIL_COLS) {
    railBed.push(<rect key={`cbed${c}`} x={PX(c) - RAIL_OFF} y={0} width={RAIL_OFF * 2} height={ROWS * CELL} className="rail-bed" />);
    railLine.push(<line key={`cl${c}a`} x1={PX(c) - RAIL_OFF} y1={0} x2={PX(c) - RAIL_OFF} y2={ROWS * CELL} className="rail-line" />);
    railLine.push(<line key={`cl${c}b`} x1={PX(c) + RAIL_OFF} y1={0} x2={PX(c) + RAIL_OFF} y2={ROWS * CELL} className="rail-line" />);
  }
  /* 中路铁路：三条贯通铁路中的中间一条，只连接两方前线 */
  {
    const x = PX(MID_RAIL_COL);
    railBed.push(<rect key="midbed" x={x - 26} y={midY - 16} width={52} height={32} className="rail-bed" />);
    railLine.push(<line key="midl1" x1={x - 18} y1={midY - 15} x2={x - 18} y2={midY + 15} className="rail-line" />);
    railLine.push(<line key="midl2" x1={x + 18} y1={midY - 15} x2={x + 18} y2={midY + 15} className="rail-line" />);
    railLine.push(<line key="midl3" x1={x - 26} y1={midY} x2={x - 18} y2={midY} className="rail-line" />);
    railLine.push(<line key="midl4" x1={x + 18} y1={midY} x2={x + 26} y2={midY} className="rail-line" />);
  }

  /* 公路：铁路行/列用钢轨表示连接，其余相邻格画细线；山界处不连通 */
  for (let r = 0; r < ROWS; r++) {
    if (RAIL_ROWS.includes(r)) continue;
    for (let c = 0; c < COLS - 1; c++) {
      road.push(<line key={`rh${r}-${c}`} x1={PX(c)} y1={PY(r)} x2={PX(c + 1)} y2={PY(r)} className="road-line" />);
    }
  }
  for (let c = 0; c < COLS; c++) {
    if (RAIL_COLS.includes(c)) continue;
    for (let r = 0; r < ROWS - 1; r++) {
      if (isMountainStep({ row: r, col: c }, { row: r + 1, col: c })) continue;
      road.push(<line key={`rv${c}-${r}`} x1={PX(c)} y1={PY(r)} x2={PX(c)} y2={PY(r + 1)} className="road-line" />);
    }
  }
  /* 行营对角斜线 */
  DIAGONAL_ROADS.forEach(([a, b], i) =>
    road.push(<line key={`dg${i}`} x1={PX(a.col)} y1={PY(a.row)} x2={PX(b.col)} y2={PY(b.row)} className="road-line" />)
  );

  return (
    <svg className="board-svg" viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`} aria-hidden="true">
      {/* 双方阵地底色（黑方在上 0-5 行，红方在下 6-11 行） */}
      <rect x="0" y="0" width={COLS * CELL} height={midY} className="zone zone-black" />
      <rect x="0" y={midY} width={COLS * CELL} height={midY} className="zone zone-red" />

      {road}
      {railBed}
      {railLine}

      {/* 山界：三条铁路（第 0/2/4 列）贯通前线，其余两列被山隔断 */}
      <g className="mountain">
        {MOUNTAIN_COLUMNS.map((c) => {
          const x0 = PX(c) - 46;
          return (
            <g key={`mtn${c}`}>
              <rect x={x0} y={midY - 12} width={92} height={24} className="mountain-base" />
              <path d={ridge(x0, 92, midY - 12, 1)} className="mountain-ridge" />
              <path d={ridge(x0, 92, midY + 12, -1)} className="mountain-ridge" />
              <text x={PX(c)} y={midY + 7} className="mountain-text" textAnchor="middle">山</text>
            </g>
          );
        })}
      </g>

      {/* 行营：受保护格，开局留空 */}
      {CAMP_POSITIONS.map((p, i) => (
        <circle key={`camp${i}`} cx={PX(p.col)} cy={PY(p.row)} r={47} className="camp-circle" />
      ))}
      {/* 大本营：双圈标记 */}
      {[...HQ_POSITIONS.black, ...HQ_POSITIONS.red].map((p, i) => (
        <g key={`hq${i}`}>
          <circle cx={PX(p.col)} cy={PY(p.row)} r={52} className="hq-outer" />
          <circle cx={PX(p.col)} cy={PY(p.row)} r={43} className="hq-inner" />
        </g>
      ))}
    </svg>
  );
}

/* ============================== 棋子 ============================== */

function PieceTile({ piece }: { piece: Piece }) {
  if (!piece.faceUp) {
    return <span className="tile tile-back"><span className="tile-emblem" /></span>;
  }
  const [a, b] = PIECE_LABEL[piece.rank] ?? ["?", "?"];
  return (
    <span className={`tile tile-${piece.side}`}>
      <span className="tile-chars"><span>{a}</span><span>{b}</span></span>
    </span>
  );
}

function CellView({ cell, selected, validTarget, recent, onClick }: {
  cell: Cell; selected: boolean; validTarget: boolean; recent: boolean;
  onClick: () => void;
}) {
  let cls = "piece-slot";
  if (selected) cls += " slot-selected";
  if (validTarget) cls += " slot-target";
  if (recent) cls += " slot-recent";
  return (
    <button type="button" className={cls} onClick={onClick}
      aria-label={cell ? (cell.faceUp ? `${copy.sideName(cell.side)}${copy.rankName(cell.rank)}` : copy.hiddenPiece) : copy.emptyPoint}>
      {cell && <PieceTile piece={cell} />}
    </button>
  );
}

/* ============================== 封面 ============================== */

function Menu({ mode, onModeChange, onStart }: { mode: GameMode; onModeChange: (m: GameMode) => void; onStart: () => void }) {
  return (
    <section className="menu-screen">
      <div className="menu-topo" aria-hidden="true">
        <div className="topo-ring topo-r1" /><div className="topo-ring topo-r2" /><div className="topo-ring topo-r3" />
        <div className="menu-stamp">CLASSIFIED</div>
      </div>
      <div className="menu-foreground">
        <div className="menu-hero">
          <div className="menu-emblems"><span className="emblem">★</span><span className="emblem">⚔</span><span className="emblem">★</span></div>
          <h1>{copy.title}</h1>
          <div className="menu-rank-strip">
            {LADDER.map((r) => (
              <span key={r} className="rank-badge">{PIECE_LABEL[r].join("")}</span>
            ))}
          </div>
          <p className="menu-tagline">{copy.tagline}</p>
        </div>
        <div className="menu-controls">
          <div className="mode-options">
            <button type="button" className={`mode-pill ${mode === "ai" ? "is-active" : ""}`} onClick={() => onModeChange("ai")}><Bot size={18} /><span>{copy.humanVsAi}</span></button>
            <button type="button" className={`mode-pill ${mode === "local" ? "is-active" : ""}`} onClick={() => onModeChange("local")}><Users size={18} /><span>{copy.localTwoPlayer}</span></button>
          </div>
          <button type="button" className="start-btn" onClick={onStart}><Swords size={20} /><span>{copy.start}</span></button>
          <p className="menu-hint">{mode === "ai" ? copy.aiHint : copy.localHint}</p>
        </div>
      </div>
    </section>
  );
}

/* ============================== 规则弹窗 ============================== */

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="rules-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="rules-header">
          <h2><BookOpen size={20} />{copy.rules}</h2>
          <IconButton label={copy.close} onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="rules-body">
          <div className="rank-table">
            <p className="legend-title">{copy.rankTitle}</p>
            <div className="rank-grid">
              {LADDER.map((r) => (
                <span key={r} className={`rank-chip rank-${r <= Rank.Siling ? "cmd" : "line"}`}>
                  <span className="rank-glyph">{PIECE_LABEL[r].join("")}</span>
                  <span className="rank-text">{RANK_NAMES[r]}</span>
                </span>
              ))}
            </div>
            <div className="special-grid">
              <span className="rank-chip rank-bomb"><span className="rank-glyph">炸弹</span><span className="rank-text">{copy.bombNote}</span></span>
              <span className="rank-chip rank-mine"><span className="rank-glyph">地雷</span><span className="rank-text">{copy.mineNote}</span></span>
              <span className="rank-chip rank-flag"><span className="rank-glyph">军旗</span><span className="rank-text">{copy.flagNote}</span></span>
              <span className="rank-chip rank-rail"><span className="rank-glyph">铁路</span><span className="rank-text">{copy.railNote}</span></span>
            </div>
          </div>
          {copy.ruleSections.map((sec: RuleSection, i: number) => (
            <div key={i} className="rules-section">
              <h3>{sec.title}</h3>
              {sec.lines.map((line, j) => <p key={j}>{line}</p>)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================== 结果弹窗 ============================== */

function ResultDialog({ mode, result, onDismiss, onPlayAgain, onHome }: {
  mode: GameMode; result: Side | "draw";
  onDismiss: () => void; onPlayAgain: () => void; onHome: () => void;
}) {
  const isDraw = result === "draw";
  const title = isDraw
    ? copy.drawTitle
    : mode === "ai"
      ? (result === "red" ? copy.youWin : copy.aiWins)
      : copy.winTitle(result);
  return (
    <div className="modal-backdrop">
      <section className="win-dialog" role="dialog" aria-modal="true">
        <span className={`win-icon ${isDraw ? "win-icon-draw" : ""}`}>{isDraw ? <Minus size={28} /> : <Trophy size={28} />}</span>
        <p className="win-sub"><Flag size={14} />{isDraw ? copy.drawSub : copy.winCongrats}</p>
        <h2>{title}</h2>
        <div className="win-actions">
          <button className="secondary-action" onClick={onDismiss}>{copy.winViewBoard}</button>
          <button className="primary-action" autoFocus onClick={onPlayAgain}><RotateCcw size={17} />{copy.winPlayAgain}</button>
        </div>
        <button className="home-link" onClick={onHome}>{copy.backHome}</button>
      </section>
    </div>
  );
}

/* ============================== 主组件 ============================== */

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<GameMode>("ai");
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [history, setHistory] = useState<Board[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [result, setResult] = useState<Side | "draw" | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [currentSide, setCurrentSide] = useState<Side>("red");
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [message, setMessage] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const stepsRef = useRef(0);
  const gRef = useRef({ board, status, mode, currentSide });
  useEffect(() => { gRef.current = { board, status, mode, currentSide }; });

  const isAiTurn = mode === "ai" && currentSide === "black" && status === "playing";
  const inGame = screen === "playing";

  const startGame = () => {
    const fresh = createBoard();
    setBoard(fresh);
    setHistory([fresh]);
    stepsRef.current = 0;
    setStatus("playing"); setResult(null); setDismissed(false);
    setCurrentSide("red"); setSelectedPos(null); setValidMoves([]);
    setLastAction(null); setMessage(copy.flipHint); setScreen("playing");
  };
  const goHome = () => {
    setScreen("menu"); setStatus("playing"); setResult(null); setDismissed(false);
    setSelectedPos(null); setValidMoves([]); setLastAction(null); setMessage("");
  };

  const settle = (b: Board, steps: number) => {
    const w = checkWin(b);
    if (w) { setResult(w); setStatus("won"); setDismissed(false); setMessage(""); return true; }
    if (steps >= MAX_MOVES) { setResult("draw"); setStatus("draw"); setDismissed(false); setMessage(""); return true; }
    return false;
  };

  const doMove = useCallback((b: Board, from: Position, to: Position, side: Side) => {
    const nb = applyMove(b, from, to);
    setBoard(nb);
    setSelectedPos(null); setValidMoves([]);
    setLastAction({ from, to });
    setHistory((h) => [...h, cloneBoard(nb)]);
    stepsRef.current += 1;
    if (!settle(nb, stepsRef.current)) setCurrentSide(side === "red" ? "black" : "red");
  }, []);

  const doFlip = useCallback((b: Board, pos: Position, side: Side) => {
    const nb = applyFlip(b, pos);
    setBoard(nb);
    setLastAction({ to: pos });
    setSelectedPos(null); setValidMoves([]);
    setHistory((h) => [...h, cloneBoard(nb)]);
    stepsRef.current += 1;
    if (!settle(nb, stepsRef.current)) setCurrentSide(side === "red" ? "black" : "red");
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (status !== "playing" || isAiTurn) return;
    if (selectedPos && validMoves.some((m) => m.row === row && m.col === col)) {
      doMove(board, selectedPos, { row, col }, currentSide);
      return;
    }
    const cell = board[row][col];
    const selected = selectedPos ? board[selectedPos.row][selectedPos.col] : null;

    // 点对方军旗但够不着
    if (cell?.faceUp && cell.rank === Rank.Flag && cell.side !== currentSide && selected) {
      setMessage(copy.flagUnreachable);
      return;
    }

    setSelectedPos(null); setValidMoves([]);
    if (!cell) return;
    if (!cell.faceUp) {
      doFlip(board, { row, col }, currentSide); // 翻棋：任意暗子都能翻
      return;
    }
    if (cell.side === currentSide) {
      const moves = getMoves(board, { row, col });
      setSelectedPos({ row, col });
      setValidMoves(moves);
      if (moves.length === 0) setMessage(copy.noMoves);
    }
  };

  useEffect(() => {
    if (lastAction) setMessage("");
  }, [lastAction]);

  useEffect(() => {
    if (!isAiTurn) return;
    setMessage(copy.aiThinking);
    const t = setTimeout(() => {
      const cur = gRef.current.board;
      const a = chooseAiMove(cur, "black");
      if (!a || ((a.type === "flip" && !a.pos) || (a.type === "move" && (!a.from || !a.to)))) {
        // 兜底：AI 给不出决策时不能让界面停在 AI 回合
        setMessage("");
        const w = checkWin(cur);
        if (w) { setResult(w); setStatus("won"); setDismissed(false); }
        else setCurrentSide("red");
        return;
      }
      if (a.type === "flip") doFlip(cur, a.pos!, "black");
      else doMove(cur, a.from!, a.to!, "black");
    }, 420 + Math.random() * 380);
    return () => clearTimeout(t);
  }, [isAiTurn, doFlip, doMove]);

  const canUndo = history.length > 1 && !isAiTurn;
  const undo = () => {
    if (!canUndo) return;
    const steps = mode === "ai" ? Math.min(2, history.length - 1) : 1;
    const nh = history.slice(0, history.length - steps);
    // 首项永远是初始棋盘，回退到 nh 最后一项即当时那一步之后的局面
    setBoard(cloneBoard(nh[nh.length - 1]));
    setHistory(nh);
    stepsRef.current = nh.length - 1;
    setStatus("playing"); setResult(null); setDismissed(false);
    setSelectedPos(null); setValidMoves([]);
    setLastAction(null); setMessage("");
    setCurrentSide(mode === "ai" ? "red" : (nh.length - 1) % 2 === 0 ? "red" : "black");
  };

  const darkCount = status === "playing" ? getFlappable(board).length : 0;

  return (
    <main className="junqi-shell">
      <header className="topbar">
        <a className="mini-brand" href="/"><strong>{copy.brand}</strong><span>{copy.title}</span></a>
        <div className="topbar-actions">
          <IconButton label={copy.rules} onClick={() => setRulesOpen(true)}><BookOpen size={20} /></IconButton>
          {inGame && <>
            <span className="turn-indicator">
              <span className={`turn-dot turn-${currentSide}`} />
              {currentSide === "red" ? copy.redTurn : copy.blackTurn}
              {darkCount > 0 && <span className="flip-remain">{copy.flipCount(darkCount)}</span>}
            </span>
            <IconButton label={copy.undo} onClick={undo} disabled={!canUndo}><Undo2 size={20} /></IconButton>
            <IconButton label={copy.restart} onClick={startGame}><RotateCcw size={20} /></IconButton>
          </>}
        </div>
      </header>

      {screen === "menu" && <Menu mode={mode} onModeChange={setMode} onStart={startGame} />}

      {inGame && (
        <section className="game-stage">
          <div className="board-frame">
            <div className="board-area">
              <BoardSvg />
              <div className="pieces-grid">
                {Array.from({ length: ROWS }, (_, row) =>
                  Array.from({ length: COLS }, (_, col) => (
                    <CellView key={`${row}-${col}`} cell={board[row][col]}
                      selected={selectedPos?.row === row && selectedPos?.col === col}
                      validTarget={validMoves.some((m) => m.row === row && m.col === col)}
                      recent={!!lastAction && ((lastAction.from && lastAction.from.row === row && lastAction.from.col === col) || (lastAction.to.row === row && lastAction.to.col === col))}
                      onClick={() => handleCellClick(row, col)} />
                  ))
                )}
              </div>
            </div>
            {message && <div className="game-message">{message}</div>}
          </div>
        </section>
      )}

      {rulesOpen && <RulesDialog onClose={() => setRulesOpen(false)} />}
      {inGame && status !== "playing" && result && !dismissed && (
        <ResultDialog mode={mode} result={result} onDismiss={() => setDismissed(true)} onPlayAgain={startGame} onHome={goHome} />
      )}
    </main>
  );
}
