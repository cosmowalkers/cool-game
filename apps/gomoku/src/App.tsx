import {
  ArrowLeft,
  Bot,
  CircleDot,
  RotateCcw,
  Trophy,
  Undo2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { copy } from "./content/zh-CN";
import {
  BOARD_SIZE,
  boardFromMoves,
  chooseAiMove,
  createBoard,
  hasFive,
  isBoardFull,
  type Board,
  type Move,
  type Player,
} from "./game/engine";

type GameMode = "ai" | "local";
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
  if (status === "won") return `${PLAYER_NAMES[winner ?? currentPlayer]}获胜`;
  if (mode === "ai" && currentPlayer === 2) return copy.aiThinking;
  return mode === "ai" && currentPlayer === 1
    ? copy.yourTurn
    : currentPlayer === 1
      ? copy.blackTurn
      : copy.whiteTurn;
}

function GameModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`mode-button ${active ? "is-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Stone({ player }: { player: Player }) {
  return (
    <span
      className={`stone stone-${player === 1 ? "black" : "white"}`}
      aria-hidden="true"
    />
  );
}

function BoardView({
  board,
  moves,
  mode,
  status,
  onPlace,
}: {
  board: Board;
  moves: Move[];
  mode: GameMode;
  status: GameStatus;
  onPlace: (row: number, column: number) => void;
}) {
  const lastMove = moves[moves.length - 1];
  const isAiTurn = mode === "ai" && moves.length % 2 === 1 && status === "playing";

  return (
    <div className="board-wrap">
      <div className="board-coordinates board-coordinates-top" aria-hidden="true">
        {Array.from({ length: BOARD_SIZE }, (_, index) => (
          <span key={index}>{String.fromCharCode(65 + index)}</span>
        ))}
      </div>
      <div className="board-side-labels" aria-hidden="true">
        {Array.from({ length: BOARD_SIZE }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className="gomoku-board" role="grid" aria-label={copy.boardLabel}>
        {board.map((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const isLastMove =
              lastMove?.row === rowIndex && lastMove.column === columnIndex;
            const isDisabled = cell !== 0 || status !== "playing" || isAiTurn;
            const playerName = cell === 1 ? "black" : "white";

            return (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                className={`board-cell ${isLastMove ? "is-last" : ""} ${
                  cell ? `has-${playerName}` : ""
                }`}
                role="gridcell"
                aria-label={
                  cell
                    ? copy.stoneLabel(playerName, rowIndex, columnIndex)
                    : copy.emptyCellLabel(rowIndex, columnIndex)
                }
                disabled={isDisabled}
                onClick={() => onPlace(rowIndex, columnIndex)}
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

export default function App() {
  const [mode, setMode] = useState<GameMode>("ai");
  const [moves, setMoves] = useState<Move[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const board = useMemo(() => boardFromMoves(moves), [moves]);
  const currentPlayer: Player = moves.length % 2 === 0 ? 1 : 2;
  const isAiTurn = mode === "ai" && currentPlayer === 2 && status === "playing";

  const resetGame = () => {
    setMoves([]);
    setStatus("playing");
    setWinner(null);
    setResultDismissed(false);
  };

  const switchMode = (nextMode: GameMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetGame();
  };

  const applyMove = (row: number, column: number, player: Player) => {
    if (board[row][column] !== 0 || status !== "playing") return;

    const nextMove: Move = { row, column, player };
    const nextBoard = boardFromMoves([...moves, nextMove]);
    const nextMoves = [...moves, nextMove];
    setMoves(nextMoves);

    if (hasFive(nextBoard, row, column, player)) {
      setWinner(player);
      setStatus("won");
      setResultDismissed(false);
    } else if (isBoardFull(nextBoard)) {
      setStatus("draw");
    }
  };

  useEffect(() => {
    if (!isAiTurn) return;
    const timer = window.setTimeout(() => {
      const aiMove = chooseAiMove(board, 2);
      if (aiMove) applyMove(aiMove.row, aiMove.column, 2);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [isAiTurn, board, moves, status]);

  const undo = () => {
    if (moves.length === 0) return;
    const removeCount = mode === "ai" && moves.length >= 2 ? 2 : 1;
    setMoves(moves.slice(0, -removeCount));
    setStatus("playing");
    setWinner(null);
    setResultDismissed(false);
  };

  return (
    <main className="gomoku-shell">
      <header className="topbar">
        <a className="back-link" href="/" aria-label={copy.backToPortal}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{copy.backToPortal}</span>
        </a>
        <div className="brand-lockup">
          <CircleDot size={18} aria-hidden="true" />
          <strong>{copy.brand}</strong>
        </div>
        <button
          type="button"
          className="restart-button"
          title={copy.restart}
          aria-label={copy.restart}
          onClick={resetGame}
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </header>

      <section className="game-intro">
        <div>
          <p className="eyebrow">{copy.subtitle}</p>
          <h1>{copy.title}</h1>
        </div>
        <p className="intro-note">
          {mode === "ai" ? copy.aiRole : copy.localRole}
        </p>
      </section>

      <section className="game-workspace">
        <div className="board-column">
          <div className="mode-switch" aria-label={copy.modeLabel}>
            <span className="control-label">{copy.modeLabel}</span>
            <div className="mode-buttons">
              <GameModeButton
                active={mode === "ai"}
                icon={<Bot size={16} aria-hidden="true" />}
                label={copy.humanVsAi}
                onClick={() => switchMode("ai")}
              />
              <GameModeButton
                active={mode === "local"}
                icon={<Users size={16} aria-hidden="true" />}
                label={copy.localTwoPlayer}
                onClick={() => switchMode("local")}
              />
            </div>
          </div>

          <div className={`status-line status-${status}`}>
            <span className={`turn-dot player-${winner ?? currentPlayer}`} />
            <strong>{getStatusText(mode, status, currentPlayer, winner)}</strong>
            <span>{copy.moveCount(moves.length)}</span>
          </div>

          <BoardView
            board={board}
            moves={moves}
            mode={mode}
            status={status}
            onPlace={(row, column) => applyMove(row, column, currentPlayer)}
          />
        </div>

        <aside className="info-panel">
          <div className="player-card player-card-black">
            <span className="player-stone stone-black" aria-hidden="true" />
            <div>
              <span>{copy.black}</span>
              <strong>{mode === "ai" ? "YOU" : "P1"}</strong>
            </div>
          </div>
          <div className="player-card player-card-white">
            <span className="player-stone stone-white" aria-hidden="true" />
            <div>
              <span>{copy.white}</span>
              <strong>{mode === "ai" ? "AI" : "P2"}</strong>
            </div>
          </div>

          <div className="rules-block">
            <p className="control-label">{copy.rulesTitle}</p>
            <p>{copy.ruleLineOne}</p>
            <p>{copy.ruleLineTwo}</p>
          </div>

          <div className="action-row">
            <button
              type="button"
              className="secondary-button"
              disabled={moves.length === 0 || isAiTurn}
              onClick={undo}
            >
              <Undo2 size={17} aria-hidden="true" />
              <span>{copy.undo}</span>
            </button>
            <button type="button" className="primary-button" onClick={resetGame}>
              <RotateCcw size={17} aria-hidden="true" />
              <span>{copy.restart}</span>
            </button>
          </div>
        </aside>
      </section>

      {status === "won" && winner !== null && !resultDismissed && (
        <div
          className="dialog-backdrop"
          onClick={() => setResultDismissed(true)}
        >
          <div
            className="win-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="win-dialog-icon" aria-hidden="true">
              <Trophy size={28} />
            </span>
            <p className="win-dialog-note">
              <span className={`player-stone stone-${winner === 1 ? "black" : "white"}`} aria-hidden="true" />
              {copy.winCongrats}
            </p>
            <h2 id="win-dialog-title">{copy.winTitle(PLAYER_NAMES[winner])}</h2>
            <div className="win-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setResultDismissed(true)}
              >
                {copy.winViewBoard}
              </button>
              <button
                type="button"
                className="primary-button"
                autoFocus
                onClick={resetGame}
              >
                {copy.winPlayAgain}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
