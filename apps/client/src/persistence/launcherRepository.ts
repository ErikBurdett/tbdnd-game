import {
  AURELIAN_CAMPAIGN_NAME,
  AURELIAN_CAMPAIGN_SEED,
  AURELIAN_CREATED_AT,
  AURELIAN_PROFILE_ID,
  AURELIAN_PROFILE_MOTTO,
  AURELIAN_PROFILE_NAME,
  AURELIAN_SAVE_ID,
  buildWorldReadModel,
  EARTH_CONTENT_VERSION,
  ROME_FACTION_ID,
  serializeWorld,
  simulateAurelianCampaign,
  type WorldEvent,
  type WorldReadModel,
} from "@ancient/sim-core";
import {
  gameDatabase,
  type ProfileRecord,
  type SaveRecord,
  type StatsRecord,
} from "./gameDatabase";

const emptyStats = (profileId: string, now: string): StatsRecord => ({
  profileId,
  campaignsStarted: 0,
  turnsCompleted: 0,
  armiesMoved: 0,
  lastPlayedAt: now,
});

export async function listProfiles(): Promise<ProfileRecord[]> {
  return gameDatabase.profiles.orderBy("updatedAt").reverse().toArray();
}

export async function getProfile(id: string): Promise<ProfileRecord | undefined> {
  return gameDatabase.profiles.get(id);
}

export async function upsertProfile(
  profile: Omit<ProfileRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
  },
): Promise<ProfileRecord> {
  const now = new Date().toISOString();
  const existing = await gameDatabase.profiles.get(profile.id);
  const record: ProfileRecord = {
    id: profile.id,
    name: profile.name,
    motto: profile.motto,
    createdAt: existing?.createdAt ?? profile.createdAt ?? now,
    updatedAt: now,
  };
  await gameDatabase.profiles.put(record);
  if (!(await gameDatabase.stats.get(profile.id))) {
    await gameDatabase.stats.put(emptyStats(profile.id, now));
  }
  return record;
}

export async function deleteProfile(profileId: string): Promise<void> {
  await gameDatabase.transaction(
    "rw",
    gameDatabase.profiles,
    gameDatabase.stats,
    gameDatabase.saves,
    async () => {
      await gameDatabase.profiles.delete(profileId);
      await gameDatabase.stats.delete(profileId);
      await gameDatabase.saves.where("profileId").equals(profileId).delete();
    },
  );
}

export async function getStats(profileId: string): Promise<StatsRecord> {
  const existing = await gameDatabase.stats.get(profileId);
  if (existing) {
    return existing;
  }
  const created = emptyStats(profileId, new Date().toISOString());
  await gameDatabase.stats.put(created);
  return created;
}

export async function recordCampaignStarted(profileId: string): Promise<void> {
  const stats = await getStats(profileId);
  await gameDatabase.stats.put({
    ...stats,
    campaignsStarted: stats.campaignsStarted + 1,
    lastPlayedAt: new Date().toISOString(),
  });
}

export async function recordWorldEvents(
  profileId: string,
  events: readonly WorldEvent[],
): Promise<void> {
  if (events.length === 0) {
    return;
  }
  const stats = await getStats(profileId);
  let turnsCompleted = stats.turnsCompleted;
  let armiesMoved = stats.armiesMoved;
  for (const event of events) {
    if (event.type === "turn.advanced") {
      turnsCompleted += 1;
    }
    if (event.type === "army.moved") {
      armiesMoved += 1;
    }
  }
  await gameDatabase.stats.put({
    ...stats,
    turnsCompleted,
    armiesMoved,
    lastPlayedAt: new Date().toISOString(),
  });
}

export async function listSaves(profileId: string): Promise<SaveRecord[]> {
  const rows = await gameDatabase.saves.where("profileId").equals(profileId).sortBy("updatedAt");
  return rows.reverse();
}

export async function getSave(id: string): Promise<SaveRecord | undefined> {
  return gameDatabase.saves.get(id);
}

export async function writeSave(record: SaveRecord): Promise<void> {
  await gameDatabase.saves.put(record);
}

export async function deleteSave(id: string): Promise<void> {
  await gameDatabase.saves.delete(id);
}

export async function ensureAurelianSample(): Promise<void> {
  const existingProfile = await getProfile(AURELIAN_PROFILE_ID);
  if (!existingProfile) {
    await upsertProfile({
      id: AURELIAN_PROFILE_ID,
      name: AURELIAN_PROFILE_NAME,
      motto: AURELIAN_PROFILE_MOTTO,
      createdAt: AURELIAN_CREATED_AT,
    });
  }
  const existingSave = await getSave(AURELIAN_SAVE_ID);
  if (existingSave?.contentVersion === EARTH_CONTENT_VERSION) {
    return;
  }
  const campaign = simulateAurelianCampaign();
  const readModel = buildWorldReadModel(campaign.state, ROME_FACTION_ID);
  await writeSave(
    saveFromSnapshot({
      id: AURELIAN_SAVE_ID,
      profileId: AURELIAN_PROFILE_ID,
      name: AURELIAN_CAMPAIGN_NAME,
      seed: AURELIAN_CAMPAIGN_SEED,
      createdAt: AURELIAN_CREATED_AT,
      readModel,
      serializedWorld: serializeWorld(campaign.state),
      playerFactionId: ROME_FACTION_ID,
    }),
  );
  let turnsCompleted = 0;
  let armiesMoved = 0;
  for (const event of campaign.events) {
    if (event.type === "turn.advanced") {
      turnsCompleted += 1;
    }
    if (event.type === "army.moved") {
      armiesMoved += 1;
    }
  }
  await gameDatabase.stats.put({
    profileId: AURELIAN_PROFILE_ID,
    campaignsStarted: 1,
    turnsCompleted,
    armiesMoved,
    lastPlayedAt: AURELIAN_CREATED_AT,
  });
}

export function saveFromSnapshot(input: {
  id: string;
  profileId: string;
  name: string;
  seed: number;
  createdAt: string;
  readModel: WorldReadModel;
  serializedWorld: string;
  playerFactionId?: string;
}): SaveRecord {
  const now = new Date().toISOString();
  return {
    id: input.id,
    profileId: input.profileId,
    name: input.name,
    campaignId: `campaign.${input.id}`,
    schemaVersion: 1,
    contentVersion: EARTH_CONTENT_VERSION,
    seed: input.seed,
    turn: input.readModel.turn,
    stateHash: input.readModel.stateHash,
    serializedWorld: input.serializedWorld,
    ...(input.playerFactionId ? { playerFactionId: input.playerFactionId } : {}),
    createdAt: input.createdAt,
    updatedAt: now,
  };
}
