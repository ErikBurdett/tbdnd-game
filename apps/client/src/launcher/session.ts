export type AppPath = "/" | "/play";

export const DEFAULT_PLAYER_FACTION_ID = "faction.rome";

export interface NewCampaignSession {
  kind: "new";
  saveId: string;
  profileId: string;
  name: string;
  seed: number;
  playerFactionId: string;
}

export interface LoadCampaignSession {
  kind: "load";
  saveId: string;
  profileId: string;
  name: string;
  seed: number;
  serializedWorld: string;
  createdAt: string;
  playerFactionId: string;
}

export interface DemoCampaignSession {
  kind: "demo";
  saveId: string;
  name: string;
  seed: number;
  playerFactionId: string;
}

export type CampaignSession = NewCampaignSession | LoadCampaignSession | DemoCampaignSession;

export function isPersistentSession(
  session: CampaignSession,
): session is NewCampaignSession | LoadCampaignSession {
  return session.kind !== "demo";
}

export function sessionPlayerFactionId(session: CampaignSession): string {
  return session.playerFactionId || DEFAULT_PLAYER_FACTION_ID;
}

export function startDemoSession(playerFactionId = DEFAULT_PLAYER_FACTION_ID): DemoCampaignSession {
  const session: DemoCampaignSession = {
    kind: "demo",
    saveId: createId("save"),
    name: "Earth Demo",
    seed: createCampaignSeed(),
    playerFactionId,
  };
  writeCampaignSession(session);
  return session;
}

const PROFILE_KEY = "imperium.profileId";
const SESSION_KEY = "imperium.campaignSession";

export function readActiveProfileId(): string | undefined {
  return (
    window.localStorage.getItem(PROFILE_KEY) ??
    window.sessionStorage.getItem(PROFILE_KEY) ??
    undefined
  );
}

export function writeActiveProfileId(profileId: string | undefined): void {
  if (profileId) {
    window.localStorage.setItem(PROFILE_KEY, profileId);
    window.sessionStorage.removeItem(PROFILE_KEY);
    return;
  }
  window.localStorage.removeItem(PROFILE_KEY);
  window.sessionStorage.removeItem(PROFILE_KEY);
}

export function readCampaignSession(): CampaignSession | undefined {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    return parseCampaignSession(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

function parseCampaignSession(value: unknown): CampaignSession | undefined {
  if (!isRecord(value) || typeof value.saveId !== "string") {
    return undefined;
  }
  if (typeof value.name !== "string" || typeof value.seed !== "number") {
    return undefined;
  }
  const playerFactionId =
    typeof value.playerFactionId === "string" && value.playerFactionId.length > 0
      ? value.playerFactionId
      : DEFAULT_PLAYER_FACTION_ID;
  if (value.kind === "demo") {
    return {
      kind: "demo",
      saveId: value.saveId,
      name: value.name,
      seed: value.seed,
      playerFactionId,
    };
  }
  if (typeof value.profileId !== "string") {
    return undefined;
  }
  if (value.kind === "new") {
    return {
      kind: "new",
      saveId: value.saveId,
      profileId: value.profileId,
      name: value.name,
      seed: value.seed,
      playerFactionId,
    };
  }
  if (
    value.kind === "load" &&
    typeof value.serializedWorld === "string" &&
    typeof value.createdAt === "string"
  ) {
    return {
      kind: "load",
      saveId: value.saveId,
      profileId: value.profileId,
      name: value.name,
      seed: value.seed,
      serializedWorld: value.serializedWorld,
      createdAt: value.createdAt,
      playerFactionId,
    };
  }
  return undefined;
}

export function writeCampaignSession(session: CampaignSession | undefined): void {
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function currentPath(): AppPath {
  return window.location.pathname === "/play" ? "/play" : "/";
}

export function navigate(path: AppPath): void {
  if (window.location.pathname === path) {
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function createId(prefix: string): string {
  return `${prefix}.${crypto.randomUUID()}`;
}

export function createCampaignSeed(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] ?? 10;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
