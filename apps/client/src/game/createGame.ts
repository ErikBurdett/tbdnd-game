import Phaser from "phaser";
import { BattleBenchmarkScene } from "./scenes/BattleBenchmarkScene";
import { BootScene } from "./scenes/BootScene";
import { StrategicMapScene } from "./scenes/StrategicMapScene";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    backgroundColor: "#171a17",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    render: {
      powerPreference: "high-performance",
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    input: {
      keyboard: {
        target: window,
      },
    },
    scene: [BootScene, StrategicMapScene, BattleBenchmarkScene],
  });
}
