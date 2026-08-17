import type { WorldReadModel } from "@ancient/sim-core";
import { legalDestinationIdsForSelection, type MapSelection } from "./selection";

export interface StrategicMapArmyView {
  id: string;
  name: string;
  provinceId: string;
  ownerId: string;
  strength: number;
  movementPoints: number;
}

export interface StrategicMapView {
  selection: MapSelection;
  playerFactionId: string;
  legalDestinationIds: string[];
  queuedDestinationIds: string[];
  armies: StrategicMapArmyView[];
  provinceOwners: Record<string, string>;
}

export function buildStrategicMapView(
  readModel: WorldReadModel,
  selection: MapSelection,
  playerFactionId: string,
): StrategicMapView {
  const provinceOwners: Record<string, string> = {};
  for (const province of readModel.provinces) {
    if (province.ownerId) {
      provinceOwners[province.id] = province.ownerId;
    }
  }

  return {
    selection,
    playerFactionId,
    legalDestinationIds: legalDestinationIdsForSelection(
      selection,
      playerFactionId,
      readModel.armies,
    ),
    queuedDestinationIds: readModel.queuedOrders.map((order) => order.destinationProvinceId),
    armies: readModel.armies.map((army) => ({
      id: army.id,
      name: army.name,
      provinceId: army.provinceId,
      ownerId: army.ownerId,
      strength: army.strength,
      movementPoints: army.movementPoints,
    })),
    provinceOwners,
  };
}
