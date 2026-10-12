import Phaser from "phaser";
import { GameScene } from "@/game/GameScene";

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#11130f",
    pixelArt: false,
    antialias: true,
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      transparent: false,
      powerPreference: "high-performance",
    },
    scene: [GameScene],
  });
}
