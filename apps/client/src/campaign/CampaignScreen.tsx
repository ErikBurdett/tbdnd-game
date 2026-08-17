import {
  EARTH_MAP,
  getEarthProvince,
  type WorldEvent,
  type WorldReadModel,
} from "@ancient/sim-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { CampaignPanel } from "../components/CampaignPanel";
import { PhaserCanvas } from "../components/PhaserCanvas";
import { gameBridge, type RendererTelemetry } from "../game/bridge";
import {
  createId,
  isPersistentSession,
  type LoadCampaignSession,
  type NewCampaignSession,
  navigate,
  readCampaignSession,
  sessionPlayerFactionId,
  writeActiveProfileId,
  writeCampaignSession,
} from "../launcher/session";
import { START_ZOOM } from "../map/cameraNav";
import { type MapSelection, resolveMapPick } from "../map/selection";
import { buildStrategicMapView } from "../map/view";
import {
  recordCampaignStarted,
  recordWorldEvents,
  saveFromSnapshot,
  upsertProfile,
  writeSave,
} from "../persistence/launcherRepository";
import { useWorldSimulation } from "../simulation/useWorldSimulation";
import { GameMenu } from "./GameMenu";

export function CampaignScreen(): React.JSX.Element {
  const [session, setSession] = useState(readCampaignSession);
  const simulation = useWorldSimulation(session);
  const playerFactionId = session ? sessionPlayerFactionId(session) : "";
  const [selection, setSelection] = useState<MapSelection>({ kind: "none" });
  const [telemetry, setTelemetry] = useState<RendererTelemetry>();
  const [menuOpen, setMenuOpen] = useState(false);
  const startedRef = useRef(false);
  const demoEventsRef = useRef<WorldEvent[]>([]);
  const createdAtRef = useRef(
    session?.kind === "load" ? session.createdAt : new Date().toISOString(),
  );
  const theaterSecured = simulation.readModel?.theaterSecured ?? false;
  const playerTreasury = simulation.readModel?.factions.find(
    (faction) => faction.id === playerFactionId,
  )?.treasury;

  useEffect(() => {
    if (!session) {
      navigate("/");
    }
  }, [session]);

  useEffect(() => {
    if (!simulation.readModel) {
      return;
    }
    gameBridge.publishMapView(
      buildStrategicMapView(simulation.readModel, selection, playerFactionId),
    );
  }, [playerFactionId, selection, simulation.readModel]);

  const armies = simulation.readModel?.armies;
  const submit = simulation.submit;

  useEffect(() => {
    const removePickListener = gameBridge.on("map-pick", (event) => {
      const result = resolveMapPick(selection, event.detail, playerFactionId, armies ?? []);
      setSelection(result.selection);
      if (result.command) {
        submit(playerFactionId, result.command);
      }
    });
    const removeTelemetryListener = gameBridge.on("renderer-telemetry", (event) => {
      setTelemetry(event.detail);
    });
    return () => {
      removePickListener();
      removeTelemetryListener();
    };
  }, [armies, playerFactionId, selection, submit]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setMenuOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const persistSession = useCallback(
    async (next: NewCampaignSession | LoadCampaignSession): Promise<void> => {
      if (!simulation.readModel || !simulation.serializedWorld) {
        return;
      }
      await writeSave(
        saveFromSnapshot({
          id: next.saveId,
          profileId: next.profileId,
          name: next.name,
          seed: next.seed,
          createdAt: createdAtRef.current,
          readModel: simulation.readModel,
          serializedWorld: simulation.serializedWorld,
          playerFactionId: next.playerFactionId,
        }),
      );
    },
    [simulation.readModel, simulation.serializedWorld],
  );

  useEffect(() => {
    if (
      !session ||
      !isPersistentSession(session) ||
      !simulation.readModel ||
      !simulation.serializedWorld
    ) {
      return;
    }
    void persistSession(session);
  }, [persistSession, session, simulation.readModel, simulation.serializedWorld]);

  useEffect(() => {
    if (session?.kind !== "new" || !simulation.readModel || startedRef.current) {
      return;
    }
    startedRef.current = true;
    void recordCampaignStarted(session.profileId);
  }, [session, simulation.readModel]);

  useEffect(() => {
    if (!session || simulation.lastEvents.length === 0) {
      return;
    }
    if (session.kind === "demo") {
      demoEventsRef.current = demoEventsRef.current.concat(simulation.lastEvents);
      return;
    }
    void recordWorldEvents(session.profileId, simulation.lastEvents);
  }, [session, simulation.lastEvents]);

  const moveArmy = useCallback(
    (armyId: string, destinationProvinceId: string): void => {
      simulation.submit(playerFactionId, {
        type: "army.move",
        armyId,
        destinationProvinceId,
      });
    },
    [playerFactionId, simulation],
  );

  const endTurn = useCallback((): void => {
    simulation.submit(playerFactionId, { type: "strategic.end-turn" });
  }, [playerFactionId, simulation]);

  const recruitArmy = useCallback(
    (provinceId: string): void => {
      simulation.submit(playerFactionId, { type: "army.recruit", provinceId });
    },
    [playerFactionId, simulation],
  );

  const selectResearch = useCallback(
    (researchId: string): void => {
      simulation.submit(playerFactionId, { type: "research.select", researchId });
    },
    [playerFactionId, simulation],
  );

  const queueBuilding = useCallback(
    (settlementId: string, buildingId: string): void => {
      simulation.submit(playerFactionId, {
        type: "settlement.queue-building",
        settlementId,
        buildingId,
      });
    },
    [playerFactionId, simulation],
  );

  const selectFromPanel = useCallback(
    (next: MapSelection): void => {
      setSelection(next);
      focusMapOnSelection(next, simulation.readModel);
    },
    [simulation.readModel],
  );

  const recenterMap = useCallback((): void => {
    focusMapOnHome(playerFactionId);
  }, [playerFactionId]);

  const cancelOrder = useCallback(
    (armyId: string): void => {
      simulation.submit(playerFactionId, { type: "order.cancel", armyId });
    },
    [playerFactionId, simulation],
  );

  const keepDemo = async (commanderName: string, campaignTitle: string): Promise<void> => {
    if (!session || !simulation.readModel || !simulation.serializedWorld) {
      return;
    }
    const profile = await upsertProfile({
      id: createId("profile"),
      name: commanderName,
      motto: "",
    });
    const next: LoadCampaignSession = {
      kind: "load",
      saveId: session.saveId,
      profileId: profile.id,
      name: campaignTitle,
      seed: session.seed,
      serializedWorld: simulation.serializedWorld,
      createdAt: createdAtRef.current,
      playerFactionId,
    };
    await writeSave(
      saveFromSnapshot({
        id: next.saveId,
        profileId: next.profileId,
        name: next.name,
        seed: next.seed,
        createdAt: createdAtRef.current,
        readModel: simulation.readModel,
        serializedWorld: simulation.serializedWorld,
        playerFactionId,
      }),
    );
    await recordCampaignStarted(profile.id);
    if (demoEventsRef.current.length > 0) {
      await recordWorldEvents(profile.id, demoEventsRef.current);
      demoEventsRef.current = [];
    }
    writeActiveProfileId(profile.id);
    writeCampaignSession(next);
    setSession(next);
  };

  const quickSave = async (): Promise<void> => {
    if (!session || !isPersistentSession(session)) {
      return;
    }
    await persistSession(session);
  };

  if (!session) {
    return (
      <main className="app-shell">
        <p className="hall-lead" style={{ padding: "2rem" }}>
          No campaign is staged. Returning to the hall.
        </p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Imperium Arcana</p>
          <h1>{session.name}</h1>
        </div>
        <div className="turn-readout" aria-live="polite">
          <span data-testid="turn-readout">Turn {simulation.readModel?.turn ?? "—"}</span>
          <span data-testid="treasury-readout">
            Treasury {playerTreasury?.toLocaleString() ?? "—"}
          </span>
          <code>{simulation.readModel?.stateHash ?? "initializing"}</code>
          {session.kind === "demo" ? (
            <p className="demo-pill" data-testid="demo-pill">
              Demo — Esc to save
            </p>
          ) : null}
          {theaterSecured ? (
            <p className="victory-pill" data-testid="campaign-victory">
              Theater secured
            </p>
          ) : null}
          <button
            type="button"
            className="ghost-button"
            data-testid="open-menu"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="map-column">
          <PhaserCanvas />
          <div className="map-legend">
            <p>
              Drag or WASD to pan · Wheel or +/− to zoom · H or Recenter for your capital · Esc:
              menu
            </p>
            <button
              type="button"
              className="ghost-button"
              onClick={() => gameBridge.requestScene("BattleBenchmark")}
            >
              10K benchmark
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => gameBridge.requestScene("StrategicMap")}
            >
              Map
            </button>
          </div>
        </div>

        <CampaignPanel
          readModel={simulation.readModel}
          selection={selection}
          playerFactionId={playerFactionId}
          isReady={simulation.isReady}
          error={simulation.error}
          lastEvents={simulation.lastEvents}
          onSelect={selectFromPanel}
          onMoveArmy={moveArmy}
          onRecruitArmy={recruitArmy}
          onQueueBuilding={queueBuilding}
          onSelectResearch={selectResearch}
          onCancelOrder={cancelOrder}
          onEndTurn={endTurn}
          onRecenter={recenterMap}
        />
      </section>

      {telemetry ? (
        <p className="telemetry-bar">
          {telemetry.framesPerSecond} FPS · {telemetry.visualInstances.toLocaleString()} visuals
        </p>
      ) : null}

      {menuOpen ? (
        <GameMenu
          isDemo={session.kind === "demo"}
          campaignName={session.name}
          canSave={Boolean(simulation.readModel && simulation.serializedWorld)}
          onResume={() => setMenuOpen(false)}
          onReturnToHall={() => navigate("/")}
          onKeepCampaign={keepDemo}
          onQuickSave={quickSave}
        />
      ) : null}
    </main>
  );
}

function focusMapOnSelection(selection: MapSelection, readModel: WorldReadModel | undefined): void {
  if (selection.kind === "none") {
    return;
  }
  const provinceId =
    selection.kind === "province"
      ? selection.id
      : readModel?.armies.find((army) => army.id === selection.id)?.provinceId;
  const geometry = provinceId ? getEarthProvince(provinceId) : undefined;
  if (!geometry) {
    return;
  }
  gameBridge.requestMapFocus({ x: geometry.labelX, y: geometry.labelY });
}

function focusMapOnHome(playerFactionId: string): void {
  const capitalId = EARTH_MAP.factions.find((faction) => faction.id === playerFactionId)?.capitalId;
  const geometry = capitalId ? getEarthProvince(capitalId) : undefined;
  if (!geometry) {
    return;
  }
  gameBridge.requestMapFocus({ x: geometry.labelX, y: geometry.labelY, zoom: START_ZOOM });
}
