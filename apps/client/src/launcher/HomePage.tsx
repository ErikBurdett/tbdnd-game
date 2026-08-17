import { AURELIAN_PROFILE_ID, AURELIAN_PROFILE_NAME, AURELIAN_SAVE_ID } from "@ancient/sim-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileRecord, SaveRecord, StatsRecord } from "../persistence/gameDatabase";
import {
  deleteProfile,
  deleteSave,
  ensureAurelianSample,
  getSave,
  getStats,
  listProfiles,
  listSaves,
  upsertProfile,
} from "../persistence/launcherRepository";
import { FactionPicker } from "./FactionPicker";
import fallbackNews from "./fallbackNews.json";
import { loadNewsFeed, type NewsFeed } from "./news";
import { normalizeProfileDraft, validateProfileDraft } from "./profileValidation";
import {
  createCampaignSeed,
  createId,
  DEFAULT_PLAYER_FACTION_ID,
  navigate,
  startDemoSession,
  writeActiveProfileId,
  writeCampaignSession,
} from "./session";

interface HomePageProps {
  activeProfileId: string | undefined;
  onProfileChange: (profileId: string | undefined) => void;
}

export function HomePage({ activeProfileId, onProfileChange }: HomePageProps): React.JSX.Element {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [stats, setStats] = useState<StatsRecord>();
  const [news, setNews] = useState<NewsFeed>();
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [campaignName, setCampaignName] = useState("Consular War");
  const [playerFactionId, setPlayerFactionId] = useState(DEFAULT_PLAYER_FACTION_ID);
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const latestSave = saves[0];

  const refresh = useCallback(async (profileId: string | undefined): Promise<void> => {
    const nextProfiles = await listProfiles();
    setProfiles(nextProfiles);
    if (!profileId) {
      setSaves([]);
      setStats(undefined);
      return;
    }
    const [nextSaves, nextStats] = await Promise.all([listSaves(profileId), getStats(profileId)]);
    setSaves(nextSaves);
    setStats(nextStats);
  }, []);

  useEffect(() => {
    void refresh(activeProfileId);
  }, [activeProfileId, refresh]);

  useEffect(() => {
    let cancelled = false;
    void ensureAurelianSample().then(() => {
      if (!cancelled) {
        void refresh(activeProfileId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeProfileId, refresh]);

  useEffect(() => {
    let cancelled = false;
    void loadNewsFeed(fallbackNews).then((feed) => {
      if (!cancelled) {
        setNews(feed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setMotto(activeProfile.motto);
    }
  }, [activeProfile]);

  const signedIn = activeProfile !== undefined;
  const newsItems = news?.items ?? [];
  const featured = newsItems[0];

  const startDemo = (): void => {
    startDemoSession(playerFactionId);
    navigate("/play");
  };

  const enterAurelian = async (): Promise<void> => {
    await ensureAurelianSample();
    writeActiveProfileId(AURELIAN_PROFILE_ID);
    onProfileChange(AURELIAN_PROFILE_ID);
    const save = await getSave(AURELIAN_SAVE_ID);
    if (save) {
      continueSave(save);
    }
  };

  const heroCta = useMemo(() => {
    if (latestSave && signedIn) {
      return { href: "#campaigns", label: "Continue campaign" };
    }
    return { href: "#top", label: "Play demo" };
  }, [latestSave, signedIn]);

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const draft = normalizeProfileDraft({ name, motto });
    const failure = validateProfileDraft(draft);
    if (failure) {
      setFormError(failure.message);
      return;
    }
    setBusy(true);
    setFormError(undefined);
    const profile = await upsertProfile({
      id: activeProfile?.id ?? createId("profile"),
      name: draft.name,
      motto: draft.motto,
    });
    writeActiveProfileId(profile.id);
    onProfileChange(profile.id);
    setBusy(false);
  };

  const signIn = (profileId: string): void => {
    writeActiveProfileId(profileId);
    onProfileChange(profileId);
  };

  const signOut = (): void => {
    writeActiveProfileId(undefined);
    onProfileChange(undefined);
  };

  const removeProfile = async (): Promise<void> => {
    if (!activeProfile) {
      return;
    }
    await deleteProfile(activeProfile.id);
    writeActiveProfileId(undefined);
    onProfileChange(undefined);
    await refresh(undefined);
  };

  const startNewCampaign = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!activeProfile) {
      setFormError("Sign in as a commander before founding a campaign.");
      return;
    }
    const title = campaignName.trim();
    if (title.length < 2) {
      setFormError("Campaign name must be at least 2 characters.");
      return;
    }
    writeCampaignSession({
      kind: "new",
      saveId: createId("save"),
      profileId: activeProfile.id,
      name: title,
      seed: createCampaignSeed(),
      playerFactionId,
    });
    navigate("/play");
  };

  const continueSave = (save: SaveRecord): void => {
    writeCampaignSession({
      kind: "load",
      saveId: save.id,
      profileId: save.profileId,
      name: save.name,
      seed: save.seed,
      serializedWorld: save.serializedWorld,
      createdAt: save.createdAt,
      playerFactionId: save.playerFactionId ?? DEFAULT_PLAYER_FACTION_ID,
    });
    navigate("/play");
  };

  const removeSave = async (saveId: string): Promise<void> => {
    await deleteSave(saveId);
    await refresh(activeProfileId);
  };

  return (
    <div className="hall">
      <header className="hall-nav">
        <a className="hall-mark" href="#top">
          <span>IA</span>
          Imperium Arcana
        </a>
        <nav aria-label="Hall">
          <a href="#dispatches">Dispatches</a>
          <a href="#campaigns">Campaigns</a>
          <a href="#commander">Commander</a>
          <a href="#world">The World</a>
        </nav>
        {heroCta.label === "Play demo" ? (
          <button type="button" className="hall-cta" data-testid="play-demo" onClick={startDemo}>
            Play demo
          </button>
        ) : (
          <a className="hall-cta" href={heroCta.href}>
            {heroCta.label}
          </a>
        )}
      </header>

      <section className="hall-hero" id="top">
        <p className="eyebrow">The inhabited earth · 84 BCE</p>
        <h1>Govern a people the histories almost remember.</h1>
        <p className="hall-lead">
          A turn-based historical-fantasy grand strategy on a full-earth map. Choose an attested
          people of 84 BCE, command provinces and armies, and keep the campaign on this device.
          Lands without a recorded state are cultural regions, not invented empires.
        </p>
        <div className="hall-hero-actions">
          <FactionPicker value={playerFactionId} onChange={setPlayerFactionId} />
          <button type="button" data-testid="play-demo-hero" onClick={startDemo}>
            Play demo
          </button>
          <button type="button" data-testid="enter-aurelian" onClick={() => void enterAurelian()}>
            Enter as {AURELIAN_PROFILE_NAME}
          </button>
          {latestSave && signedIn ? (
            <button
              type="button"
              data-testid="continue-campaign"
              onClick={() => continueSave(latestSave)}
            >
              Continue {latestSave.name}
            </button>
          ) : null}
          {signedIn ? (
            <a className="button-link" href="#campaigns">
              New campaign
            </a>
          ) : (
            <a className="button-link" href="#commander">
              Optional: make a commander first
            </a>
          )}
        </div>
        <p className="hall-meta" data-testid="hall-meta">
          {signedIn
            ? `Signed in as ${activeProfile.name}. Profiles and saves stay on this machine.`
            : "No sign-in required. Choose a people, play the demo, or enter as Aurelian — no password — to load the finished Consular War as Rome."}
        </p>
      </section>

      <section className="hall-section" id="dispatches">
        <div className="hall-section-head">
          <h2>Dispatches</h2>
          <p>
            {news?.source === "github-main"
              ? "Live from the production main branch."
              : (news?.notice ?? "Loading dispatches…")}
          </p>
        </div>
        {featured ? (
          <article className="dispatch-feature">
            <p className="dispatch-tag">
              {featured.tag} · {featured.date}
            </p>
            <h3>{featured.title}</h3>
            <p>{featured.summary}</p>
            <ul>
              {featured.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ) : null}
        <div className="dispatch-grid">
          {newsItems.slice(1).map((item) => (
            <article key={item.id} className="dispatch-card">
              <p className="dispatch-tag">
                {item.tag} · {item.date}
              </p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hall-section" id="campaigns">
        <div className="hall-section-head">
          <h2>Campaigns</h2>
          <p>The default map is the entire earth, reconstructed for 84 BCE.</p>
        </div>
        <div className="hall-split">
          <form className="hall-card" onSubmit={startNewCampaign}>
            <h3>Found a new campaign</h3>
            <label>
              Campaign title
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                maxLength={48}
                disabled={!signedIn}
              />
            </label>
            <FactionPicker
              value={playerFactionId}
              onChange={setPlayerFactionId}
              disabled={!signedIn}
            />
            <button type="submit" disabled={!signedIn}>
              Begin on the world map
            </button>
          </form>
          <div className="hall-card">
            <h3>Saved games</h3>
            {saves.length === 0 ? (
              <p className="muted">No saved campaigns for this commander.</p>
            ) : (
              <ul className="save-list">
                {saves.map((save) => (
                  <li key={save.id}>
                    <div>
                      <strong data-testid="save-name">{save.name}</strong>
                      <small>
                        Turn {save.turn} · {save.stateHash} · {save.updatedAt.slice(0, 10)}
                      </small>
                    </div>
                    <div className="button-row">
                      <button
                        type="button"
                        data-testid={`load-save-${save.id}`}
                        onClick={() => continueSave(save)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => void removeSave(save.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="hall-section" id="commander">
        <div className="hall-section-head">
          <h2>Commander</h2>
          <p>
            Local identity only. Reviewer commander: {AURELIAN_PROFILE_NAME} — no password, no
            email. Click the name below or Enter as Aurelian on the hero.
          </p>
        </div>
        <div className="hall-split">
          <form className="hall-card" onSubmit={(event) => void submitProfile(event)}>
            <h3>{signedIn ? "Manage profile" : "Create commander"}</h3>
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={32}
                required
              />
            </label>
            <label>
              Motto
              <input
                value={motto}
                onChange={(event) => setMotto(event.target.value)}
                maxLength={80}
              />
            </label>
            {formError ? <p className="error-message">{formError}</p> : null}
            <div className="button-row">
              <button type="submit" disabled={busy}>
                {signedIn ? "Save profile" : "Sign in locally"}
              </button>
              {signedIn ? (
                <button type="button" className="ghost-button" onClick={signOut}>
                  Sign out
                </button>
              ) : null}
            </div>
          </form>
          <div className="hall-card">
            <h3>Service record</h3>
            {stats && signedIn ? (
              <dl className="stat-grid">
                <div>
                  <dt>Campaigns</dt>
                  <dd>{stats.campaignsStarted}</dd>
                </div>
                <div>
                  <dt>Turns resolved</dt>
                  <dd>{stats.turnsCompleted}</dd>
                </div>
                <div>
                  <dt>Marches</dt>
                  <dd>{stats.armiesMoved}</dd>
                </div>
                <div>
                  <dt>Last in the field</dt>
                  <dd>{stats.lastPlayedAt.slice(0, 10)}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted">
                Sign in to track campaigns, turns, and marches on this device.
              </p>
            )}
            {profiles.length > 0 ? (
              <ul className="select-list">
                {profiles.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      className={profile.id === activeProfileId ? "is-selected" : undefined}
                      data-testid={`sign-in-${profile.id}`}
                      onClick={() => signIn(profile.id)}
                    >
                      {profile.name}
                      <small>{profile.motto || "No motto"}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {signedIn ? (
              <button type="button" className="ghost-button" onClick={() => void removeProfile()}>
                Delete this commander and their saves
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hall-section" id="world">
        <div className="hall-section-head">
          <h2>The world</h2>
          <p>History as the foundation. Fantasy only where the archive marks a divergence.</p>
        </div>
        <div className="dispatch-grid">
          <article className="dispatch-card">
            <h3>Province command</h3>
            <p>
              Click the map to inspect land, raise intent, and march armies through adjacent
              provinces.
            </p>
          </article>
          <article className="dispatch-card">
            <h3>Deterministic war</h3>
            <p>
              The same seed and orders always produce the same hash. Reloads do not invent a new
              history.
            </p>
          </article>
          <article className="dispatch-card">
            <h3>Two tactical lenses</h3>
            <p>
              Formation battles for the host. Party missions for the few. Both write back to the
              campaign.
            </p>
          </article>
        </div>
      </section>

      <footer className="hall-footer">
        <p>Imperium Arcana · offline technical slice · no store, no live-service account</p>
        <p>
          Patch notes read `main` when `VITE_GITHUB_REPO` is set; otherwise the local dispatch desk
          is shown.
        </p>
      </footer>
    </div>
  );
}
