import Dexie, { type EntityTable } from "dexie";

export interface SaveRecord {
  id: string;
  profileId: string;
  name: string;
  campaignId: string;
  schemaVersion: number;
  contentVersion: string;
  seed: number;
  turn: number;
  stateHash: string;
  serializedWorld: string;
  playerFactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplayRecord {
  id: string;
  campaignId: string;
  initialSnapshot: string;
  commandLog: string;
  finalStateHash: string;
  createdAt: string;
}

export interface ProfileRecord {
  id: string;
  name: string;
  motto: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatsRecord {
  profileId: string;
  campaignsStarted: number;
  turnsCompleted: number;
  armiesMoved: number;
  lastPlayedAt: string;
}

class AncientWorldDatabase extends Dexie {
  saves!: EntityTable<SaveRecord, "id">;
  replays!: EntityTable<ReplayRecord, "id">;
  profiles!: EntityTable<ProfileRecord, "id">;
  stats!: EntityTable<StatsRecord, "profileId">;

  constructor() {
    super("ancient-world-strategy");
    this.version(1).stores({
      saves: "id, campaignId, updatedAt, turn",
      replays: "id, campaignId, createdAt",
    });
    this.version(2).stores({
      saves: "id, campaignId, profileId, updatedAt, turn",
      replays: "id, campaignId, createdAt",
      profiles: "id, updatedAt",
      stats: "profileId",
    });
  }
}

export const gameDatabase = new AncientWorldDatabase();
