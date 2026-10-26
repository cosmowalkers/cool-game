import { ArrowUpRight, Gamepad2, Sparkles } from "lucide-react";
import { GomokuCover, JunqiCover } from "./covers";
import { copy, games } from "./content/zh-CN";

const COVER_ART = {
  gomoku: <GomokuCover />,
  junqi: <JunqiCover />,
} as const;

function GameCard({
  title,
  subtitle,
  description,
  href,
  image,
  art,
  tone,
  status,
  index,
}: (typeof games)[number] & { index: number }) {
  const available = status === "available";
  const coverArt = art ? COVER_ART[art] : null;

  return (
    <article className={`game-card tone-${tone} ${available ? "" : "is-coming"}`}>
      <div className="game-card-art" aria-hidden="true">
        {image ? (
          <img src={image} alt="" width="240" height="300" />
        ) : coverArt ? (
          <span className="game-card-cover">{coverArt}</span>
        ) : (
          <Gamepad2 size={72} strokeWidth={1.2} />
        )}
        <span className="game-index">/{title.slice(0, 2)}</span>
      </div>

      <div className="game-card-content">
        <div className="game-card-heading">
          <div>
            <p className="game-card-kicker">{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <span className="game-status">
            {available ? String(index + 1).padStart(2, "0") : "SOON"}
          </span>
        </div>
        <p className="game-card-description">{description}</p>
        {available ? (
          <a className="game-action" href={href} aria-label={`${copy.available}：${title}`}>
            <span>{copy.available}</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        ) : (
          <span className="game-action is-disabled">
            <span>{copy.coming}</span>
          </span>
        )}
      </div>
    </article>
  );
}

export default function App() {
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <a className="brand" href="/" aria-label={copy.brand}>
          <span className="brand-mark">
            <Gamepad2 size={20} aria-hidden="true" />
          </span>
          <span>{copy.brand}</span>
        </a>
        <span className="header-count">{copy.gameCount(games.length)}</span>
      </header>

      <section className="portal-intro">
        <div className="intro-copy">
          <p className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h1>{copy.title}</h1>
          <p className="intro-description">{copy.description}</p>
        </div>
        <div className="intro-stamp" aria-hidden="true">
          <span>PLAY</span>
          <strong>∞</strong>
        </div>
      </section>

      <section className="games-grid" aria-label={copy.brand}>
        {games.map((game, index) => (
          <GameCard key={game.id} {...game} index={index} />
        ))}
      </section>

      <footer className="portal-footer">
        <span>COOL / COSMOWALKERS</span>
        <span>ONE入口 · MANY GAMES</span>
      </footer>
    </main>
  );
}
