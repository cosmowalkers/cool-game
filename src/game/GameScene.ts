import Phaser from "phaser";
import { bossPhaseLabel, t } from "@/content/zh-CN";
import { AudioDirector } from "@/game/AudioDirector";
import { gameBridge, gradeRun } from "@/game/bridge";
import { LEVELS, type EnemyKind, type WaveSpec } from "@/game/levels";
import type { GameCommand } from "@/game/types";

const WIDTH = 540;
const HEIGHT = 960;
const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

type ArcadeSprite = Phaser.Physics.Arcade.Sprite;
type ArcadeImage = Phaser.Physics.Arcade.Image;
type PickupKind = "coffee" | "life" | "skill";

interface EnemyTuning {
  hp: number;
  speed: number;
  score: number;
  size: number;
}

const ENEMY_TUNING: Record<EnemyKind, EnemyTuning> = {
  folder: { hp: 2, speed: 132, score: 200, size: 54 },
  message: { hp: 1, speed: 188, score: 180, size: 48 },
  meeting: { hp: 4, speed: 92, score: 330, size: 60 },
  requirement: { hp: 3, speed: 168, score: 290, size: 58 },
  report: { hp: 5, speed: 86, score: 430, size: 64 },
  alert: { hp: 2, speed: 410, score: 360, size: 46 },
};

const ENEMY_TEXTURE: Record<EnemyKind, string> = {
  folder: "enemy-folder",
  message: "enemy-message",
  meeting: "enemy-meeting",
  requirement: "enemy-requirement",
  report: "enemy-report",
  alert: "enemy-alert",
};

export class GameScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.TileSprite;
  private player: ArcadeSprite | null = null;
  private playerGroup!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D" | "SPACE", Phaser.Input.Keyboard.Key>;
  private audio = new AudioDirector(gameBridge.getSettings());
  private removeCommandListener: (() => void) | null = null;
  private pointerTarget = new Phaser.Math.Vector2(WIDTH / 2, HEIGHT * 0.8);
  private pointerActive = false;
  private desktopPointer = false;
  private running = false;
  private pausedByUi = false;
  private transitioning = false;
  private levelIndex = 0;
  private waveIndex = -1;
  private pendingSpawns = 0;
  private waveClearing = false;
  private bossActive = false;
  private boss: ArcadeSprite | null = null;
  private bossPhase = 1;
  private nextShotAt = 0;
  private invulnerableUntil = 0;
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private lives = 3;
  private weaponLevel = 1;
  private skillCharges = 1;
  private defeated = 0;
  private escaped = 0;
  private tutorialPending = false;
  private bannerTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("game");
  }

  preload(): void {
    const assets: Record<string, string> = {
      player: "player.png",
      "enemy-folder": "enemy-folder.png",
      "enemy-message": "enemy-message.png",
      "enemy-meeting": "enemy-meeting.png",
      "enemy-requirement": "enemy-requirement.png",
      "enemy-report": "enemy-report.png",
      "enemy-alert": "enemy-alert.png",
      "boss-demand": "boss-demand.png",
      "boss-meeting": "boss-meeting.png",
      "boss-owner": "boss-owner.png",
      "pickup-coffee": "pickup-coffee.png",
      "pickup-life": "pickup-life.png",
      "pickup-skill": "pickup-skill.png",
      "bg-workstation": "bg-workstation.png",
      "bg-meeting": "bg-meeting.png",
      "bg-elevator": "bg-elevator.png",
    };
    for (const [key, file] of Object.entries(assets)) {
      this.load.image(key, `${ASSET_ROOT}${file}`);
    }
  }

  create(): void {
    this.createGeneratedTextures();
    this.background = this.add
      .tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, "bg-workstation")
      .setDepth(-20);

    this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH - 24, HEIGHT - 24)
      .setStrokeStyle(2, 0xffffff, 0.08)
      .setDepth(30);

    this.enemies = this.physics.add.group();
    this.playerGroup = this.physics.add.group({ maxSize: 1 });
    this.playerBullets = this.physics.add.group({ maxSize: 100 });
    this.enemyBullets = this.physics.add.group({ maxSize: 180 });
    this.pickups = this.physics.add.group({ maxSize: 12 });

    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      (bullet, enemy) =>
        this.handleBulletHit(
          bullet as Phaser.Types.Physics.Arcade.GameObjectWithBody,
          enemy as Phaser.Types.Physics.Arcade.GameObjectWithBody
        )
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.playerGroup,
      (bullet) => this.handlePlayerHit(bullet as ArcadeImage)
    );
    this.physics.add.overlap(
      this.enemies,
      this.playerGroup,
      (enemy) => this.handlePlayerHit(enemy as ArcadeSprite)
    );
    this.physics.add.overlap(
      this.pickups,
      this.playerGroup,
      (pickup) => this.collectPickup(pickup as ArcadeSprite)
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys(
      "W,A,S,D,SPACE"
    ) as Record<"W" | "A" | "S" | "D" | "SPACE", Phaser.Input.Keyboard.Key>;
    this.desktopPointer = this.sys.game.device.os.desktop;

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.desktopPointer || pointer.isDown) {
        this.pointerTarget.set(pointer.x, pointer.y);
        this.pointerActive = true;
      }
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.pointerTarget.set(pointer.x, pointer.y);
      this.pointerActive = true;
    });
    this.input.on("pointerup", () => {
      if (!this.desktopPointer) this.pointerActive = false;
    });

    this.input.keyboard!.on("keydown-SPACE", () => this.activateSkill());
    this.removeCommandListener = gameBridge.onCommand((command) =>
      this.handleCommand(command)
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeCommandListener?.();
      this.audio.destroy();
    });
  }

  update(time: number, delta: number): void {
    this.background.tilePositionY -= delta * (this.running ? 0.075 : 0.025);
    if (!this.running || this.pausedByUi || !this.player) return;

    this.updatePlayer(delta);
    this.updatePlayerBullets();
    this.updateEnemies(time, delta);
    this.updateEnemyBullets();
    this.updatePickups(delta);
    this.updateBoss(time);

    if (time >= this.nextShotAt) {
      this.firePlayerShot();
      this.nextShotAt = time + Math.max(105, 220 - this.weaponLevel * 28);
    }

    if (
      !this.bossActive &&
      !this.waveClearing &&
      !this.transitioning &&
      this.pendingSpawns === 0 &&
      this.enemies.countActive(true) === 0 &&
      this.waveIndex >= 0
    ) {
      this.waveClearing = true;
      this.time.delayedCall(850, () => this.startNextWave());
    }
  }

  private handleCommand(command: GameCommand): void {
    switch (command.type) {
      case "start":
      case "restart":
        this.startRun();
        break;
      case "pause":
        this.pauseRun();
        break;
      case "resume":
        this.resumeRun();
        break;
      case "home":
        this.returnHome();
        break;
      case "skill":
        this.activateSkill();
        break;
      case "settings":
        this.audio.updateSettings(command.settings);
        if (command.settings.musicVolume > 0 && this.running) this.audio.startMusic();
        if (command.settings.musicVolume === 0) this.audio.stopMusic();
        break;
    }
  }

  private startRun(): void {
    this.time.removeAllEvents();
    this.time.paused = false;
    this.tweens.killAll();
    this.clearWorld();
    this.running = true;
    this.pausedByUi = false;
    this.transitioning = true;
    this.levelIndex = 0;
    this.waveIndex = -1;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = 3;
    this.weaponLevel = 1;
    this.skillCharges = 1;
    this.defeated = 0;
    this.escaped = 0;
    this.invulnerableUntil = 0;
    this.bossActive = false;
    this.boss = null;
    this.tutorialPending = !gameBridge.getSettings().tutorialSeen;

    this.player = this.physics.add
      .sprite(WIDTH / 2, HEIGHT - 138, "player")
      .setDisplaySize(76, 94)
      .setDepth(10)
      .setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(19, 19, 42);
    this.playerGroup.add(this.player);

    gameBridge.reset();
    this.audio.setBossLayer(false);
    this.audio.startMusic();
    this.publish();
    this.showBanner(t("firstLine"), 1150);
    this.time.delayedCall(900, () => this.beginLevel(0));
  }

  private beginLevel(index: number): void {
    this.levelIndex = index;
    this.waveIndex = -1;
    this.transitioning = true;
    this.bossActive = false;
    this.boss = null;
    this.clearCombatObjects();

    const level = LEVELS[index];
    this.background.setTexture(level.background);
    this.background.setTint(0xffffff);
    this.showBanner(`${level.name} · ${level.zone}\n${level.intro}`, 1700);
    this.publish();
    this.time.delayedCall(1250, () => {
      this.transitioning = false;
      this.startNextWave();
    });
  }

  private startNextWave(): void {
    if (!this.running) return;
    const level = LEVELS[this.levelIndex];
    const nextWave = this.waveIndex + 1;
    if (nextWave >= level.waves.length) {
      this.spawnBoss();
      return;
    }

    this.waveIndex = nextWave;
    this.waveClearing = false;
    const wave = level.waves[nextWave];
    this.showBanner(`${String(nextWave + 1).padStart(2, "0")} · ${wave.label}`, 900);
    this.launchWave(wave);
    this.publish();
  }

  private launchWave(wave: WaveSpec): void {
    this.pendingSpawns = wave.count;
    for (let index = 0; index < wave.count; index += 1) {
      this.time.delayedCall(index * 255, () => {
        if (!this.running) return;
        const isLast = index === wave.count - 1;
        const kind =
          wave.support && index > 0 && index % 3 === 0 ? wave.support : wave.kind;
        const enemy = this.spawnEnemy(
          isLast && wave.elite ? wave.elite : kind,
          index,
          wave.count,
          wave.formation,
          isLast
        );
        if (isLast && wave.guaranteedDrop) enemy.setData("drop", wave.guaranteedDrop);
        this.pendingSpawns -= 1;
      });
    }
  }

  private spawnEnemy(
    kind: EnemyKind,
    index: number,
    total: number,
    formation: WaveSpec["formation"],
    elite: boolean
  ): ArcadeSprite {
    const tuning = ENEMY_TUNING[kind];
    const position = this.formationPosition(index, total, formation);
    const sprite = this.enemies
      .create(position.x, position.y, ENEMY_TEXTURE[kind])
      .setDisplaySize(tuning.size, tuning.size)
      .setDepth(5) as ArcadeSprite;

    const hp = elite ? tuning.hp * 3 : tuning.hp;
    sprite.setData({
      kind,
      hp,
      maxHp: hp,
      speed: tuning.speed * (elite ? 0.88 : 1),
      score: tuning.score * (elite ? 3 : 1),
      elite,
      baseX: position.x,
      phase: index * 0.83 + Math.random(),
      bornAt: this.time.now,
      targetX: Phaser.Math.Between(70, WIDTH - 70),
      nextFireAt: this.time.now + Phaser.Math.Between(800, 1500),
      horizontal: index % 2 === 0 ? 1 : -1,
      boss: false,
    });
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(tuning.size * 0.3, tuning.size * 0.2, tuning.size * 0.2);
    if (elite) {
      sprite.setScale(sprite.scaleX * 1.18);
      sprite.setTint(LEVELS[this.levelIndex].accent);
      this.add
        .circle(position.x, position.y, tuning.size * 0.62)
        .setStrokeStyle(2, LEVELS[this.levelIndex].accent, 0.8)
        .setData("follows", sprite)
        .setDepth(4);
    }
    if (kind === "alert") this.addAlertWarning(position.x);
    return sprite;
  }

  private formationPosition(
    index: number,
    total: number,
    formation: WaveSpec["formation"]
  ): Phaser.Math.Vector2 {
    const margin = 72;
    const width = WIDTH - margin * 2;
    const ratio = total <= 1 ? 0.5 : index / (total - 1);
    switch (formation) {
      case "vee":
        return new Phaser.Math.Vector2(
          margin + ratio * width,
          -90 - Math.abs(index - (total - 1) / 2) * 35
        );
      case "sweep":
        return new Phaser.Math.Vector2(index % 2 === 0 ? 72 : WIDTH - 72, -80 - index * 82);
      case "alternating":
        return new Phaser.Math.Vector2(
          index % 2 === 0 ? 130 : WIDTH - 130,
          -80 - index * 72
        );
      case "line":
      default:
        return new Phaser.Math.Vector2(margin + ratio * width, -90 - (index % 2) * 48);
    }
  }

  private updatePlayer(delta: number): void {
    if (!this.player) return;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const keyboardActive = left || right || up || down;
    const speed = 330;

    if (keyboardActive) {
      const direction = new Phaser.Math.Vector2(
        Number(right) - Number(left),
        Number(down) - Number(up)
      ).normalize();
      this.player.x += direction.x * speed * (delta / 1000);
      this.player.y += direction.y * speed * (delta / 1000);
      this.pointerTarget.set(this.player.x, this.player.y);
      this.markTutorialSeen();
    } else if (this.pointerActive) {
      this.player.x = Phaser.Math.Linear(this.player.x, this.pointerTarget.x, 0.24);
      this.player.y = Phaser.Math.Linear(this.player.y, this.pointerTarget.y, 0.24);
      this.markTutorialSeen();
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, 42, WIDTH - 42);
    this.player.y = Phaser.Math.Clamp(this.player.y, HEIGHT * 0.34, HEIGHT - 52);
    this.player.setRotation(
      Phaser.Math.Clamp((this.pointerTarget.x - this.player.x) / 500, -0.08, 0.08)
    );
  }

  private markTutorialSeen(): void {
    if (!this.tutorialPending) return;
    this.tutorialPending = false;
    const current = gameBridge.getSettings();
    gameBridge.setSettings({ ...current, tutorialSeen: true });
    this.showBanner(
      this.desktopPointer ? t("tutorialSkillDesktop") : t("tutorialSkillTouch"),
      1800
    );
  }

  private updateEnemies(time: number, delta: number): void {
    const dt = delta / 1000;
    for (const item of this.enemies.getChildren()) {
      const enemy = item as ArcadeSprite;
      if (!enemy.active || enemy.getData("boss")) continue;
      const kind = enemy.getData("kind") as EnemyKind;
      const speed = enemy.getData("speed") as number;
      const phase = enemy.getData("phase") as number;
      const baseX = enemy.getData("baseX") as number;
      const bornAt = enemy.getData("bornAt") as number;

      if (kind === "folder") {
        enemy.y += speed * dt;
        enemy.x = baseX + Math.sin(time / 470 + phase) * 42;
      } else if (kind === "message") {
        enemy.y += speed * dt;
        enemy.x = baseX + Math.sin(time / 260 + phase) * 88;
      } else if (kind === "meeting") {
        enemy.y += (enemy.y < 190 ? speed : 28) * dt;
        enemy.x = baseX + Math.sin(time / 610 + phase) * 62;
        this.tryEnemyShot(enemy, time, "fan");
      } else if (kind === "requirement") {
        enemy.y += speed * dt;
        enemy.x = Phaser.Math.Linear(
          enemy.x,
          enemy.getData("targetX") as number,
          0.012
        );
      } else if (kind === "report") {
        enemy.y += (enemy.y < 165 ? speed : 18) * dt;
        const direction = enemy.getData("horizontal") as number;
        enemy.x += direction * 92 * dt;
        if (enemy.x < 62 || enemy.x > WIDTH - 62) {
          enemy.setData("horizontal", direction * -1);
        }
        this.tryEnemyShot(enemy, time, "target");
      } else if (kind === "alert") {
        if (time - bornAt > 520) {
          enemy.setAlpha(1);
          enemy.y += speed * dt;
        } else {
          enemy.alpha = 0.35 + Math.sin(time / 45) * 0.25;
        }
      }

      if (enemy.y > HEIGHT + 80) this.handleEnemyEscape(enemy);
    }

    for (const child of this.children.list) {
      const follows = child.getData?.("follows") as ArcadeSprite | undefined;
      if (!follows) continue;
      if (!follows.active) {
        child.destroy();
      } else {
        (child as Phaser.GameObjects.Arc).setPosition(follows.x, follows.y);
      }
    }
  }

  private tryEnemyShot(enemy: ArcadeSprite, time: number, pattern: "fan" | "target"): void {
    const nextFireAt = enemy.getData("nextFireAt") as number;
    if (time < nextFireAt || enemy.y < 70 || !this.player) return;
    enemy.setData("nextFireAt", time + (pattern === "fan" ? 1750 : 1350));
    if (pattern === "fan") {
      for (const offset of [-0.34, 0, 0.34]) {
        this.fireEnemyBullet(enemy.x, enemy.y + 24, Math.PI / 2 + offset, 195);
      }
    } else {
      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y
      );
      this.fireEnemyBullet(enemy.x, enemy.y + 20, angle, 230);
    }
  }

  private handleEnemyEscape(enemy: ArcadeSprite): void {
    if (enemy.getData("elite")) {
      enemy.setPosition(Phaser.Math.Between(80, WIDTH - 80), -90);
      enemy.setData("baseX", enemy.x);
      enemy.setData("targetX", Phaser.Math.Between(70, WIDTH - 70));
      return;
    }
    this.escaped += 1;
    this.combo = 0;
    enemy.destroy();
    this.publish();
  }

  private firePlayerShot(): void {
    if (!this.player) return;
    const patterns: Record<number, Array<{ x: number; angle: number; pierce: number }>> = {
      1: [{ x: 0, angle: 0, pierce: 0 }],
      2: [
        { x: -14, angle: 0, pierce: 0 },
        { x: 14, angle: 0, pierce: 0 },
      ],
      3: [
        { x: -18, angle: -0.15, pierce: 0 },
        { x: 0, angle: 0, pierce: 0 },
        { x: 18, angle: 0.15, pierce: 0 },
      ],
      4: [
        { x: -24, angle: -0.16, pierce: 2 },
        { x: -8, angle: -0.05, pierce: 2 },
        { x: 8, angle: 0.05, pierce: 2 },
        { x: 24, angle: 0.16, pierce: 2 },
      ],
    };

    for (const shot of patterns[this.weaponLevel]) {
      const bullet = this.playerBullets.get(
        this.player.x + shot.x,
        this.player.y - 44,
        "bullet-player"
      ) as ArcadeImage | null;
      if (!bullet) continue;
      bullet
        .setActive(true)
        .setVisible(true)
        .setDepth(6)
        .setData("pierce", shot.pierce);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.setVelocity(Math.sin(shot.angle) * 125, -580);
    }
    if (this.time.now % 3 < 1) this.audio.sfx("shoot");
  }

  private updatePlayerBullets(): void {
    for (const item of this.playerBullets.getChildren()) {
      const bullet = item as ArcadeImage;
      if (bullet.active && bullet.y < -40) this.recycleBullet(bullet);
    }
  }

  private handleBulletHit(
    bulletObject: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObject: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const bullet = bulletObject as ArcadeImage;
    const enemy = enemyObject as ArcadeSprite;
    if (!bullet.active || !enemy.active) return;

    const hp = (enemy.getData("hp") as number) - 1;
    enemy.setData("hp", hp);
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(45, () => {
      if (enemy.active) {
        if (enemy.getData("elite")) enemy.setTint(LEVELS[this.levelIndex].accent);
        else enemy.clearTint();
      }
    });

    const pierce = bullet.getData("pierce") as number;
    if (pierce > 0) bullet.setData("pierce", pierce - 1);
    else this.recycleBullet(bullet);

    if (enemy.getData("boss")) {
      this.updateBossHealth(enemy, hp);
    } else if (hp <= 0) {
      this.defeatEnemy(enemy);
    } else {
      this.audio.sfx("hit");
    }
  }

  private updateBossHealth(enemy: ArcadeSprite, hp: number): void {
    const maxHp = enemy.getData("maxHp") as number;
    gameBridge.patch({ bossHealth: Math.max(0, hp) });
    if (hp <= 0) {
      this.defeatEnemy(enemy);
      this.finishBoss();
      return;
    }

    const phases = LEVELS[this.levelIndex].bossPhases;
    const nextPhase = Math.min(phases, Math.floor((1 - hp / maxHp) * phases) + 1);
    if (nextPhase > this.bossPhase) {
      this.bossPhase = nextPhase;
      this.showBanner(bossPhaseLabel(nextPhase), 900);
      this.flash(LEVELS[this.levelIndex].accent, 0.22);
      this.audio.sfx("warning");
    }
  }

  private defeatEnemy(enemy: ArcadeSprite): void {
    if (!enemy.active) return;
    const wasBoss = Boolean(enemy.getData("boss"));
    const baseScore = enemy.getData("score") as number;
    const multiplier = 1 + Math.min(this.combo, 20) * 0.05;
    this.score += Math.round(baseScore * multiplier);
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.defeated += 1;
    this.paperBurst(enemy.x, enemy.y, wasBoss ? 18 : 7);

    const guaranteed = enemy.getData("drop") as PickupKind | undefined;
    if (guaranteed) this.spawnPickup(enemy.x, enemy.y, guaranteed);
    else if (!wasBoss && Math.random() < 0.075) this.spawnPickup(enemy.x, enemy.y, "coffee");

    enemy.destroy();
    this.audio.sfx(wasBoss ? "boss" : "hit");
    this.publish();
  }

  private spawnPickup(x: number, y: number, kind: PickupKind): void {
    const pickup = this.pickups.get(x, y, `pickup-${kind}`) as ArcadeSprite | null;
    if (!pickup) return;
    pickup
      .setTexture(`pickup-${kind}`)
      .setDisplaySize(48, 48)
      .setActive(true)
      .setVisible(true)
      .setDepth(8)
      .setData("kind", kind)
      .setData("phase", Math.random() * Math.PI * 2);
    const body = pickup.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setCircle(18, 6, 6);
  }

  private updatePickups(delta: number): void {
    for (const item of this.pickups.getChildren()) {
      const pickup = item as ArcadeSprite;
      if (!pickup.active) continue;
      pickup.y += 92 * (delta / 1000);
      pickup.x += Math.sin(this.time.now / 280 + pickup.getData("phase")) * 0.7;
      pickup.rotation += 0.012;
      if (pickup.y > HEIGHT + 60) pickup.destroy();
    }
  }

  private collectPickup(pickup: ArcadeSprite): void {
    if (!pickup.active) return;
    const kind = pickup.getData("kind") as PickupKind;
    if (kind === "coffee") {
      if (this.weaponLevel < 4) this.weaponLevel += 1;
      else this.score += 900;
    } else if (kind === "life") {
      if (this.lives < 3) this.lives += 1;
      else this.score += 1500;
    } else {
      if (this.skillCharges < 2) this.skillCharges += 1;
      else this.score += 1200;
    }
    pickup.destroy();
    this.audio.sfx("pickup");
    this.publish();
  }

  private updateEnemyBullets(): void {
    for (const item of this.enemyBullets.getChildren()) {
      const bullet = item as ArcadeImage;
      if (
        bullet.active &&
        (bullet.y > HEIGHT + 40 || bullet.y < -40 || bullet.x < -40 || bullet.x > WIDTH + 40)
      ) {
        this.recycleBullet(bullet);
      }
    }
  }

  private fireEnemyBullet(
    x: number,
    y: number,
    angle: number,
    speed: number,
    large = false
  ): void {
    const bullet = this.enemyBullets.get(
      x,
      y,
      large ? "bullet-danger" : "bullet-enemy"
    ) as ArcadeImage | null;
    if (!bullet) return;
    bullet
      .setTexture(large ? "bullet-danger" : "bullet-enemy")
      .setActive(true)
      .setVisible(true)
      .setDepth(7);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setCircle(large ? 8 : 5);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private handlePlayerHit(source: ArcadeImage | ArcadeSprite): void {
    if (!this.player || this.time.now < this.invulnerableUntil || !this.running) return;
    if (
      source !== this.player &&
      source.active &&
      !source.getData("boss")
    ) {
      source.destroy();
    }
    this.lives -= 1;
    this.weaponLevel = Math.max(1, this.weaponLevel - 1);
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 1200;
    this.audio.sfx("damage");
    this.flash(0xff5b45, 0.3);
    this.tweens.add({
      targets: this.player,
      alpha: 0.15,
      duration: 90,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.player?.setAlpha(1),
    });
    this.publish();
    if (this.lives <= 0) this.finishRun(false);
  }

  private activateSkill(): void {
    if (!this.running || this.pausedByUi || this.skillCharges <= 0) return;
    this.skillCharges -= 1;
    for (const item of this.enemyBullets.getChildren()) {
      const bullet = item as ArcadeImage;
      if (bullet.active) this.recycleBullet(bullet);
    }
    for (const item of [...this.enemies.getChildren()]) {
      const enemy = item as ArcadeSprite;
      if (!enemy.active) continue;
      const damage = enemy.getData("boss") ? 24 : 8;
      const hp = (enemy.getData("hp") as number) - damage;
      enemy.setData("hp", hp);
      if (enemy.getData("boss")) this.updateBossHealth(enemy, hp);
      else if (hp <= 0) this.defeatEnemy(enemy);
    }
    this.flash(0xffcc33, 0.46);
    this.audio.sfx("skill");
    this.publish();
  }

  private spawnBoss(): void {
    const level = LEVELS[this.levelIndex];
    this.bossActive = true;
    this.transitioning = false;
    this.bossPhase = 1;
    this.audio.setBossLayer(true);
    this.showBanner(`${level.bossName}\n“${level.bossLine}”`, 1800);
    this.audio.sfx("boss");

    const boss = this.enemies
      .create(WIDTH / 2, -110, level.bossTexture)
      .setDisplaySize(this.levelIndex === 2 ? 172 : 154, this.levelIndex === 2 ? 156 : 142)
      .setDepth(9) as ArcadeSprite;
    boss.setData({
      kind: "boss",
      hp: level.bossHealth,
      maxHp: level.bossHealth,
      score: 5000 + this.levelIndex * 2500,
      boss: true,
      nextFireAt: this.time.now + 1500,
    });
    (boss.body as Phaser.Physics.Arcade.Body).setCircle(52, 25, 20);
    this.boss = boss;
    this.tweens.add({ targets: boss, y: 142, duration: 900, ease: "Back.Out" });
    gameBridge.patch({
      wave: 6,
      bossName: level.bossName,
      bossHealth: level.bossHealth,
      bossMaxHealth: level.bossHealth,
    });
  }

  private updateBoss(time: number): void {
    if (!this.bossActive || !this.boss?.active || !this.player) return;
    this.boss.x = WIDTH / 2 + Math.sin(time / (680 - this.bossPhase * 70)) * 150;
    const nextFireAt = this.boss.getData("nextFireAt") as number;
    if (time < nextFireAt || this.boss.y < 100) return;
    const delay = Math.max(520, 1180 - this.bossPhase * 170);
    this.boss.setData("nextFireAt", time + delay);
    this.fireBossPattern();
  }

  private fireBossPattern(): void {
    if (!this.boss || !this.player) return;
    const x = this.boss.x;
    const y = this.boss.y + 55;

    if (this.levelIndex === 0) {
      const count = this.bossPhase === 1 ? 5 : 8;
      for (let index = 0; index < count; index += 1) {
        const spread = (index - (count - 1) / 2) * 0.16;
        this.fireEnemyBullet(x, y, Math.PI / 2 + spread, 205 + this.bossPhase * 18);
      }
      if (this.bossPhase === 2 && Math.random() < 0.45) {
        this.spawnEnemy("requirement", 0, 1, "line", false);
      }
    } else if (this.levelIndex === 1) {
      const count = this.bossPhase === 1 ? 9 : 13;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + this.time.now / 900;
        if (Math.sin(angle) > -0.45) this.fireEnemyBullet(x, y, angle, 175);
      }
      if (this.bossPhase === 2) {
        const target = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y);
        this.fireEnemyBullet(x, y, target, 285, true);
      }
    } else {
      if (this.bossPhase === 1) {
        for (const offset of [-0.4, -0.2, 0, 0.2, 0.4]) {
          this.fireEnemyBullet(x, y, Math.PI / 2 + offset, 225);
        }
      } else if (this.bossPhase === 2) {
        const target = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y);
        for (const offset of [-0.18, 0, 0.18]) {
          this.fireEnemyBullet(x, y, target + offset, 285, offset === 0);
        }
      } else {
        this.createOvertimeLane(Phaser.Math.Between(65, WIDTH - 65));
        for (let index = 0; index < 10; index += 1) {
          const angle = Math.PI / 2 - 0.72 + index * 0.16;
          this.fireEnemyBullet(x, y, angle, 245);
        }
      }
    }
  }

  private createOvertimeLane(x: number): void {
    const warning = this.add
      .rectangle(x, HEIGHT / 2, 56, HEIGHT, 0xff5b45, 0.18)
      .setDepth(3);
    this.audio.sfx("warning");
    this.tweens.add({
      targets: warning,
      alpha: 0.5,
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();
        for (let index = 0; index < 8; index += 1) {
          this.time.delayedCall(index * 75, () =>
            this.fireEnemyBullet(x, -20, Math.PI / 2, 430, true)
          );
        }
      },
    });
  }

  private finishBoss(): void {
    if (!this.bossActive) return;
    this.bossActive = false;
    this.boss = null;
    this.transitioning = true;
    this.audio.setBossLayer(false);
    this.clearEnemyBullets();
    this.spawnPickup(WIDTH / 2, 220, "life");
    gameBridge.patch({ bossName: null, bossHealth: null, bossMaxHealth: null });
    this.showBanner(t("stageComplete"), 1300);

    if (this.levelIndex >= LEVELS.length - 1) {
      this.time.delayedCall(1500, () => this.finishRun(true));
    } else {
      this.time.delayedCall(1800, () => this.beginLevel(this.levelIndex + 1));
    }
  }

  private finishRun(victory: boolean): void {
    if (!this.running) return;
    this.running = false;
    this.transitioning = false;
    this.clearEnemyBullets();
    this.audio.setBossLayer(false);
    this.audio.stopMusic();
    if (victory) {
      const grade = gradeRun(this.score, this.lives, this.escaped, this.skillCharges);
      this.audio.sfx("victory");
      gameBridge.finish(grade, true);
    } else {
      this.audio.sfx("gameover");
      gameBridge.finish(null, false);
    }
  }

  private pauseRun(): void {
    if (!this.running || this.pausedByUi) return;
    this.pausedByUi = true;
    this.time.paused = true;
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.audio.stopMusic();
    gameBridge.patch({ status: "paused" });
  }

  private resumeRun(): void {
    if (!this.running || !this.pausedByUi) return;
    this.pausedByUi = false;
    this.time.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
    this.audio.startMusic();
    gameBridge.patch({ status: "playing" });
  }

  private returnHome(): void {
    this.running = false;
    this.pausedByUi = false;
    this.time.paused = false;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.physics.world.resume();
    this.audio.stopMusic();
    this.clearWorld();
    gameBridge.patch({
      status: "menu",
      banner: null,
      bossName: null,
      bossHealth: null,
      bossMaxHealth: null,
    });
  }

  private publish(): void {
    const level = LEVELS[this.levelIndex];
    gameBridge.patch({
      status: this.pausedByUi ? "paused" : "playing",
      level: this.levelIndex + 1,
      wave: Math.min(this.waveIndex + 1, 5),
      totalWaves: 5,
      levelName: level.zone,
      lives: this.lives,
      maxLives: 3,
      score: this.score,
      combo: this.combo,
      weaponLevel: this.weaponLevel,
      skillCharges: this.skillCharges,
      stats: {
        defeated: this.defeated,
        escaped: this.escaped,
        maxCombo: this.maxCombo,
      },
    });
  }

  private showBanner(text: string, duration: number): void {
    this.bannerTimer?.remove(false);
    gameBridge.patch({ banner: text });
    this.bannerTimer = this.time.delayedCall(duration, () =>
      gameBridge.patch({ banner: null })
    );
  }

  private clearWorld(): void {
    this.player?.destroy();
    this.player = null;
    this.playerGroup?.clear(false, false);
    this.clearCombatObjects();
  }

  private clearCombatObjects(): void {
    this.enemies?.clear(true, true);
    this.playerBullets?.clear(true, true);
    this.enemyBullets?.clear(true, true);
    this.pickups?.clear(true, true);
  }

  private clearEnemyBullets(): void {
    for (const item of this.enemyBullets.getChildren()) {
      const bullet = item as ArcadeImage;
      if (bullet.active) this.recycleBullet(bullet);
    }
  }

  private recycleBullet(bullet: ArcadeImage): void {
    bullet.setActive(false).setVisible(false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }

  private paperBurst(x: number, y: number, count: number): void {
    const colors = [0xffcc33, 0xff5b45, 0x32d7a1, 0xf5f0df];
    for (let index = 0; index < count; index += 1) {
      const piece = this.add
        .rectangle(x, y, Phaser.Math.Between(4, 10), Phaser.Math.Between(6, 14), colors[index % colors.length])
        .setDepth(12)
        .setRotation(Math.random() * Math.PI);
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(34, count > 10 ? 125 : 75);
      this.tweens.add({
        targets: piece,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: piece.rotation + Phaser.Math.FloatBetween(-2, 2),
        alpha: 0,
        duration: Phaser.Math.Between(280, 620),
        ease: "Cubic.Out",
        onComplete: () => piece.destroy(),
      });
    }
  }

  private flash(color: number, alpha: number): void {
    const overlay = this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, color, alpha)
      .setDepth(25);
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 260,
      onComplete: () => overlay.destroy(),
    });
  }

  private addAlertWarning(x: number): void {
    const line = this.add.rectangle(x, HEIGHT / 2, 4, HEIGHT, 0xff5b45, 0.45).setDepth(2);
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 520,
      onComplete: () => line.destroy(),
    });
  }

  private createGeneratedTextures(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffcc33).fillRoundedRect(0, 0, 9, 26, 4);
    graphics.fillStyle(0xffffff, 0.85).fillRect(3, 2, 3, 10);
    graphics.generateTexture("bullet-player", 9, 26);
    graphics.clear();
    graphics.fillStyle(0xff5b45).fillCircle(7, 7, 7);
    graphics.fillStyle(0xffffff, 0.7).fillCircle(5, 5, 2);
    graphics.generateTexture("bullet-enemy", 14, 14);
    graphics.clear();
    graphics.fillStyle(0xff334f).fillCircle(11, 11, 11);
    graphics.lineStyle(3, 0xffcc33).strokeCircle(11, 11, 9);
    graphics.generateTexture("bullet-danger", 22, 22);
    graphics.destroy();
  }
}
