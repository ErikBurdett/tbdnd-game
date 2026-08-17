import { listPlayableFactions } from "@ancient/sim-core";
import { DEFAULT_PLAYER_FACTION_ID } from "./session";

interface FactionPickerProps {
  value: string;
  onChange: (factionId: string) => void;
  disabled?: boolean;
}

export function FactionPicker({
  value,
  onChange,
  disabled = false,
}: FactionPickerProps): React.JSX.Element {
  const factions = listPlayableFactions();
  const selected = factions.some((faction) => faction.id === value)
    ? value
    : DEFAULT_PLAYER_FACTION_ID;

  return (
    <label className="faction-picker">
      Play as
      <select
        data-testid="faction-select"
        value={selected}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {factions.map((faction) => (
          <option key={faction.id} value={faction.id}>
            {faction.name}
            {faction.government ? ` · ${faction.government}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
