import {
  Award,
  BadgeCheck,
  Coffee,
  Expand,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shrink,
  ShieldAlert,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { t } from "@/content/zh-CN";
import { gameBridge } from "@/game/bridge";
import { createGame } from "@/game/createGame";
import type { GameSettings, GameSnapshot } from "@/game/types";

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatLine({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <strong className={accent ? "accent-value" : undefined}>{value}</strong>
    </div>
  );
}

function LifeStrip({ lives, maxLives }: { lives: number; maxLives: number }) {
  return (
    <div className="life-strip" aria-label={`${t("lives")} ${lives}/${maxLives}`}>
      {Array.from({ length: maxLives }, (_, index) => (
        <span key={index} className={index < lives ? "life active" : "life"}>
          <BadgeCheck size={18} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

function PhaserStage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const game = createGame(mountRef.current);
    return () => game.destroy(true);
  }, []);

  return <div ref={mountRef} className="phaser-mount" />;
}

function LeftHud({ game }: { game: GameSnapshot }) {
  return (
    <aside className="side-hud side-hud-left">
      <div>
        <p className="hud-kicker">{t("level")}</p>
        <p className="hud-stage">{String(game.level).padStart(2, "0")}</p>
        <h2>{game.levelName || t("title")}</h2>
      </div>

      <div className="hud-section">
        <p className="hud-kicker">{t("wave")}</p>
        <div className="wave-track">
          {Array.from({ length: game.totalWaves }, (_, index) => (
            <span
              key={index}
              className={index < game.wave ? "wave-dot active" : "wave-dot"}
            />
          ))}
          <span className={game.bossName ? "wave-boss active" : "wave-boss"}>
            B
          </span>
        </div>
      </div>

      <div className="hud-section">
        <p className="hud-kicker">{t("lives")}</p>
        <LifeStrip lives={game.lives} maxLives={game.maxLives} />
      </div>

      <div className="hud-section">
        <StatLine label={t("weapon")} value={`LV.${game.weaponLevel}`} accent />
        <StatLine
          label={t("skill")}
          value={
            <span className="skill-count">
              <Zap size={16} aria-hidden="true" />
              {game.skillCharges}
            </span>
          }
        />
      </div>
    </aside>
  );
}

function RightHud({ game }: { game: GameSnapshot }) {
  return (
    <aside className="side-hud side-hud-right">
      <div>
        <p className="hud-kicker">{t("score")}</p>
        <p className="score-number">{game.score.toLocaleString("zh-CN")}</p>
      </div>

      <div className="combo-block">
        <span>{t("combo")}</span>
        <strong>×{game.combo}</strong>
      </div>

      <div className="hud-section detail-stats">
        <StatLine label={t("defeated")} value={game.stats.defeated} />
        <StatLine label={t("escaped")} value={game.stats.escaped} />
      </div>

      <div className="controls-note">
        <span>{t("keyboardMoveHint")}</span>
        <span>{t("keyboardSkillHint")}</span>
        <span>{t("keyboardPauseHint")}</span>
      </div>
    </aside>
  );
}

function MobileHud() {
  const game = useSyncExternalStore(
    gameBridge.subscribe,
    gameBridge.getSnapshot,
    gameBridge.getSnapshot
  );

  return (
    <div className="mobile-hud">
      <div className="mobile-hud-top">
        <div>
          <span>
            {game.level}-{Math.max(1, game.wave)}
          </span>
          <strong>{game.score.toLocaleString("zh-CN")}</strong>
        </div>
        <LifeStrip lives={game.lives} maxLives={game.maxLives} />
      </div>
      <button
        type="button"
        className="mobile-skill"
        disabled={game.skillCharges <= 0}
        aria-label={t("skill")}
        onClick={() => gameBridge.command({ type: "skill" })}
      >
        <Zap size={24} aria-hidden="true" />
        <span>{game.skillCharges}</span>
      </button>
    </div>
  );
}

function SettingsDialog({
  settings,
  onChange,
  onClose,
}: {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="settings-dialog" role="dialog" aria-modal="true">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">{t("systemLabel")}</p>
            <h2>{t("settings")}</h2>
          </div>
          <IconButton label={t("close")} onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>

        <label className="volume-control">
          <span>
            <Volume2 size={18} aria-hidden="true" />
            {t("music")}
          </span>
          <strong>{Math.round(settings.musicVolume * 100)}</strong>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={(event) =>
              onChange({ ...settings, musicVolume: Number(event.target.value) })
            }
          />
        </label>

        <label className="volume-control">
          <span>
            <Zap size={18} aria-hidden="true" />
            {t("effects")}
          </span>
          <strong>{Math.round(settings.effectsVolume * 100)}</strong>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.effectsVolume}
            onChange={(event) =>
              onChange({ ...settings, effectsVolume: Number(event.target.value) })
            }
          />
        </label>
      </section>
    </div>
  );
}

function Menu({
  onStart,
  onSettings,
}: {
  onStart: () => void;
  onSettings: () => void;
}) {
  const record = useSyncExternalStore(
    gameBridge.subscribeRecord,
    gameBridge.getRecord,
    gameBridge.getRecord
  );

  return (
    <section className="menu-screen">
      <div className="menu-copy">
        <div className="brand-lockup">
          <p>{t("brand")}</p>
          <span>{t("unitLabel")}</span>
        </div>
        <h1>{t("title")}</h1>
        <p className="tagline">{t("tagline")}</p>

        <div className="menu-actions">
          <button type="button" className="primary-action" onClick={onStart}>
            <Play size={20} fill="currentColor" aria-hidden="true" />
            {t("start")}
          </button>
          <IconButton label={t("settings")} onClick={onSettings}>
            <Settings size={22} />
          </IconButton>
        </div>

        <div className="record-strip">
          <div>
            <span>{t("bestScore")}</span>
            <strong>{record.bestScore.toLocaleString("zh-CN")}</strong>
          </div>
          <div>
            <span>{t("bestGrade")}</span>
            <strong>{record.bestGrade ?? t("gradeFallback")}</strong>
          </div>
          <div>
            <span>{record.cleared ? t("cleared") : t("uncleared")}</span>
            {record.cleared ? <Trophy size={18} /> : <ShieldAlert size={18} />}
          </div>
        </div>
      </div>

      <div className="menu-art" aria-hidden="true">
        <span className="exit-sign">{t("exitLabel")}</span>
        <img src={`${ASSET_ROOT}player.svg`} alt="" />
        <span className="paper paper-one" />
        <span className="paper paper-two" />
        <span className="paper paper-three" />
      </div>
    </section>
  );
}

function ResultScreen({
  victory,
  onRetry,
  onHome,
}: {
  victory: boolean;
  onRetry: () => void;
  onHome: () => void;
}) {
  const game = useSyncExternalStore(
    gameBridge.subscribe,
    gameBridge.getSnapshot,
    gameBridge.getSnapshot
  );

  return (
    <section className={victory ? "result-screen victory" : "result-screen failure"}>
      <div className="result-mark">
        {victory ? <Trophy size={34} /> : <Coffee size={34} />}
      </div>
      <p className="eyebrow">
        {victory ? t("clockedOutLabel") : t("overtimeLabel")}
      </p>
      <h2>{victory ? t("victory") : t("gameOver")}</h2>
      <p className="result-hint">{victory ? t("victoryHint") : t("gameOverHint")}</p>

      <div className="result-score">
        <span>{t("score")}</span>
        <strong>{game.score.toLocaleString("zh-CN")}</strong>
        {victory ? (
          <div className="grade-stamp">
            <span>{t("finalGrade")}</span>
            <b>{game.finalGrade}</b>
          </div>
        ) : null}
      </div>

      <div className="result-stats">
        <StatLine label={t("defeated")} value={game.stats.defeated} />
        <StatLine label={t("escaped")} value={game.stats.escaped} />
        <StatLine label={t("combo")} value={`×${game.stats.maxCombo}`} />
      </div>

      {game.isNewBest ? (
        <p className="new-record">
          <Award size={18} />
          {t("newBest")}
        </p>
      ) : null}

      <div className="result-actions">
        <button type="button" className="primary-action" onClick={onRetry}>
          <RotateCcw size={20} />
          {t("retry")}
        </button>
        <button type="button" className="secondary-action" onClick={onHome}>
          {t("backHome")}
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const game = useSyncExternalStore(
    gameBridge.subscribe,
    gameBridge.getSnapshot,
    gameBridge.getSnapshot
  );
  const settings = useSyncExternalStore(
    gameBridge.subscribeSettings,
    gameBridge.getSettings,
    gameBridge.getSettings
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const resumeAfterSettingsRef = useRef(false);

  function pauseForSettings() {
    const status = gameBridge.getSnapshot().status;
    if (status !== "playing") return;
    resumeAfterSettingsRef.current = true;
    gameBridge.command({ type: "pause" });
  }

  function openSettings() {
    pauseForSettings();
    setSettingsOpen(true);
    window.setTimeout(pauseForSettings, 0);
  }

  function closeSettings() {
    setSettingsOpen(false);
    if (
      resumeAfterSettingsRef.current &&
      gameBridge.getSnapshot().status === "paused"
    ) {
      gameBridge.command({ type: "resume" });
    }
    resumeAfterSettingsRef.current = false;
  }

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleVisibility = () => {
      if (document.hidden && gameBridge.getSnapshot().status === "playing") {
        gameBridge.command({ type: "pause" });
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (settingsOpen) {
        closeSettings();
        return;
      }
      const status = gameBridge.getSnapshot().status;
      if (status === "playing") gameBridge.command({ type: "pause" });
      else if (status === "paused") gameBridge.command({ type: "resume" });
    };
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKey);
    handleFullscreen();
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKey);
    };
  }, [settingsOpen]);

  async function requestFullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }

  const inRun = game.status === "playing" || game.status === "paused";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="mini-brand">
          <strong>{t("brand")}</strong>
          <span>{t("title")}</span>
        </div>
        <div className="topbar-actions">
          {inRun ? (
            <IconButton
              label={t("pause")}
              onClick={() => gameBridge.command({ type: "pause" })}
            >
              <Pause size={20} fill="currentColor" />
            </IconButton>
          ) : null}
          <IconButton
            label={isFullscreen ? t("exitFullScreen") : t("fullScreen")}
            onClick={() => void requestFullscreen()}
          >
            {isFullscreen ? <Shrink size={20} /> : <Expand size={20} />}
          </IconButton>
          <IconButton label={t("settings")} onClick={openSettings}>
            <Settings size={20} />
          </IconButton>
        </div>
      </header>

      <div className={inRun ? "game-layout is-running" : "game-layout"}>
        {inRun ? <LeftHud game={game} /> : null}

        <section className="stage-column">
          <div className="stage-frame">
            <PhaserStage />
            {inRun ? <MobileHud /> : null}

            {game.banner ? (
              <div className="game-banner" role="status">
                {game.banner.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : null}

            {game.bossName && game.bossHealth !== null && game.bossMaxHealth ? (
              <div className="boss-meter">
                <div>
                  <span>{t("boss")}</span>
                  <strong>{game.bossName}</strong>
                </div>
                <div className="boss-track">
                  <span
                    style={{
                      width: `${Math.max(0, (game.bossHealth / game.bossMaxHealth) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {game.status === "menu" ? (
              <Menu
                onStart={() => gameBridge.command({ type: "start" })}
                onSettings={openSettings}
              />
            ) : null}

            {game.status === "paused" ? (
              <section className="pause-screen">
                <p className="eyebrow">{t("pausedLabel")}</p>
                <h2>{t("paused")}</h2>
                <p>{t("pausedHint")}</p>
                <div className="pause-actions">
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => gameBridge.command({ type: "resume" })}
                  >
                    <Play size={20} fill="currentColor" />
                    {t("continue")}
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => gameBridge.command({ type: "home" })}
                  >
                    {t("backHome")}
                  </button>
                </div>
              </section>
            ) : null}

            {game.status === "gameover" ? (
              <ResultScreen
                victory={false}
                onRetry={() => gameBridge.command({ type: "restart" })}
                onHome={() => gameBridge.command({ type: "home" })}
              />
            ) : null}

            {game.status === "victory" ? (
              <ResultScreen
                victory
                onRetry={() => gameBridge.command({ type: "restart" })}
                onHome={() => gameBridge.command({ type: "home" })}
              />
            ) : null}
          </div>
        </section>

        {inRun ? <RightHud game={game} /> : null}
      </div>

      {settingsOpen ? (
        <SettingsDialog
          settings={settings}
          onChange={(next) => gameBridge.setSettings(next)}
          onClose={closeSettings}
        />
      ) : null}

      <div className="orientation-blocker">
        <RotateCcw size={36} />
        <h2>{t("orientation")}</h2>
        <p>{t("orientationHint")}</p>
      </div>
    </main>
  );
}
