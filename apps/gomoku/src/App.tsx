import {
  Bot,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copy } from "./content/zh-CN";
import {
  BOARD_SIZE,
  boardFromMoves,
  chooseAiMove,
  hasFive,
  isBoardFull,
  type Board,
  type Move,
  type Player,
} from "./game/engine";

type GameMode = "ai" | "local";
type Screen = "menu" | "playing";
type GameStatus = "playing" | "won" | "draw";

const PLAYER_NAMES: Record<Player, string> = {
  1: copy.black,
  2: copy.white,
};

function getStatusText(
  mode: GameMode,
  status: GameStatus,
  currentPlayer: Player,
  winner: Player | null
): string {
  if (status === "draw") return copy.draw;
  if (status === "won") return `${PLAYER_NAMES[winner ?? currentPlayer]}${copy.winSuffix}`;
  if (mode === "ai" && currentPlayer === 2) return copy.aiThinking;
  return mode === "ai" && currentPlayer === 1
    ? copy.yourTurn
    : currentPlayer === 1
      ? copy.blackTurn
      : copy.whiteTurn;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function Stone({ player, size = "md" }: { player: Player; size?: "sm" | "md" | "lg" }) {
  return <span className={`stone stone-${player === 1 ? "black" : "white"} stone-${size}`} aria-hidden="true" />;
}

/* ============================== 新封面 ============================== */

function Menu({ mode, onModeChange, onStart }: { mode: GameMode; onModeChange: (m: GameMode) => void; onStart: () => void }) {
  return (
    <section className="menu-screen">
      {/* 背景棋盘 */}
      <div className="menu-bg" aria-hidden="true">
        <div className="menu-bg-grid">
          {Array.from({ length: 15 }, (_, r) => (
            <div key={r} className="bg-row">
              {Array.from({ length: 15 }, (_, c) => {
                // 生成一个固定的棋局图案（五连 + 散子）
                const pattern: (number | null)[][] = [
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,1,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,1,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,1,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,1,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,1,null,null,null,null,null,null,null,null,2,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,2,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,2,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,2,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,2,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
                ];
                const val = pattern[r]?.[c];
                return (
                  <span
                    key={c}
                    className={`bg-cell ${val === 1 ? "bg-black" : val === 2 ? "bg-white" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* 光晕 */}
        <div className="menu-glow" />
        <div className="menu-particles">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="particle" style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
      </div>

      {/* 前景文字 */}
      <div className="menu-foreground">
        <div className="menu-hero">
          <p className="menu-subtitle">— {copy.subtitle} —</p>
          <h1>{copy.title}</h1>
          <p className="menu-tagline">{copy.tagline}</p>
        </div>

        <div className="menu-controls">
          <div className="mode-options">
            <button
              type="button"
              className={`mode-pill ${mode === "ai" ? "is-active" : ""}`}
              onClick={() => onModeChange("ai")}
            >
              <Bot size={18} />
              <span>{copy.humanVsAi}</span>
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "local" ? "is-active" : ""}`}
              onClick={() => onModeChange("local")}
            >
              <Users size={18} />
              <span>{copy.localTwoPlayer}</span>
            </button>
          </div>
          <button type="button" className="start-btn" onClick={onStart}>
            <Play size={22} fill="currentColor" />
            <span>{copy.start}</span>
          </button>
          <p className="menu-hint">{mode === "ai" ? copy.aiRole : copy.localRole}</p>
        </div>
      </div>
    </section>
  );
}

/* ============================== 棋盘 ============================== */

function BoardView({ board, moves, mode, status, onPlace }: { board: Board; moves: Move[]; mode: GameMode; status: GameStatus; onPlace: (row: number, column: number) => void }) {
  const lastMove = moves[moves.length - 1];
  const isAiTurn = mode === "ai" && moves.length % 2 === 1 && status === "playing";
  return (
    <div className="board-wrap">
      <div className="board-coordinates board-coordinates-top" aria-hidden="true">
        {Array.from({ length: BOARD_SIZE }, (_, i) => <span key={i}>{String.fromCharCode(65 + i)}</span>)}
      </div>
      <div className="board-side-labels" aria-hidden="true">
        {Array.from({ length: BOARD_SIZE }, (_, i) => <span key={i}>{i + 1}</span>)}
      </div>
      <div className="gomoku-board" role="grid" aria-label={copy.boardLabel}>
        {board.map((row, ri) =>
          row.map((cell, ci) => {
            const isLast = lastMove?.row === ri && lastMove?.column === ci;
            return (
              <button key={`${ri}-${ci}`} type="button"
                className={`board-cell ${isLast ? "is-last" : ""} ${cell ? `has-${cell === 1 ? "black" : "white"}` : ""}`}
                disabled={cell !== 0 || status !== "playing" || isAiTurn}
                onClick={() => onPlace(ri, ci)}
                aria-label={cell ? copy.stoneLabel(cell === 1 ? "black" : "white", ri, ci) : copy.emptyCellLabel(ri, ci)}
              >
                {cell !== 0 && <Stone player={cell} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================== 弹窗 ============================== */

function ResultDialog({ mode, winner, draw, onDismiss, onPlayAgain, onHome }: { mode: GameMode; winner: Player | null; draw?: boolean; onDismiss: () => void; onPlayAgain: () => void; onHome: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="win-dialog" role="dialog" aria-modal="true">
        <span className={`win-icon ${draw ? "win-icon-draw" : ""}`}>
          {draw ? <X size={28} /> : <Trophy size={28} />}
        </span>
        {!draw && winner && <p className="win-sub"><Stone player={winner} size="sm" />{copy.winCongrats}</p>}
        {draw && <p className="win-sub">{copy.drawSubtitle}</p>}
        <h2>{draw ? copy.draw : mode === "ai" ? (winner === 2 ? copy.aiWins : copy.youWin) : copy.winTitle(PLAYER_NAMES[winner!])}</h2>
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
  const [moves, setMoves] = useState<Move[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const board = useMemo(() => boardFromMoves(moves), [moves]);
  const currentPlayer: Player = moves.length % 2 === 0 ? 1 : 2;
  const isAiTurn = mode === "ai" && currentPlayer === 2 && status === "playing";
  const gRef = useRef({ moves, status, board });

  useEffect(() => { gRef.current = { moves, status, board }; });

  const startGame = () => { setMoves([]); setStatus("playing"); setWinner(null); setDismissed(false); setScreen("playing"); };
  const goHome = () => { setMoves([]); setStatus("playing"); setWinner(null); setDismissed(false); setScreen("menu"); };

  const applyMove = useCallback((row: number, col: number, player: Player) => {
    const { board: b, moves: ms, status: st } = gRef.current;
    if (b[row][col] !== 0 || st !== "playing") return;
    const nm = [...ms, { row, column: col, player }];
    const nb = boardFromMoves(nm);
    setMoves(nm);
    if (hasFive(nb, row, col, player)) { setWinner(player); setStatus("won"); setDismissed(false); }
    else if (isBoardFull(nb)) { setStatus("draw"); setDismissed(false); }
  }, []);

  useEffect(() => {
    if (!isAiTurn) return;
    const t = setTimeout(() => {
      const m = chooseAiMove(gRef.current.board, 2);
      if (m) applyMove(m.row, m.column, 2);
    }, 350);
    return () => clearTimeout(t);
  }, [isAiTurn, applyMove]);

  const undo = () => {
    if (moves.length === 0 || isAiTurn) return;
    const n = mode === "ai" && moves.length >= 2 ? 2 : 1;
    setMoves(moves.slice(0, -n)); setStatus("playing"); setWinner(null); setDismissed(false);
  };

  const inGame = screen === "playing";
  const showResult = inGame && (status === "won" || status === "draw") && !dismissed;

  return (
    <main className="gomoku-shell">
      <header className="topbar">
        <a className="mini-brand" href="/">
          <strong>{copy.brand}</strong>
          <span>{copy.title}</span>
        </a>
        <div className="topbar-actions">
          {inGame && <>
            <IconButton label={copy.undo} onClick={undo}><Undo2 size={20} /></IconButton>
            <IconButton label={copy.restart} onClick={startGame}><RotateCcw size={20} /></IconButton>
          </>}
        </div>
      </header>

      {screen === "menu" && <Menu mode={mode} onModeChange={setMode} onStart={startGame} />}

      {screen === "playing" && (
        <section className="game-stage">
          <div className={`status-line status-${status}`}>
            <div className="status-players">
              <span className="status-player"><Stone player={1} size="sm" /><span>{mode === "ai" ? "YOU" : "P1"}</span></span>
              <span className="status-vs">VS</span>
              <span className="status-player"><Stone player={2} size="sm" /><span>{mode === "ai" ? "AI" : "P2"}</span></span>
            </div>
            <div className="status-info">
              <span className={`turn-dot player-${winner ?? currentPlayer}`} />
              <strong>{getStatusText(mode, status, currentPlayer, winner)}</strong>
              <span className="move-count">{copy.moveCount(moves.length)}</span>
            </div>
          </div>
          <BoardView board={board} moves={moves} mode={mode} status={status} onPlace={(r, c) => applyMove(r, c, currentPlayer)} />
          <div className="game-rules"><p>{copy.ruleLineOne}</p><p>{copy.ruleLineTwo}</p></div>
        </section>
      )}

      {showResult && (
        <ResultDialog mode={mode} winner={winner} draw={status === "draw"} onDismiss={() => setDismissed(true)} onPlayAgain={startGame} onHome={goHome} />
      )}
    </main>
  );
}
