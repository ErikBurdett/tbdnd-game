import {
  buildFormationRenderSnapshot,
  createFormationBattle,
  spawnFormation,
} from "@ancient/battle-sim";
import Phaser from "phaser";
import { type GameSceneId, gameBridge } from "../bridge";

const WORLD_WIDTH = 1_200;
const WORLD_HEIGHT = 760;
const TARGET_VISUALS = 10_000;

export class BattleBenchmarkScene extends Phaser.Scene {
  #removeSceneListener: (() => void) | undefined;
  #lastTelemetryAt = 0;
  #visualCount = 0;
  #dragStart:
    | {
        pointerX: number;
        pointerY: number;
        scrollX: number;
        scrollY: number;
      }
    | undefined;

  constructor() {
    super("BattleBenchmark");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x20221c);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    const field = this.add.graphics();
    field.fillStyle(0x30382b, 1);
    field.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    field.lineStyle(2, 0x4b503e, 0.7);
    for (let x = 0; x <= WORLD_WIDTH; x += 100) {
      field.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
      field.lineBetween(0, y, WORLD_WIDTH, y);
    }

    const battle = createFormationBattle(8);
    const formationSpecs = [
      { team: 0, anchorX: 260, anchorY: 230 },
      { team: 0, anchorX: 260, anchorY: 500 },
      { team: 1, anchorX: 940, anchorY: 230 },
      { team: 1, anchorX: 940, anchorY: 500 },
    ];
    for (const spec of formationSpecs) {
      spawnFormation(battle, {
        ...spec,
        rows: 50,
        columns: 50,
        spacing: 4,
        strength: 2_500,
        speed: 2,
      });
    }
    const snapshot = buildFormationRenderSnapshot(battle, 1);
    this.#visualCount = snapshot.visualCount;

    const layer = this.add.spriteGPULayer("unit-pixel", TARGET_VISUALS);
    const member: Partial<Phaser.Types.GameObjects.SpriteGPULayer.Member> = {
      x: 0,
      y: 0,
      frame: 0,
      rotation: 0,
      scaleX: 0.72,
      scaleY: 0.72,
      alpha: 0.94,
      tintBlend: 1,
      tintBottomLeft: 0xffffff,
      tintTopLeft: 0xffffff,
      tintBottomRight: 0xffffff,
      tintTopRight: 0xffffff,
    };

    for (let visualIndex = 0; visualIndex < snapshot.visualCount; visualIndex += 1) {
      const offset = visualIndex * 2;
      const team = snapshot.teams[visualIndex] ?? 0;
      const tint = team === 0 ? 0xc9d8f1 : 0xe4b1a1;
      member.x = snapshot.positions[offset] ?? 0;
      member.y = snapshot.positions[offset + 1] ?? 0;
      member.tintBottomLeft = tint;
      member.tintTopLeft = tint;
      member.tintBottomRight = tint;
      member.tintTopRight = tint;
      layer.addMember(member);
    }

    this.add.image(260, 230, "officer-pixel").setTint(0xf7e5a8).setScale(1.25).setDepth(10);
    this.add.image(940, 230, "officer-pixel").setTint(0xf7e5a8).setScale(1.25).setDepth(10);

    this.add
      .text(18, 16, "MASS-BATTLE RENDER BENCHMARK", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff0bd",
        backgroundColor: "#11130fd9",
        padding: { x: 9, y: 7 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.add
      .text(
        18,
        61,
        `${snapshot.visualCount.toLocaleString()} derived soldiers · 4 authoritative formations\nWheel: zoom · drag: pan · M: strategic map`,
        {
          fontFamily: "monospace",
          fontSize: "13px",
          lineSpacing: 4,
          color: "#d9d4bf",
          backgroundColor: "#11130fcf",
          padding: { x: 9, y: 7 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);

    this.installCameraControls();
    this.input.keyboard?.on("keydown-M", () => this.scene.start("StrategicMap"));
    this.#removeSceneListener = gameBridge.on("scene-requested", (event) => {
      this.startRequestedScene(event.detail);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  override update(time: number): void {
    if (time - this.#lastTelemetryAt < 500) {
      return;
    }
    this.#lastTelemetryAt = time;
    gameBridge.publishTelemetry({
      scene: "BattleBenchmark",
      framesPerSecond: Math.round(this.game.loop.actualFps),
      visualInstances: this.#visualCount,
      note: "Static GPU-instance stress scene; measure dynamic battle phases separately.",
    });
  }

  private installCameraControls(): void {
    const camera = this.cameras.main;
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        const nextZoom = Phaser.Math.Clamp(camera.zoom - deltaY * 0.001, 0.45, 2.5);
        camera.setZoom(nextZoom);
      },
    );
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.#dragStart = {
        pointerX: pointer.x,
        pointerY: pointer.y,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.#dragStart) {
        return;
      }
      camera.scrollX =
        this.#dragStart.scrollX + (this.#dragStart.pointerX - pointer.x) / camera.zoom;
      camera.scrollY =
        this.#dragStart.scrollY + (this.#dragStart.pointerY - pointer.y) / camera.zoom;
    });
    this.input.on("pointerup", () => {
      this.#dragStart = undefined;
    });
  }

  private startRequestedScene(scene: GameSceneId): void {
    if (scene !== this.scene.key) {
      this.scene.start(scene);
    }
  }

  private cleanup(): void {
    this.#removeSceneListener?.();
    this.#removeSceneListener = undefined;
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
  }
}
