import { Check, Eye, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "./content";

type Face = "U" | "D" | "F" | "B" | "R" | "L";
type Color = "white" | "yellow" | "green" | "blue" | "red" | "orange";
type Cubie = { id: string; x: number; y: number; z: number; stickers: Partial<Record<Face, Color>> };
type Move = { face: Face; inverse?: boolean };

const faces: Face[] = ["U", "D", "F", "B", "R", "L"];
const colors: Record<Face, Color> = { U: "white", D: "yellow", F: "green", B: "blue", R: "red", L: "orange" };
const faceNames: Record<Face, string> = { U: "上", D: "下", F: "前", B: "后", R: "右", L: "左" };

function solvedCube(): Cubie[] {
  const result: Cubie[] = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    const stickers: Cubie["stickers"] = {};
    if (y === 1) stickers.U = colors.U;
    if (y === -1) stickers.D = colors.D;
    if (z === 1) stickers.F = colors.F;
    if (z === -1) stickers.B = colors.B;
    if (x === 1) stickers.R = colors.R;
    if (x === -1) stickers.L = colors.L;
    result.push({ id: `${x}${y}${z}`, x, y, z, stickers });
  }
  return result;
}

const coordinate = (face: Face): [number, number, number] => ({
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
}[face] as [number, number, number]);

function faceForVector(vector: [number, number, number]): Face {
  return ({ "0,1,0": "U", "0,-1,0": "D", "0,0,1": "F", "0,0,-1": "B", "1,0,0": "R", "-1,0,0": "L" } as Record<string, Face>)[vector.join(",")];
}

function rotateVector(vector: [number, number, number], axis: "x" | "y" | "z", direction: 1 | -1): [number, number, number] {
  const [x, y, z] = vector;
  if (axis === "x") return direction === 1 ? [x, z, -y] : [x, -z, y];
  if (axis === "y") return direction === 1 ? [z, y, -x] : [-z, y, x];
  return direction === 1 ? [y, -x, z] : [-y, x, z];
}

function turnCube(cube: Cubie[], move: Move): Cubie[] {
  const axis = move.face === "U" || move.face === "D" ? "y" : move.face === "F" || move.face === "B" ? "z" : "x";
  const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
  const layer = coordinate(move.face)[axisIndex];
  const direction = ((move.inverse ? -1 : 1) * (move.face === "D" || move.face === "L" || move.face === "B" ? -1 : 1)) as 1 | -1;
  return cube.map((cubie) => {
    const position = [cubie.x, cubie.y, cubie.z] as [number, number, number];
    if (position[axisIndex] !== layer) return cubie;
    const next = rotateVector(position, axis, direction);
    const stickers: Cubie["stickers"] = {};
    Object.entries(cubie.stickers).forEach(([oldFace, color]) => {
      stickers[faceForVector(rotateVector(coordinate(oldFace as Face), axis, direction))] = color;
    });
    return { id: cubie.id, x: next[0], y: next[1], z: next[2], stickers };
  });
}

function scrambleCube() {
  const moves: Move[] = [];
  let previous: Face | undefined;
  for (let index = 0; index < 20; index++) {
    let face = faces[Math.floor(Math.random() * faces.length)];
    while (face === previous) face = faces[Math.floor(Math.random() * faces.length)];
    moves.push({ face, inverse: Math.random() > 0.5 }); previous = face;
  }
  return moves;
}

function CubeView({ cube }: { cube: Cubie[] }) {
  const start = useRef<{ x: number; y: number } | undefined>(undefined);
  const rotation = useRef({ x: -25, y: -35 });
  const [, redraw] = useState(0);
  const handlePointerDown = (event: React.PointerEvent) => {
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x; const dy = event.clientY - start.current.y;
    start.current = { x: event.clientX, y: event.clientY };
    rotation.current.y += dx * 0.6; rotation.current.x = Math.max(-80, Math.min(80, rotation.current.x - dy * 0.6));
    redraw((value) => value + 1);
  };
  const handlePointerUp = () => { start.current = undefined; };
  return (
    <div className="cube-stage" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <div className="cube-shadow" />
      <div className="cube" style={{ transform: `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)` }}>
        {cube.map((cubie) => (
          <div className="cubie" key={cubie.id} style={{ transform: `translate3d(${cubie.x * 5.15}rem, ${-cubie.y * 5.15}rem, ${cubie.z * 5.15}rem)` }}>
            {Object.entries(cubie.stickers).map(([face, color]) => <i className={`sticker sticker-${face.toLowerCase()} color-${color}`} key={face} />)}
          </div>
        ))}
      </div>
      <span className="drag-hint"><Eye size={14} />拖动查看</span>
    </div>
  );
}

export default function App() {
  const [cube, setCube] = useState(solvedCube);
  const [history, setHistory] = useState<Move[]>([]);
  const [solving, setSolving] = useState(false);
  const [message, setMessage] = useState("点击打乱，开始挑战");
  const solved = useMemo(() => cube.every((cubie) => Object.entries(cubie.stickers).every(([face, color]) => color === colors[face as Face])), [cube]);

  const applyMove = (move: Move, record = true) => {
    setCube((current) => turnCube(current, move));
    if (record) setHistory((current) => [...current, move]);
    setMessage("继续旋转，观察每一面的颜色变化");
  };
  const scramble = () => {
    const moves = scrambleCube();
    setCube((current) => moves.reduce((value, move) => turnCube(value, move), current));
    setHistory(moves); setMessage("魔方已打乱，试着把六面还原");
  };
  const solve = async () => {
    if (!history.length || solving) return;
    setSolving(true); setMessage("正在按步骤还原…");
    for (const move of [...history].reverse()) {
      await new Promise((resolve) => window.setTimeout(resolve, 130));
      setCube((current) => turnCube(current, { ...move, inverse: !move.inverse }));
    }
    setHistory([]); setSolving(false); setMessage("完成！六面同色");
  };
  const reset = () => { setCube(solvedCube()); setHistory([]); setMessage("已回到初始状态"); };
  useEffect(() => { if (solved && history.length === 0) setMessage("完成！六面同色"); }, [solved, history.length]);
  useEffect(() => {
    const keyboardFaces: Record<string, Face> = { u: "U", d: "D", f: "F", b: "B", r: "R", l: "L" };
    const onKeyDown = (event: KeyboardEvent) => {
      const face = keyboardFaces[event.key.toLowerCase()];
      if (!face || event.repeat || solving) return;
      event.preventDefault();
      applyMove({ face, inverse: event.shiftKey });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [solving]);

  return (
    <main className="cube-shell">
      <header className="cube-header"><a className="cube-brand" href="/">COOL <span>GAMES</span></a><span className="cube-label">CUBE / 01</span></header>
      <section className="cube-layout">
        <div className="cube-intro"><p className="cube-eyebrow">A POCKET PUZZLE</p><h1>转动<br /><em>色彩。</em></h1><p className="cube-description">{copy.tagline}</p><div className={`cube-status ${solved ? "is-solved" : ""}`}><span />{message}</div></div>
        <CubeView cube={cube} />
        <aside className="cube-controls">
          <div className="control-heading"><span>旋转面</span><small>顺时针 / 逆时针</small></div>
          <div className="face-grid">{faces.map((face) => <div className="face-control" key={face}><span className={`face-chip color-${colors[face]}`}>{face}</span><button onClick={() => applyMove({ face })} disabled={solving}>{faceNames[face]} <b>↻</b></button><button onClick={() => applyMove({ face, inverse: true })} disabled={solving} aria-label={`${faceNames[face]}逆时针`}>↺</button></div>)}</div>
          <div className="control-actions"><button onClick={scramble} disabled={solving}><Shuffle size={16} />打乱</button><button onClick={solve} disabled={solving || !history.length}><Check size={16} />自动还原</button><button onClick={reset} disabled={solving}><RotateCcw size={16} />重置</button></div>
          <div className="notation"><Undo2 size={15} /><span>拖动查看，点击按钮或按 U D F B R L 旋转。<br />Shift + 按键为逆时针，完成六面同色即可通关。</span></div>
        </aside>
      </section>
    </main>
  );
}
