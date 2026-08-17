export type MapSelection =
  | { kind: "none" }
  | { kind: "province"; id: string }
  | { kind: "army"; id: string };

export type MapPick =
  | { kind: "background" }
  | { kind: "province"; id: string; button: 0 | 2 }
  | { kind: "army"; id: string; button: 0 | 2 };

export interface MapArmyPreview {
  id: string;
  ownerId: string;
  legalDestinationIds: string[];
}

export interface ArmyMoveIntent {
  type: "army.move";
  armyId: string;
  destinationProvinceId: string;
}

export interface MapPickResult {
  selection: MapSelection;
  command?: ArmyMoveIntent;
}

export function resolveMapPick(
  selection: MapSelection,
  pick: MapPick,
  playerFactionId: string,
  armies: readonly MapArmyPreview[],
): MapPickResult {
  if (pick.kind === "background") {
    return { selection: { kind: "none" } };
  }

  if (pick.kind === "army") {
    return { selection: { kind: "army", id: pick.id } };
  }

  const selectedArmy =
    selection.kind === "army" ? armies.find((army) => army.id === selection.id) : undefined;
  const canOrder = selectedArmy !== undefined && selectedArmy.ownerId === playerFactionId;

  if (canOrder && selectedArmy) {
    if (pick.button === 2) {
      return {
        selection,
        command: {
          type: "army.move",
          armyId: selectedArmy.id,
          destinationProvinceId: pick.id,
        },
      };
    }
    if (selectedArmy.legalDestinationIds.includes(pick.id)) {
      return {
        selection,
        command: {
          type: "army.move",
          armyId: selectedArmy.id,
          destinationProvinceId: pick.id,
        },
      };
    }
  }

  return { selection: { kind: "province", id: pick.id } };
}

export function legalDestinationIdsForSelection(
  selection: MapSelection,
  playerFactionId: string,
  armies: readonly MapArmyPreview[],
): string[] {
  if (selection.kind !== "army") {
    return [];
  }
  const army = armies.find((candidate) => candidate.id === selection.id);
  if (!army || army.ownerId !== playerFactionId) {
    return [];
  }
  return army.legalDestinationIds;
}
