export const BOARD_SIZE = 15;

export type Stone = 0 | 1 | 2;
export type Player = Exclude<Stone, 0>;
export type Position = { row: number; column: number };
export type Move = Position & { player: Player };
export type Board = Stone[][];

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array<Stone>(BOARD_SIZE).fill(0)
  );
}

export function boardFromMoves(moves: Move[]): Board {
  const board = createBoard();
  for (const move of moves) {
    board[move.row][move.column] = move.player;
  }
  return board;
}

export function isInside(row: number, column: number): boolean {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    column >= 0 &&
    column < BOARD_SIZE
  );
}

function countDirection(
  board: Board,
  row: number,
  column: number,
  player: Player,
  rowStep: number,
  columnStep: number
): number {
  let count = 0;
  let nextRow = row + rowStep;
  let nextColumn = column + columnStep;

  while (
    isInside(nextRow, nextColumn) &&
    board[nextRow][nextColumn] === player
  ) {
    count += 1;
    nextRow += rowStep;
    nextColumn += columnStep;
  }

  return count;
}

export function hasFive(
  board: Board,
  row: number,
  column: number,
  player: Player
): boolean {
  return DIRECTIONS.some(([rowStep, columnStep]) => {
    const connected =
      1 +
      countDirection(board, row, column, player, rowStep, columnStep) +
      countDirection(board, row, column, player, -rowStep, -columnStep);
    return connected >= 5;
  });
}

export function isBoardFull(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== 0));
}

function getOpenEnds(
  board: Board,
  row: number,
  column: number,
  player: Player,
  rowStep: number,
  columnStep: number
): { connected: number; openEnds: number } {
  const forward = countDirection(
    board,
    row,
    column,
    player,
    rowStep,
    columnStep
  );
  const backward = countDirection(
    board,
    row,
    column,
    player,
    -rowStep,
    -columnStep
  );
  const connected = 1 + forward + backward;
  let openEnds = 0;

  const forwardRow = row + (forward + 1) * rowStep;
  const forwardColumn = column + (forward + 1) * columnStep;
  const backwardRow = row - (backward + 1) * rowStep;
  const backwardColumn = column - (backward + 1) * columnStep;

  if (
    isInside(forwardRow, forwardColumn) &&
    board[forwardRow][forwardColumn] === 0
  ) {
    openEnds += 1;
  }
  if (
    isInside(backwardRow, backwardColumn) &&
    board[backwardRow][backwardColumn] === 0
  ) {
    openEnds += 1;
  }

  return { connected, openEnds };
}

function patternScore(connected: number, openEnds: number): number {
  if (connected >= 5) return 100_000;
  if (connected === 4) return openEnds === 2 ? 12_000 : 2_000;
  if (connected === 3) return openEnds === 2 ? 900 : 120;
  if (connected === 2) return openEnds === 2 ? 90 : 15;
  return openEnds === 2 ? 8 : 2;
}

function scoreMove(board: Board, position: Position, player: Player): number {
  board[position.row][position.column] = player;
  const score = DIRECTIONS.reduce(
    (total, [rowStep, columnStep]) => {
      const { connected, openEnds } = getOpenEnds(
        board,
        position.row,
        position.column,
        player,
        rowStep,
        columnStep
      );
      return total + patternScore(connected, openEnds);
    },
    0
  );
  board[position.row][position.column] = 0;
  return score;
}

function candidatePositions(board: Board): Position[] {
  const occupied: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (board[row][column] !== 0) occupied.push({ row, column });
    }
  }

  if (occupied.length === 0) {
    return [{ row: Math.floor(BOARD_SIZE / 2), column: Math.floor(BOARD_SIZE / 2) }];
  }

  const candidates = new Map<string, Position>();
  for (const { row, column } of occupied) {
    for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
      for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
        const nextRow = row + rowOffset;
        const nextColumn = column + columnOffset;
        if (isInside(nextRow, nextColumn) && board[nextRow][nextColumn] === 0) {
          candidates.set(`${nextRow}:${nextColumn}`, {
            row: nextRow,
            column: nextColumn,
          });
        }
      }
    }
  }

  return [...candidates.values()];
}

export function chooseAiMove(board: Board, aiPlayer: Player = 2): Position | null {
  const candidates = candidatePositions(board);
  if (candidates.length === 0) return null;

  const humanPlayer: Player = aiPlayer === 1 ? 2 : 1;
  const center = Math.floor(BOARD_SIZE / 2);

  let bestPosition = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const position of candidates) {
    const attackScore = scoreMove(board, position, aiPlayer);
    board[position.row][position.column] = aiPlayer;
    const winsNow = hasFive(board, position.row, position.column, aiPlayer);
    board[position.row][position.column] = 0;

    const defenseScore = scoreMove(board, position, humanPlayer);
    board[position.row][position.column] = humanPlayer;
    const blocksNow = hasFive(board, position.row, position.column, humanPlayer);
    board[position.row][position.column] = 0;

    const centerBonus =
      BOARD_SIZE - Math.abs(position.row - center) - Math.abs(position.column - center);
    const score =
      (winsNow ? 1_000_000 : 0) +
      (blocksNow ? 500_000 : 0) +
      attackScore * 1.15 +
      defenseScore +
      centerBonus;

    if (score > bestScore) {
      bestScore = score;
      bestPosition = position;
    }
  }

  return bestPosition;
}
