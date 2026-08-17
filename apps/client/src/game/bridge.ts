import type { MapPick, MapSelection } from "../map/selection";
import type { StrategicMapView } from "../map/view";

export type GameSceneId = "StrategicMap" | "BattleBenchmark";

export interface RendererTelemetry {
  scene: GameSceneId;
  framesPerSecond: number;
  visualInstances: number;
  note: string;
}

export interface MapFocusRequest {
  x: number;
  y: number;
  zoom?: number;
}

interface GameBridgeEventMap {
  "scene-requested": CustomEvent<GameSceneId>;
  "map-pick": CustomEvent<MapPick>;
  "map-view": CustomEvent<StrategicMapView>;
  "map-focus": CustomEvent<MapFocusRequest>;
  "renderer-telemetry": CustomEvent<RendererTelemetry>;
}

type GameBridgeEventName = keyof GameBridgeEventMap;

class GameBridge extends EventTarget {
  #mapView: StrategicMapView | undefined;

  requestScene(scene: GameSceneId): void {
    this.dispatchEvent(new CustomEvent("scene-requested", { detail: scene }));
  }

  publishMapPick(pick: MapPick): void {
    this.dispatchEvent(new CustomEvent("map-pick", { detail: pick }));
  }

  publishMapView(view: StrategicMapView): void {
    this.#mapView = view;
    this.dispatchEvent(new CustomEvent("map-view", { detail: view }));
  }

  getMapView(): StrategicMapView | undefined {
    return this.#mapView;
  }

  requestMapFocus(target: MapFocusRequest): void {
    this.dispatchEvent(new CustomEvent("map-focus", { detail: target }));
  }

  publishTelemetry(telemetry: RendererTelemetry): void {
    this.dispatchEvent(new CustomEvent("renderer-telemetry", { detail: telemetry }));
  }

  on<TKey extends GameBridgeEventName>(
    type: TKey,
    listener: (event: GameBridgeEventMap[TKey]) => void,
  ): () => void {
    const eventListener = listener as EventListener;
    this.addEventListener(type, eventListener);
    return () => this.removeEventListener(type, eventListener);
  }
}

export const gameBridge = new GameBridge();

export type { MapPick, MapSelection, StrategicMapView };
