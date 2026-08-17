import { useEffect, useRef, useState } from "react";
import { normalizeProfileDraft, validateProfileDraft } from "../launcher/profileValidation";

interface GameMenuProps {
  isDemo: boolean;
  campaignName: string;
  canSave: boolean;
  onResume: () => void;
  onReturnToHall: () => void;
  onKeepCampaign: (commanderName: string, campaignTitle: string) => Promise<void>;
  onQuickSave: () => Promise<void>;
}

export function GameMenu({
  isDemo,
  campaignName,
  canSave,
  onResume,
  onReturnToHall,
  onKeepCampaign,
  onQuickSave,
}: GameMenuProps): React.JSX.Element {
  const [commanderName, setCommanderName] = useState("");
  const [title, setTitle] = useState(campaignName);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const keepCampaign = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const draft = normalizeProfileDraft({ name: commanderName, motto: "" });
    const failure = validateProfileDraft(draft);
    if (failure) {
      setError(failure.message);
      return;
    }
    const campaignTitle = title.trim();
    if (campaignTitle.length < 2) {
      setError("Campaign title must be at least 2 characters.");
      return;
    }
    setBusy(true);
    setError(undefined);
    await onKeepCampaign(draft.name, campaignTitle);
    setBusy(false);
    setSaved(true);
  };

  const quickSave = async (): Promise<void> => {
    setBusy(true);
    await onQuickSave();
    setBusy(false);
    setSaved(true);
  };

  return (
    <div
      className="game-menu-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-menu-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onResume();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onResume();
        }
      }}
    >
      <div className="game-menu">
        <p className="eyebrow">Campaign menu</p>
        <h2 id="game-menu-title">{isDemo ? "Keep this demo?" : "Orders"}</h2>
        <p className="muted">
          {isDemo
            ? "You can finish the demo without an account. Saving creates a local commander and stores this campaign on this device. No email or verification."
            : "Your campaign autosaves. Use this menu to return to the hall."}
        </p>
        {saved ? (
          <p className="save-confirm">Campaign kept. You can return to the hall or resume.</p>
        ) : null}
        {isDemo ? (
          <form onSubmit={(event) => void keepCampaign(event)}>
            <label>
              Commander name
              <input
                ref={nameRef}
                data-testid="keep-commander-name"
                value={commanderName}
                onChange={(event) => setCommanderName(event.target.value)}
                maxLength={32}
                autoComplete="nickname"
                placeholder="e.g. Aurelian"
              />
            </label>
            <label>
              Campaign title
              <input
                data-testid="keep-campaign-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={48}
              />
            </label>
            {error ? <p className="error-message">{error}</p> : null}
            <button type="submit" data-testid="keep-campaign" disabled={!canSave || busy}>
              Save demo and create commander
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-testid="quick-save"
            disabled={!canSave || busy}
            onClick={() => void quickSave()}
          >
            Save now
          </button>
        )}
        <div className="button-row">
          <button type="button" data-testid="resume-campaign" onClick={onResume}>
            Resume
          </button>
          <button
            type="button"
            className="ghost-button"
            data-testid="return-to-hall"
            onClick={onReturnToHall}
          >
            Return to hall
          </button>
        </div>
      </div>
    </div>
  );
}
