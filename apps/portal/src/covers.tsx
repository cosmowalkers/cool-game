/**
 * 游戏卡片封面插画（内联 SVG，扁平插画风格，参考 nowork 封面做法）。
 * 背景透明，由 .game-card-art 的主题色块打底。
 */

const WOOD_LINE = "#8a6a45";
const WOOD = ["#d2b28a", "#bfa077"];
const INK = "#2c2416";
const PAPER = "#f7f3eb";
const RED = "#c43a31";

function Stone({
  cx,
  cy,
  r,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  color: "black" | "white";
}) {
  const fill = color === "black" ? "url(#g-stone-black)" : "url(#g-stone-white)";
  const stroke = color === "black" ? "#000" : "#c9b995";
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.4} />
      <ellipse
        cx={cx - r * 0.28}
        cy={cy - r * 0.38}
        rx={r * 0.32}
        ry={r * 0.2}
        fill="rgba(255,255,255,0.5)"
        transform={`rotate(-28 ${cx} ${cy})`}
      />
    </>
  );
}

export function GomokuCover() {
  const x0 = 42;
  const y0 = 78;
  const gap = 19.5;
  const lines = Array.from({ length: 9 }, (_, i) => i * gap);

  return (
    <svg viewBox="0 0 240 300" role="img" aria-label="五子棋封面" width="100%">
      <defs>
        <linearGradient id="g-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={WOOD[0]} />
          <stop offset="1" stopColor={WOOD[1]} />
        </linearGradient>
        <radialGradient id="g-stone-black" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#4a4032" />
          <stop offset="1" stopColor="#16120e" />
        </radialGradient>
        <radialGradient id="g-stone-white" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6dcc8" />
        </radialGradient>
      </defs>

      {/* 顶部散落棋子 */}
      <Stone cx={52} cy={32} r={11} color="black" />
      <Stone cx={94} cy={24} r={7} color="white" />

      {/* 木板棋盘 */}
      <rect x={30} y={66} width={180} height={180} rx={10} fill="url(#g-wood)" stroke={WOOD_LINE} strokeWidth={4} />
      <rect x={38} y={74} width={164} height={164} rx={6} fill="none" stroke={WOOD_LINE} strokeWidth={1.5} opacity={0.45} />

      {/* 网格线 */}
      <g stroke={WOOD_LINE} strokeWidth={1.6} opacity={0.75}>
        {lines.map((d) => (
          <line key={`v${d}`} x1={x0 + d} y1={y0} x2={x0 + d} y2={y0 + 156} />
        ))}
        {lines.map((d) => (
          <line key={`h${d}`} x1={x0} y1={y0 + d} x2={x0 + 156} y2={y0 + d} />
        ))}
      </g>

      {/* 星位 */}
      {[81, 120, 159].map((x) =>
        [117, 156, 195].map((y) =>
          x === 120 && y === 156 ? null : (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} fill={WOOD_LINE} />
          )
        )
      )}
      <circle cx={120} cy={156} r={2.6} fill={RED} />

      {/* 一行连五 */}
      <Stone cx={81} cy={156} r={9.5} color="black" />
      <Stone cx={100.5} cy={156} r={9.5} color="white" />
      <Stone cx={120} cy={156} r={9.5} color="black" />
      <Stone cx={139.5} cy={156} r={9.5} color="white" />
      <Stone cx={159} cy={156} r={9.5} color="black" />
      <circle cx={159} cy={156} r={13} fill="none" stroke={RED} strokeWidth={2.4} />

      {/* 红印章 */}
      <g transform="rotate(-10 190 46)">
        <rect x={176} y={30} width={28} height={28} rx={4} fill={RED} />
        <text
          x={190}
          y={51}
          textAnchor="middle"
          fontFamily='"PingFang SC", "Noto Serif SC", serif'
          fontWeight={900}
          fontSize={19}
          fill={PAPER}
        >
          五
        </text>
      </g>
    </svg>
  );
}

function Piece({
  x,
  y,
  w,
  h,
  label,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: [string, string];
  tone: "red" | "dark";
}) {
  const bg = tone === "red" ? "#f0e6c8" : "#241b0e";
  const fg = tone === "red" ? "#b03a2a" : "#e8dcb8";
  const border = tone === "red" ? "#8a5a20" : "#b08a24";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={bg} stroke={border} strokeWidth={2} />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={4} fill="none" stroke={border} strokeWidth={1} opacity={0.55} />
      <text
        x={x + w / 2}
        y={y + h / 2 - 4}
        textAnchor="middle"
        fontFamily='"PingFang SC", "Noto Serif SC", serif'
        fontWeight={900}
        fontSize={w * 0.3}
        fill={fg}
      >
        {label[0]}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 16}
        textAnchor="middle"
        fontFamily='"PingFang SC", "Noto Serif SC", serif'
        fontWeight={900}
        fontSize={w * 0.3}
        fill={fg}
      >
        {label[1]}
      </text>
    </g>
  );
}

export function JunqiCover() {
  return (
    <svg viewBox="0 0 240 300" role="img" aria-label="军棋封面" width="100%">
      <defs>
        <linearGradient id="g-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a482c" />
          <stop offset="1" stopColor="#42331b" />
        </linearGradient>
      </defs>

      {/* 棋盘面 */}
      <rect x={26} y={52} width={188} height={200} rx={10} fill="url(#g-board)" stroke="#241b0e" strokeWidth={4} />

      {/* 陆战区示意网格 */}
      <g stroke="#d9c79a" strokeWidth={1.1} opacity={0.28}>
        {[88, 124, 160, 196].map((y) => (
          <line key={`h${y}`} x1={34} y1={y} x2={206} y2={y} />
        ))}
        {[64, 104, 144, 184].map((x) => (
          <line key={`v${x}`} x1={x} y1={60} x2={x} y2={244} />
        ))}
      </g>

      {/* 铁路（横 + 竖双轨） */}
      <g stroke="#d4a92f" strokeWidth={3.4} strokeLinecap="round">
        <line x1={30} y1={145} x2={210} y2={145} />
        <line x1={30} y1={159} x2={210} y2={159} />
        <line x1={111} y1={56} x2={111} y2={248} />
        <line x1={129} y1={56} x2={129} y2={248} />
      </g>
      <g stroke="#d4a92f" strokeWidth={1.2} opacity={0.5}>
        {[48, 64, 80, 96, 112, 128, 144, 160, 176, 192].map((x) => (
          <line key={`s${x}`} x1={x} y1={144} x2={x} y2={160} />
        ))}
        {[72, 96, 120, 144, 168, 192, 216].map((y) => (
          <line key={`s${y}`} x1={110} y1={y} x2={130} y2={y} />
        ))}
      </g>

      {/* 行营 */}
      {[
        [58, 76],
        [182, 76],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x},${y - 11} L${x + 9},${y} L${x},${y + 11} L${x - 9},${y} Z`}
          fill="rgba(212,169,47,0.14)"
          stroke="#d4a92f"
          strokeWidth={1.6}
          strokeDasharray="3 3"
        />
      ))}

      {/* 大本营 */}
      {[
        [44, 218],
        [172, 218],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={28} height={22} rx={3} fill="#241b0e" stroke="#d4a92f" strokeWidth={1.6} />
          <text
            x={x + 14}
            y={y + 16}
            textAnchor="middle"
            fontFamily='"PingFang SC", serif'
            fontWeight={900}
            fontSize={12}
            fill="#d4a92f"
          >
            旗
          </text>
        </g>
      ))}

      {/* 中央大棋子 */}
      <g>
        <rect x={90} y={114} width={60} height={76} rx={9} fill="#241b0e" stroke="#b08a24" strokeWidth={2.6} />
        <rect x={95} y={119} width={50} height={66} rx={5} fill="none" stroke="#b08a24" strokeWidth={1} opacity={0.5} />
        <text x={120} y={148} textAnchor="middle" fontFamily='"PingFang SC", "Noto Serif SC", serif' fontWeight={900} fontSize={25} fill="#e8dcb8">
          军
        </text>
        <text x={120} y={179} textAnchor="middle" fontFamily='"PingFang SC", "Noto Serif SC", serif' fontWeight={900} fontSize={25} fill="#e8dcb8">
          棋
        </text>
      </g>

      {/* 红方 / 黑方棋子 */}
      <Piece x={52} y={118} w={42} h={54} label={["司", "令"]} tone="red" />
      <Piece x={158} y={160} w={42} h={54} label={["工", "兵"]} tone="dark" />
    </svg>
  );
}

export function CubeCover() {
  return (
    <svg viewBox="0 0 240 300" role="img" aria-label="3D 魔方封面" width="100%">
      <defs>
        <linearGradient id="cube-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#282a2d" />
          <stop offset="1" stopColor="#111214" />
        </linearGradient>
      </defs>
      <rect width="240" height="300" fill="url(#cube-bg)" />
      <ellipse cx="120" cy="243" rx="72" ry="18" fill="#090a0b" opacity=".7" />
      <g transform="translate(120 146) rotate(-24)">
        <path d="M-62 -35 L0 -70 L62 -35 L0 0Z" fill="#f4f0e8" stroke="#161719" strokeWidth="5" />
        <path d="M-62 -35 L0 0 L0 78 L-62 42Z" fill="#4eaa70" stroke="#161719" strokeWidth="5" />
        <path d="M0 0 L62 -35 L62 42 L0 78Z" fill="#db5b4f" stroke="#161719" strokeWidth="5" />
        <path d="M-31 -52 L0 -69 L0 -34 L-31 -17Z M0 -69 L31 -52 L31 -17 L0 -34Z" fill="#f1c84b" stroke="#161719" strokeWidth="3" />
        <path d="M-62 -35 L-31 -17 L-31 58 L-62 42Z M-31 -17 L0 0 L0 78 L-31 58Z" fill="#4b7fd3" stroke="#161719" strokeWidth="3" />
        <path d="M0 0 L31 -17 L31 58 L0 78Z M31 -17 L62 -35 L62 42 L31 58Z" fill="#ed8c47" stroke="#161719" strokeWidth="3" />
      </g>
      <text x="24" y="274" fill="#f36f3d" fontFamily='"DM Mono", monospace' fontSize="17" fontWeight="500" letterSpacing="3">CUBE / 01</text>
    </svg>
  );
}
