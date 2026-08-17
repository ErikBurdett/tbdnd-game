import {
  EARTH_MAP,
  getBuildingSpec,
  getResearchSpec,
  type WorldEvent,
  type WorldReadModel,
} from "@ancient/sim-core";
import type { MapSelection } from "../map/selection";

interface CampaignPanelProps {
  readModel: WorldReadModel | undefined;
  selection: MapSelection;
  playerFactionId: string;
  isReady: boolean;
  error: string | undefined;
  lastEvents: WorldEvent[];
  onSelect: (selection: MapSelection) => void;
  onMoveArmy: (armyId: string, destinationProvinceId: string) => void;
  onRecruitArmy: (provinceId: string) => void;
  onQueueBuilding: (settlementId: string, buildingId: string) => void;
  onCancelOrder: (armyId: string) => void;
  onEndTurn: () => void;
  onRecenter: () => void;
  onSelectResearch: (researchId: string) => void;
}

export function CampaignPanel({
  readModel,
  selection,
  playerFactionId,
  isReady,
  error,
  lastEvents,
  onSelect,
  onMoveArmy,
  onRecruitArmy,
  onQueueBuilding,
  onCancelOrder,
  onEndTurn,
  onRecenter,
  onSelectResearch,
}: CampaignPanelProps): React.JSX.Element {
  const selectedArmy =
    selection.kind === "army"
      ? readModel?.armies.find((army) => army.id === selection.id)
      : undefined;
  const selectedProvinceId =
    selection.kind === "province" ? selection.id : (selectedArmy?.provinceId ?? undefined);
  const selectedProvince = readModel?.provinces.find(
    (province) => province.id === selectedProvinceId,
  );
  const ownerName = readModel?.factions.find(
    (faction) => faction.id === selectedProvince?.ownerId,
  )?.name;
  const legalDestinations =
    selectedArmy?.ownerId === playerFactionId ? (selectedArmy?.legalDestinationIds ?? []) : [];
  const canRecruit =
    selectedProvince !== undefined &&
    (readModel?.recruitableProvinceIds.includes(selectedProvince.id) ?? false);
  const selectedSettlement = readModel?.settlements.find(
    (settlement) => settlement.provinceId === selectedProvinceId,
  );

  const queuedCount = readModel?.queuedOrders.length ?? 0;

  return (
    <aside className="control-panel">
      <section className="turn-section">
        <h2>Turn {readModel?.turn ?? "—"}</h2>
        <p className="muted">
          {queuedCount === 0
            ? "No marches queued. Commit to resolve AI, harvest, and upkeep."
            : `${queuedCount} march${queuedCount === 1 ? "" : "es"} will resolve on commit.`}
        </p>
        <div className="button-row turn-actions">
          <button
            type="button"
            className="commit-turn"
            data-testid="end-turn"
            onClick={onEndTurn}
            disabled={!isReady}
          >
            Commit turn
          </button>
          <button type="button" data-testid="recenter-map" onClick={onRecenter}>
            Recenter
          </button>
        </div>
      </section>

      <section>
        <h2>Selection</h2>
        <p className="primary-value" data-testid="selection-title">
          {selectionTitle(selection, readModel)}
        </p>
        <p className="muted">
          {selection.kind === "none"
            ? "Click a province or army on the map."
            : "Click empty ground to clear. Esc opens the campaign menu."}
        </p>
        {selectedArmy ? (
          <dl className="stat-grid">
            <div>
              <dt>Strength</dt>
              <dd>{selectedArmy.strength.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Move points</dt>
              <dd>{selectedArmy.movementPoints}</dd>
            </div>
          </dl>
        ) : null}
        {selectedProvince?.visible ? (
          <p>
            {selectedProvince.name}: food {selectedProvince.food} · unrest {selectedProvince.unrest}
            {ownerName ? ` · ${ownerName}` : ""}
          </p>
        ) : null}
        {selectedProvince && !selectedProvince.visible ? (
          <p className="muted">Beyond the last scouted ridge. March closer to reveal it.</p>
        ) : null}
        {canRecruit && selectedProvince ? (
          <button
            type="button"
            data-testid="recruit-levy"
            onClick={() => onRecruitArmy(selectedProvince.id)}
          >
            Raise levy ({readModel?.levyCost ?? 80} gold, {readModel?.levyStrength ?? 600} strength)
          </button>
        ) : null}
        {selectedSettlement?.visible ? (
          <p data-testid="settlement-title">
            {selectedSettlement.name} settlement
            {selectedSettlement.completedBuildingIds.length > 0
              ? ` · ${selectedSettlement.completedBuildingIds
                  .map((buildingId) => getBuildingSpec(buildingId)?.label ?? buildingId)
                  .join(", ")}`
              : ""}
            {selectedSettlement.buildQueue
              ? ` · building ${getBuildingSpec(selectedSettlement.buildQueue.buildingId)?.label ?? selectedSettlement.buildQueue.buildingId} (${selectedSettlement.buildQueue.remainingTurns} turns)`
              : ""}
          </p>
        ) : null}
        {selectedSettlement?.queueableBuildingIds.map((buildingId) => {
          const spec = getBuildingSpec(buildingId);
          if (!spec) {
            return null;
          }
          return (
            <button
              key={spec.id}
              type="button"
              data-testid={`build-${spec.id}`}
              onClick={() => onQueueBuilding(selectedSettlement.id, spec.id)}
            >
              Build {spec.label} ({spec.cost} gold, {spec.turns} turns)
            </button>
          );
        })}
        {selectedArmy?.queuedDestinationId ? (
          <p className="muted" data-testid="queued-order">
            Ordered: march to {provinceName(readModel, selectedArmy.queuedDestinationId)} on commit
          </p>
        ) : null}
        {selectedArmy?.queuedDestinationId ? (
          <button
            type="button"
            data-testid="cancel-order"
            onClick={() => onCancelOrder(selectedArmy.id)}
          >
            Cancel order
          </button>
        ) : null}
        {selectedArmy && legalDestinations.length > 0 ? (
          <p className="muted" data-testid="order-preview">
            {orderPreviewSummary(selectedArmy, readModel)}
          </p>
        ) : null}
        {error ? <p className="error-message">{error}</p> : null}
      </section>

      <section>
        <h2>Research</h2>
        <p className="muted" data-testid="research-status">
          {readModel?.research.queue
            ? `Studying ${getResearchSpec(readModel.research.queue.researchId)?.label ?? readModel.research.queue.researchId} (${readModel.research.queue.remainingTurns} turns)`
            : readModel?.research.completedIds.length
              ? `Known: ${readModel.research.completedIds
                  .map((researchId) => getResearchSpec(researchId)?.label ?? researchId)
                  .join(", ")}`
              : "No doctrines recorded."}
        </p>
        {readModel?.research.selectable.map((node) => (
          <button
            key={node.id}
            type="button"
            data-testid={`research-${node.id}`}
            onClick={() => onSelectResearch(node.id)}
          >
            Study {node.label} ({node.cost} gold, {node.turns} turns)
          </button>
        ))}
      </section>

      <section>
        <h2>Armies</h2>
        <ul className="select-list">
          {(readModel?.armies ?? []).map((army) => (
            <li key={army.id}>
              <button
                type="button"
                className={
                  selection.kind === "army" && selection.id === army.id ? "is-selected" : undefined
                }
                data-testid={`army-${army.id}`}
                onClick={() => onSelect({ kind: "army", id: army.id })}
              >
                {army.name}
                <small>
                  {provinceName(readModel, army.provinceId)}
                  {army.queuedDestinationId
                    ? ` → ${provinceName(readModel, army.queuedDestinationId)}`
                    : ""}{" "}
                  · {army.strength.toLocaleString()} · {army.movementPoints} MP
                </small>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Peoples</h2>
        <p className="muted">
          Attested states first, then tribal belts, then cultural regions. Armies stay hidden until
          scouted.
        </p>
        <ul className="select-list" data-testid="faction-list">
          {peoplesForPanel(readModel, playerFactionId).map((faction) => (
            <li key={faction.id}>
              <p
                className={faction.id === playerFactionId ? "is-selected" : undefined}
                data-testid={`faction-${faction.id}`}
              >
                {faction.name}
                <small>
                  {faction.provinceCount} lands
                  {faction.playable
                    ? ""
                    : faction.cultural
                      ? " · cultural region"
                      : " · local peoples"}
                  {faction.id === playerFactionId ? " · you" : ""}
                </small>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Provinces</h2>
        <p className="muted" data-testid="province-count">
          {readModel
            ? `${provincesForPanel(readModel, selection, playerFactionId).length} shown · ${readModel.provinces.length} on the earth`
            : "Map loading"}
        </p>
        <ul className="select-list">
          {provincesForPanel(readModel, selection, playerFactionId).map((province) => {
            const preview = selectedArmy?.movePreviews.find(
              (candidate) => candidate.provinceId === province.id,
            );
            const legal = preview !== undefined;
            return (
              <li key={province.id}>
                <button
                  type="button"
                  className={
                    selection.kind === "province" && selection.id === province.id
                      ? "is-selected"
                      : legal
                        ? "is-legal"
                        : undefined
                  }
                  data-testid={`province-${province.id}`}
                  data-owner={province.ownerId}
                  data-order={preview?.kind}
                  onClick={() => {
                    if (selectedArmy && legal) {
                      onMoveArmy(selectedArmy.id, province.id);
                      return;
                    }
                    onSelect({ kind: "province", id: province.id });
                  }}
                >
                  {province.name}
                  <small>
                    {preview
                      ? orderLabel(preview, readModel)
                      : province.visible
                        ? (ownerNameFor(readModel, province.ownerId) ?? "Held")
                        : `${ownerNameFor(readModel, province.ownerId) ?? "Unknown"} · unscouted`}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Turn report</h2>
        {notableEvents(lastEvents).length === 0 ? (
          <p className="muted">No commands resolved yet.</p>
        ) : (
          <ol className="event-list">
            {notableEvents(lastEvents).map((event) => (
              <li key={`${event.type}-${event.sequence}`}>{eventLabel(event)}</li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}

function peoplesForPanel(
  readModel: WorldReadModel | undefined,
  playerFactionId: string,
): Array<{
  id: string;
  name: string;
  playable: boolean;
  cultural: boolean;
  provinceCount: number;
}> {
  if (!readModel) {
    return [];
  }
  const counts = new Map<string, number>();
  for (const province of readModel.provinces) {
    if (!province.ownerId) {
      continue;
    }
    counts.set(province.ownerId, (counts.get(province.ownerId) ?? 0) + 1);
  }
  const playableIds = new Set(
    EARTH_MAP.factions.filter((faction) => faction.playable).map((faction) => faction.id),
  );
  const culturalIds = new Set(
    EARTH_MAP.factions
      .filter(
        (faction) => faction.layer === "cultural" || faction.id.startsWith("faction.culture."),
      )
      .map((faction) => faction.id),
  );
  return readModel.factions
    .filter((faction) => (counts.get(faction.id) ?? 0) > 0)
    .map((faction) => ({
      id: faction.id,
      name: faction.name,
      playable: playableIds.has(faction.id),
      cultural: culturalIds.has(faction.id),
      provinceCount: counts.get(faction.id) ?? 0,
    }))
    .sort((left, right) => {
      const rank = (entry: { id: string; playable: boolean; cultural: boolean }): number => {
        if (entry.id === playerFactionId) {
          return 0;
        }
        if (entry.playable) {
          return 1;
        }
        if (entry.cultural) {
          return 3;
        }
        if (entry.id === "faction.unorganized") {
          return 4;
        }
        return 2;
      };
      return (
        rank(left) - rank(right) ||
        right.provinceCount - left.provinceCount ||
        left.name.localeCompare(right.name)
      );
    });
}

function provincesForPanel(
  readModel: WorldReadModel | undefined,
  selection: MapSelection,
  playerFactionId: string,
): NonNullable<WorldReadModel["provinces"]> {
  if (!readModel) {
    return [];
  }
  const selectedArmy =
    selection.kind === "army"
      ? readModel.armies.find((army) => army.id === selection.id)
      : undefined;
  const legal = new Set(selectedArmy?.legalDestinationIds ?? []);
  const armySites = new Set(readModel.armies.map((army) => army.provinceId));
  const selectedId =
    selection.kind === "province" ? selection.id : (selectedArmy?.provinceId ?? undefined);
  return readModel.provinces.filter((province) => {
    if (province.id === selectedId || legal.has(province.id) || armySites.has(province.id)) {
      return true;
    }
    if (province.visible && province.ownerId === playerFactionId) {
      return true;
    }
    return province.visible && !province.name.startsWith("Territory ");
  });
}

function selectionTitle(selection: MapSelection, readModel: WorldReadModel | undefined): string {
  if (selection.kind === "none") {
    return "Nothing selected";
  }
  if (selection.kind === "army") {
    return readModel?.armies.find((army) => army.id === selection.id)?.name ?? selection.id;
  }
  return (
    readModel?.provinces.find((province) => province.id === selection.id)?.name ?? selection.id
  );
}

function provinceName(readModel: WorldReadModel | undefined, provinceId: string): string {
  return readModel?.provinces.find((province) => province.id === provinceId)?.name ?? provinceId;
}

function ownerNameFor(
  readModel: WorldReadModel | undefined,
  ownerId: string | undefined,
): string | undefined {
  if (!ownerId) {
    return undefined;
  }
  return readModel?.factions.find((faction) => faction.id === ownerId)?.name;
}

function notableEvents(events: readonly WorldEvent[]): WorldEvent[] {
  return events
    .filter((event) => event.type !== "province.harvested" && event.type !== "faction.upkeep")
    .slice(-8);
}

function orderPreviewSummary(
  army: NonNullable<WorldReadModel["armies"]>[number],
  readModel: WorldReadModel | undefined,
): string {
  return army.movePreviews
    .map((preview) => {
      const name =
        readModel?.provinces.find((province) => province.id === preview.provinceId)?.name ??
        preview.provinceId;
      return `${name}: ${orderLabel(preview, readModel)}`;
    })
    .join(" · ");
}

function orderLabel(
  preview: NonNullable<WorldReadModel["armies"]>[number]["movePreviews"][number],
  readModel: WorldReadModel | undefined,
): string {
  if (preview.kind === "field-battle") {
    const occupant = readModel?.armies.find((army) => army.id === preview.occupantArmyId);
    const strength = occupant ? occupant.strength.toLocaleString() : "unknown";
    return `Field battle · ${occupant?.name ?? "garrison"} (${strength})`;
  }
  return preview.willCapture ? "March and take" : "Legal march";
}

function eventLabel(event: WorldEvent): string {
  switch (event.type) {
    case "army.moved":
      return `Army marched to ${event.toProvinceId.replace("province.", "")}`;
    case "province.captured":
      return `${event.provinceId.replace("province.", "")} taken`;
    case "province.harvested":
      return `${event.provinceId.replace("province.", "")} harvested ${event.foodDelta}`;
    case "turn.advanced":
      return `Turn ${event.turn} began`;
    case "battle.resolved":
      return event.winnerArmyId === event.attackerArmyId
        ? `Field battle won at ${event.provinceId.replace("province.", "")}`
        : `Field battle lost at ${event.provinceId.replace("province.", "")}`;
    case "army.destroyed":
      return `${event.armyId.replace("army.", "")} destroyed`;
    case "army.recruited":
      return `Levy raised in ${event.provinceId.replace("province.", "")}`;
    case "settlement.queued":
      return `${getBuildingSpec(event.buildingId)?.label ?? event.buildingId} begun in ${event.settlementId.replace("settlement.", "")}`;
    case "settlement.constructed":
      return `${getBuildingSpec(event.buildingId)?.label ?? event.buildingId} finished in ${event.provinceId.replace("province.", "")}`;
    case "faction.upkeep":
      return `${event.factionId.replace("faction.", "")} paid ${-event.treasuryDelta} upkeep`;
    case "order.queued":
      return `Order queued: march to ${event.destinationProvinceId.replace("province.", "")}`;
    case "order.cancelled":
      return `Order cancelled for ${event.armyId.replace("army.", "")}`;
    case "order.failed":
      return `Order failed (${event.reason})`;
    case "research.queued":
      return `${getResearchSpec(event.researchId)?.label ?? event.researchId} begun`;
    case "research.completed":
      return `${getResearchSpec(event.researchId)?.label ?? event.researchId} completed`;
    default: {
      const exhaustive: never = event;
      return JSON.stringify(exhaustive);
    }
  }
}
