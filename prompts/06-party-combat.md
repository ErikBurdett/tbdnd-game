# Party Combat Prompt

Plan one compact XCOM-like mission capability while reusing campaign characters and shared concepts.

Required architecture:

- Individual authority is acceptable because counts are small.
- Use a separate encounter state and command union.
- Reuse shared IDs/tags for characters, equipment, status, terrain, and events.
- Do not share the formation data layout merely for code reuse.
- Campaign enters through a validated mission-start command and receives a consequence bundle.
- Authoritative turns do not depend on animation.
- Renderer/UI expose keyboard-equivalent action and target selection.
- Save only at declared encounter boundaries.

First slice:

- 3–5 player characters.
- 4–8 opponents.
- Move, attack, one positional rule, one spell/ritual, one objective interaction, injury, and extraction.
- Deterministic enemy utility AI.
- One map fixture.

Define acceptance criteria and non-goals, then implement the smallest end-to-end action.
