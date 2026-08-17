import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";

export function PhaserCanvas(): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }
    const game = createGame(host);
    return () => game.destroy(true);
  }, []);

  return (
    <div
      ref={hostRef}
      className="game-canvas"
      role="application"
      aria-label="Interactive strategic map"
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
