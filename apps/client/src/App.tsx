import { lazy, Suspense, useEffect, useState } from "react";
import { HomePage } from "./launcher/HomePage";
import { type AppPath, currentPath, readActiveProfileId } from "./launcher/session";

const CampaignScreen = lazy(async () => {
  const module = await import("./campaign/CampaignScreen");
  return { default: module.CampaignScreen };
});

export function App(): React.JSX.Element {
  const [path, setPath] = useState<AppPath>(currentPath);
  const [profileId, setProfileId] = useState<string | undefined>(readActiveProfileId);

  useEffect(() => {
    const onPop = (): void => {
      const next = currentPath();
      setPath(next);
      if (next === "/") {
        setProfileId(readActiveProfileId());
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path === "/play") {
    return (
      <Suspense
        fallback={
          <main className="app-shell">
            <p className="hall-lead" style={{ padding: "2rem" }}>
              Opening the frontier…
            </p>
          </main>
        }
      >
        <CampaignScreen />
      </Suspense>
    );
  }

  return <HomePage activeProfileId={profileId} onProfileChange={setProfileId} />;
}
