import {
  EARTH_MAP,
  earthLodForZoom,
  getEarthProvince,
  getEarthProvinceAtWorld,
  listEarthDrawBatches,
  pickEarthLabels,
} from "@ancient/sim-core";
import Phaser from "phaser";
import {
  clampZoom,
  focusZoom,
  lerp,
  panOffset,
  START_ZOOM,
  zoomAfterStep,
  zoomAfterWheel,
} from "../../map/cameraNav";
import type { MapPick } from "../../map/selection";
import type { StrategicMapView } from "../../map/view";
import { type GameSceneId, gameBridge, type MapFocusRequest } from "../bridge";

interface ArmyMarker {
  id: string;
  token: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

const UNKNOWN_FILL = 0x2a2c28;
const IDLE_STROKE = 0xd4c18f;
const SELECTED_STROKE = 0xf5df9a;
const LEGAL_STROKE = 0xe4c56a;
const QUEUED_STROKE = 0x8ec8e4;
const ARMY_FILL = 0xf3de9a;
const ENEMY_ARMY_FILL = 0xe4b1a1;
const DRAG_THRESHOLD = 5;
const FOCUS_LERP = 0.18;

const FACTION_FILL = new Map(EARTH_MAP.factions.map((faction) => [faction.id, faction.color]));

export class StrategicMapScene extends Phaser.Scene {
  #removeSceneListener: (() => void) | undefined;
  #removeViewListener: (() => void) | undefined;
  #land: Phaser.GameObjects.Graphics | undefined;
  #overlay: Phaser.GameObjects.Graphics | undefined;
  #labels = new Map<string, Phaser.GameObjects.Text>();
  #armyMarkers = new Map<string, ArmyMarker>();
  #hint: Phaser.GameObjects.Text | undefined;
  #lodHint: Phaser.GameObjects.Text | undefined;
  #dragStart: { x: number; y: number } | undefined;
  #didDrag = false;
  #ignoreMapPick = false;
  #view: StrategicMapView | undefined;
  #lastCameraKey = "";
  #focusTarget: MapFocusRequest | undefined;
  #framedHome = false;
  #removeFocusListener: (() => void) | undefined;
  #keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;

  constructor() {
    super("StrategicMap");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x171a17);
    this.cameras.main.setBounds(-80, -80, EARTH_MAP.mapWidth + 160, EARTH_MAP.mapHeight + 160);
    this.cameras.main.setZoom(START_ZOOM);
    this.input.setDefaultCursor("grab");
    this.game.canvas.addEventListener("wheel", preventWheelScroll, { passive: false });

    this.add
      .text(24, 18, "STRATEGIC MAP", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#f1e3b7",
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.#hint = this.add
      .text(
        24,
        48,
        "Drag to pan. Wheel zooms toward the cursor. WASD or arrows pan. +/− zoom. H recenters on your capital.",
        {
          fontFamily: "system-ui",
          fontSize: "14px",
          color: "#b9b6a7",
          wordWrap: { width: 560 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);
    this.#lodHint = this.add
      .text(24, 88, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#8f8b7a",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.#land = this.add.graphics().setDepth(1);
    this.#overlay = this.add.graphics().setDepth(2);
    this.drawLand(undefined);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.#dragStart = { x: pointer.x, y: pointer.y };
      this.#didDrag = false;
      this.#focusTarget = undefined;
      this.input.setDefaultCursor("grabbing");
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.#dragStart) {
        return;
      }
      const dx = pointer.x - this.#dragStart.x;
      const dy = pointer.y - this.#dragStart.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        this.#didDrag = true;
      }
      if (this.#didDrag) {
        const camera = this.cameras.main;
        camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
        camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const dragged = this.#didDrag;
      const ignore = this.#ignoreMapPick;
      this.#dragStart = undefined;
      this.#didDrag = false;
      this.#ignoreMapPick = false;
      this.input.setDefaultCursor("grab");
      if (dragged || ignore || pointer.button === 1) {
        return;
      }
      if (isDoubleClick(pointer)) {
        this.zoomAtScreen(pointer.x, pointer.y, 1);
      }
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const province = getEarthProvinceAtWorld(world.x, world.y);
      if (province) {
        this.publishPick({
          kind: "province",
          id: province.id,
          button: pointerButton(pointer),
        });
        return;
      }
      if (pointer.leftButtonReleased() || pointer.button === 0) {
        this.publishPick({ kind: "background" });
      }
    });
    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _objects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        this.#focusTarget = undefined;
        this.zoomAtScreen(pointer.x, pointer.y, 0, deltaY);
      },
    );

    this.#keys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key> | undefined;
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.onKeyDown(event));
    this.input.keyboard?.on("keydown-B", () => this.scene.start("BattleBenchmark"));
    this.#removeSceneListener = gameBridge.on("scene-requested", (event) => {
      this.startRequestedScene(event.detail);
    });
    this.#removeViewListener = gameBridge.on("map-view", (event) => {
      this.applyView(event.detail);
    });
    this.#removeFocusListener = gameBridge.on("map-focus", (event) => {
      this.focusOn(event.detail);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    const initialView = gameBridge.getMapView();
    if (initialView) {
      this.applyView(initialView);
    }
  }

  override update(_time: number, delta: number): void {
    this.applyHeldPan(delta);
    this.stepFocus();
    const camera = this.cameras.main;
    const key = `${camera.scrollX.toFixed(1)}:${camera.scrollY.toFixed(1)}:${camera.zoom.toFixed(3)}`;
    if (key === this.#lastCameraKey) {
      return;
    }
    this.#lastCameraKey = key;
    this.drawLand(this.#view);
    if (this.#view) {
      this.syncLabels(this.#view);
      this.syncArmies(this.#view);
    }
    this.syncLodHint();
  }

  private publishPick(pick: MapPick): void {
    gameBridge.publishMapPick(pick);
  }

  private drawLand(view: StrategicMapView | undefined): void {
    if (!this.#land) {
      return;
    }
    const camera = this.cameras.main;
    const bounds = camera.worldView;
    const lod = earthLodForZoom(camera.zoom);
    const batches = listEarthDrawBatches(
      { x: bounds.x, y: bounds.y, right: bounds.right, bottom: bounds.bottom },
      camera.zoom,
      view?.provinceOwners ?? {},
    );
    this.#land.clear();
    for (const batch of batches) {
      const fill = FACTION_FILL.get(batch.ownerId) ?? UNKNOWN_FILL;
      this.#land.fillStyle(fill, 1);
      this.#land.fillRect(batch.x, batch.y, batch.w, batch.h);
      if (!batch.stroke) {
        continue;
      }
      const alpha = lod === "near" ? 0.55 : lod === "mid" ? 0.32 : 0.2;
      const width = lod === "near" ? 1.4 : 1;
      this.#land.lineStyle(width, IDLE_STROKE, alpha);
      this.#land.strokeRect(batch.x, batch.y, batch.w, batch.h);
    }
  }

  private applyView(view: StrategicMapView): void {
    this.#view = view;
    this.drawLand(view);
    if (this.#overlay) {
      this.#overlay.clear();
      for (const provinceId of view.legalDestinationIds) {
        const province = getEarthProvince(provinceId);
        if (!province) {
          continue;
        }
        this.#overlay.lineStyle(3, LEGAL_STROKE, 1);
        this.#overlay.strokeRect(province.x + 1, province.y + 1, province.w - 2, province.h - 2);
      }
      for (const provinceId of view.queuedDestinationIds) {
        const province = getEarthProvince(provinceId);
        if (!province) {
          continue;
        }
        this.#overlay.lineStyle(3, QUEUED_STROKE, 1);
        this.#overlay.strokeRect(province.x + 2, province.y + 2, province.w - 4, province.h - 4);
      }
      if (view.selection.kind === "province") {
        const selected = getEarthProvince(view.selection.id);
        if (selected) {
          this.#overlay.lineStyle(4, SELECTED_STROKE, 1);
          this.#overlay.strokeRect(selected.x, selected.y, selected.w, selected.h);
        }
      }
    }

    this.syncLabels(view);
    this.syncArmies(view);
    this.syncLodHint();
    if (this.#hint) {
      this.#hint.setText(hintForView(view));
    }
    if (!this.#framedHome) {
      this.#framedHome = true;
      const home = homePointForFaction(view.playerFactionId);
      if (home) {
        this.cameras.main.setZoom(START_ZOOM);
        this.cameras.main.centerOn(home.x, home.y);
      }
    }
  }

  private syncLabels(view: StrategicMapView): void {
    const camera = this.cameras.main;
    const bounds = camera.worldView;
    const picks = pickEarthLabels(
      { x: bounds.x, y: bounds.y, right: bounds.right, bottom: bounds.bottom },
      camera.zoom,
      {
        ...(view.selection.kind === "province" ? { selectedId: view.selection.id } : {}),
        legalIds: view.legalDestinationIds,
        armyProvinceIds: view.armies.map((army) => army.provinceId),
        owners: view.provinceOwners,
      },
    );
    const wanted = new Set(picks.map((pick) => pick.id));
    const screenScale = 1 / Math.max(camera.zoom, 0.12);

    for (const pick of picks) {
      let label = this.#labels.get(pick.id);
      if (!label) {
        label = this.add
          .text(pick.x, pick.y, pick.name, {
            fontFamily: "monospace",
            fontSize: `${pick.fontSize}px`,
            color: "#fff6d8",
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(8);
        this.#labels.set(pick.id, label);
      }
      label.setText(pick.name);
      label.setPosition(pick.x, pick.y);
      label.setFontSize(pick.fontSize);
      label.setScale(screenScale);
      label.setVisible(true);
    }

    for (const [provinceId, label] of this.#labels) {
      if (!wanted.has(provinceId)) {
        label.destroy();
        this.#labels.delete(provinceId);
      }
    }
  }

  private syncArmies(view: StrategicMapView): void {
    const occupancy = new Map<string, number>();
    const seen = new Set<string>();
    for (const army of view.armies) {
      seen.add(army.id);
      const geometry = getEarthProvince(army.provinceId);
      if (!geometry) {
        continue;
      }
      const stack = occupancy.get(army.provinceId) ?? 0;
      occupancy.set(army.provinceId, stack + 1);
      const x = geometry.labelX - 18 + stack * 16;
      const y = geometry.labelY + 18;
      const selected = view.selection.kind === "army" && view.selection.id === army.id;
      let marker = this.#armyMarkers.get(army.id);
      if (!marker) {
        const token = this.add.circle(x, y, 8, ARMY_FILL).setDepth(20);
        token.setInteractive({ useHandCursor: true });
        token.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          this.#ignoreMapPick = true;
          this.publishPick({
            kind: "army",
            id: army.id,
            button: pointerButton(pointer),
          });
        });
        const label = this.add
          .text(x + 12, y, "", {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#f4e9c6",
          })
          .setOrigin(0, 0.5)
          .setDepth(21);
        marker = { id: army.id, token, label };
        this.#armyMarkers.set(army.id, marker);
      }
      marker.token.setPosition(x, y);
      marker.token.setFillStyle(
        army.ownerId === view.playerFactionId ? ARMY_FILL : ENEMY_ARMY_FILL,
      );
      marker.token.setStrokeStyle(selected ? 4 : 2, selected ? SELECTED_STROKE : 0x1b1b18);
      marker.token.setScale(selected ? 1.15 : 1);
      marker.label.setPosition(x + 12, y);
      const showArmyLabel = selected || earthLodForZoom(this.cameras.main.zoom) === "near";
      marker.label.setVisible(showArmyLabel);
      marker.label.setScale(1 / Math.max(this.cameras.main.zoom, 0.12));
      marker.label.setText(`${army.name} · ${army.strength.toLocaleString()}`);
    }

    for (const [armyId, marker] of this.#armyMarkers) {
      if (!seen.has(armyId)) {
        marker.token.destroy();
        marker.label.destroy();
        this.#armyMarkers.delete(armyId);
      }
    }
  }

  private syncLodHint(): void {
    if (!this.#lodHint) {
      return;
    }
    const lod = earthLodForZoom(this.cameras.main.zoom);
    const label =
      lod === "far" ? "Far · peoples" : lod === "mid" ? "Mid · regions" : "Near · territories";
    this.#lodHint.setText(`${label} · ${EARTH_MAP.provinces.length} provinces · 84 BCE`);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (typingInForm()) {
      return;
    }
    if (event.key === "h" || event.key === "H" || event.key === "Home") {
      this.recenterHome();
      return;
    }
    if (event.key === "+" || event.key === "=") {
      this.zoomAtScreen(this.scale.width / 2, this.scale.height / 2, 1);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      this.zoomAtScreen(this.scale.width / 2, this.scale.height / 2, -1);
    }
  }

  private applyHeldPan(delta: number): void {
    if (typingInForm() || !this.#keys) {
      return;
    }
    const offset = panOffset(
      {
        left: Boolean(this.#keys.left?.isDown || this.#keys.A?.isDown),
        right: Boolean(this.#keys.right?.isDown || this.#keys.D?.isDown),
        up: Boolean(this.#keys.up?.isDown || this.#keys.W?.isDown),
        down: Boolean(this.#keys.down?.isDown || this.#keys.S?.isDown),
      },
      delta,
      this.cameras.main.zoom,
    );
    if (offset.x === 0 && offset.y === 0) {
      return;
    }
    this.#focusTarget = undefined;
    this.cameras.main.scrollX += offset.x;
    this.cameras.main.scrollY += offset.y;
  }

  private stepFocus(): void {
    const target = this.#focusTarget;
    if (!target) {
      return;
    }
    const camera = this.cameras.main;
    const nextZoom = lerp(camera.zoom, target.zoom ?? camera.zoom, FOCUS_LERP);
    camera.setZoom(clampZoom(nextZoom));
    const current = camera.midPoint;
    const nextX = lerp(current.x, target.x, FOCUS_LERP);
    const nextY = lerp(current.y, target.y, FOCUS_LERP);
    camera.centerOn(nextX, nextY);
    if (
      Math.hypot(target.x - nextX, target.y - nextY) < 2 &&
      Math.abs((target.zoom ?? nextZoom) - nextZoom) < 0.01
    ) {
      camera.centerOn(target.x, target.y);
      if (target.zoom !== undefined) {
        camera.setZoom(clampZoom(target.zoom));
      }
      this.#focusTarget = undefined;
    }
  }

  private focusOn(target: MapFocusRequest): void {
    this.#focusTarget = {
      x: target.x,
      y: target.y,
      zoom: target.zoom ?? focusZoom(this.cameras.main.zoom),
    };
  }

  private recenterHome(): void {
    const home = homePointForFaction(this.#view?.playerFactionId ?? "");
    if (!home) {
      return;
    }
    this.focusOn({ x: home.x, y: home.y, zoom: START_ZOOM });
  }

  private zoomAtScreen(screenX: number, screenY: number, step: 1 | -1 | 0, wheelDelta = 0): void {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(screenX, screenY);
    const next =
      step === 0 ? zoomAfterWheel(camera.zoom, wheelDelta) : zoomAfterStep(camera.zoom, step);
    camera.setZoom(next);
    const after = camera.getWorldPoint(screenX, screenY);
    camera.scrollX += before.x - after.x;
    camera.scrollY += before.y - after.y;
  }

  private startRequestedScene(scene: GameSceneId): void {
    if (scene !== this.scene.key) {
      this.scene.start(scene);
    }
  }

  private cleanup(): void {
    this.#removeSceneListener?.();
    this.#removeViewListener?.();
    this.#removeFocusListener?.();
    this.#removeSceneListener = undefined;
    this.#removeViewListener = undefined;
    this.#removeFocusListener = undefined;
    this.game.canvas.removeEventListener("wheel", preventWheelScroll);
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
    this.#labels.clear();
    this.#armyMarkers.clear();
  }
}

function pointerButton(pointer: Phaser.Input.Pointer): 0 | 2 {
  return pointer.rightButtonDown() || pointer.button === 2 ? 2 : 0;
}

function hintForView(view: StrategicMapView): string {
  if (view.selection.kind === "army" && view.legalDestinationIds.length > 0) {
    return "Highlighted provinces are legal marches. Click one to queue the order, then commit the turn.";
  }
  if (view.selection.kind === "army") {
    return "This army has no legal march. Commit the turn to resolve queued orders, or select a province.";
  }
  return "Drag to pan. Wheel zooms toward the cursor. WASD pans. H recenters. Queue a march, then commit the turn.";
}

function homePointForFaction(factionId: string): { x: number; y: number } | undefined {
  const capitalId = EARTH_MAP.factions.find((faction) => faction.id === factionId)?.capitalId;
  const capital = capitalId ? getEarthProvince(capitalId) : undefined;
  if (capital) {
    return { x: capital.labelX, y: capital.labelY };
  }
  const latium = getEarthProvince("province.latium");
  return latium ? { x: latium.labelX, y: latium.labelY } : undefined;
}

function typingInForm(): boolean {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable;
}

function isDoubleClick(pointer: Phaser.Input.Pointer): boolean {
  return pointer.event instanceof MouseEvent && pointer.event.detail >= 2;
}

function preventWheelScroll(event: WheelEvent): void {
  event.preventDefault();
}
