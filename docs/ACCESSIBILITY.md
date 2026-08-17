# Accessibility Baseline

Accessibility is easier when React owns the semantic UI and Phaser owns the visual world.

## Baseline requirements

- Full strategic UI operable by keyboard.
- Visible focus states.
- Remappable game controls.
- Text scaling without clipping.
- Sufficient contrast.
- Team/faction distinction not dependent on color alone.
- Tooltips available through focus, not hover only.
- Pause/step/review for resolution presentation.
- Adjustable animation speed and screen shake.
- Reduced motion mode.
- Volume controls by category.
- Subtitles/captions for spoken content.
- UI descriptions for important map/battle state.
- Confirmations for destructive orders with an option to tune them.

## Canvas bridge

Do not attempt to make every soldier an accessibility node.

Expose semantic controls/read models in React:

- Selected province.
- Adjacent legal destinations.
- Army summary.
- Formation order list.
- Current battle phase and notable events.
- Action list and targets for party combat.

Canvas pointer selection and keyboard/list selection should resolve to the same IDs and commands.

## Pixel art

- Preserve crisp pixels without using tiny unreadable UI text.
- Keep text outside sprite art.
- Provide UI scale independent of game-camera zoom.
- Use icons plus labels where ambiguity matters.
