# Data Model

Definitions and mutable state are separate.

- A **definition** describes reusable content: faction template, unit type, building, research node, terrain, ability.
- An **instance** describes campaign state: a specific faction, army, formation, settlement, character, or project.
- A **read model** is a filtered projection for UI/rendering.
- A **command** expresses player/AI intent.
- An **event** records an accepted state transition or notable consequence.

## ID policy

External/content IDs are stable lowercase kebab-case strings:

```text
faction.roman-frontier-command
province.upper-river
unit.heavy-infantry
research.civic-road-surveying
```

Hot battle loops use dense integer IDs mapped to external IDs at the boundary.

Never use display names as identifiers.

## Campaign state

Conceptual shape:

```ts
interface CampaignState {
  schemaVersion: number;
  contentVersion: string;
  campaignId: string;
  seed: number;
  turn: number;
  calendar: CampaignCalendar;
  phase: StrategicPhase;
  rng: RngStreams;
  factions: Record<FactionId, FactionState>;
  provinces: Record<ProvinceId, ProvinceState>;
  settlements: Record<SettlementId, SettlementState>;
  armies: Record<ArmyId, ArmyState>;
  formations: Record<FormationId, FormationState>;
  characters: Record<CharacterId, CharacterState>;
  research: Record<FactionId, ResearchState>;
  diplomacy: DiplomacyState;
  missions: Record<MissionId, MissionState>;
  scheduledEvents: ScheduledEvent[];
  revision: number;
}
```

Do not put derived UI values into authoritative state unless caching is required and invalidation is explicit.

## Province

Core instance concerns:

- Definition ID.
- Controller and claimant IDs.
- Home owner ID (starting controller; used so AI reclaims captured land without invading a player's homeland).
- Read models always expose current owner for the political map. Food, unrest, and foreign armies follow fog rules (ADR-0006).
- Settlement/site IDs.
- Adjacency edge IDs.
- Terrain/climate tags.
- Population cohorts.
- Production and stocks.
- Unrest, devastation, disease, and visibility.
- Active-tier marker.
- Dirty-system bitset or tags.

A province does not contain an arbitrary nested tree of every entity. Store IDs and maintain indices.

## Population

Use cohorts:

```text
culture × legal status × livelihood × wealth band × religion/tradition
```

Do not create a person record for ordinary population.

A cohort stores integer population, loyalty, health, and relevant modifiers. Named characters are separate entities.

## Settlement

Current instance (Milestone 2 first step):

- Stable ID, display name, province ID, owner ID.
- Completed building IDs (`storehouse`, `training-ground`, and `civic-hall` are live).
- Optional build queue (`buildingId`, remaining turns).
- Capture of the province transfers the settlement owner.

Later: population linkage, more slots, recruitment queue, defenses, governance.

## Research

Current instance:

- Each faction stores `completedResearchIds` and an optional one-project queue.
- Attested factions start with `organized-logistics`. Cultural and unorganized factions start empty.
- `research.select` pays treasury and queues one node. End turn advances the queue.
- Live effects: Composite Bow Doctrine adds levy strength; Ritual Astronomy adds harvest food on settlement provinces.

## Army

- Owner.
- Province/route position.
- Formation IDs.
- Commander and officers.
- Stance/order.
- Planning `orderQueue` on the world (one queued `army.move` per army; applied on commit).
- Supply and baggage.
- Movement/fatigue.
- Scouting and visibility.
- Tradition/experience.
- Current operation.

Army totals are derived from formations and modifiers.

## Formation

- Definition ID.
- Parent army.
- Manpower/strength.
- Equipment quality.
- Experience.
- Morale/cohesion/fatigue.
- Officer.
- Reinforcement source.
- Persistent battle history.
- Status.

Battle-local arrays may use a compact copy plus linkage back to campaign IDs.

## Character

- Stable ID and generated/authored origin.
- Culture/faction.
- Age/calendar data.
- Offices/roles.
- Traits.
- Skills.
- Relationships.
- Health/injuries.
- Equipment.
- Location/assignment.
- Knowledge and visibility restrictions.

Characters should not accumulate hundreds of independent flags. Prefer tagged effects with source and duration.

## Definitions

Minimum schemas:

- faction
- province
- settlement type
- unit/formation
- equipment profile
- building
- research node
- resource
- terrain
- ability/status
- mission template
- event template
- character archetype
- culture/tradition
- magic tradition

Definitions contain presentation keys, not localized text embedded directly into logic.

## Commands

Command envelope:

```ts
interface CommandEnvelope<TCommand> {
  commandId: string;
  actorFactionId: string;
  issuedAtTurn: number;
  expectedRevision: number;
  command: TCommand;
}
```

Examples:

- `strategic.end-turn`
- `army.move`
- `army.change-stance`
- `settlement.queue-building`
- `settlement.recruit`
- `research.select`
- `battle.deploy-formation`
- `battle.issue-order`
- `party.use-ability`

Commands contain intent, not results or random rolls.

## Events

Event envelope:

```ts
interface DomainEvent<TPayload> {
  eventId: string;
  turn: number;
  phase: string;
  sequence: number;
  type: string;
  visibility: EventVisibility;
  payload: TPayload;
}
```

Events support:

- Presentation.
- Logs and reports.
- AI observations.
- Replay diagnostics.
- Projection into read models.
- Consequence handoff between tactical and campaign layers.

Do not use events as an excuse to persist every animation detail.

## Read models

Examples:

- `StrategicMapReadModel`
- `ProvinceInspectorReadModel`
- `ArmyInspectorReadModel`
- `SettlementReadModel`
- `BattleRenderSnapshot`
- `BattleInspectorReadModel`
- `PartyEncounterReadModel`

A read model includes only information the viewer is permitted to know. Fog-of-war filtering happens before the object reaches UI code.

## Referential integrity

Content validation must detect:

- Missing IDs.
- Duplicate IDs.
- Invalid tag values.
- Research cycles when cycles are forbidden.
- Building upgrade loops.
- Faction starting references that do not exist.
- Province edges that are not reciprocal unless intentionally directed.
- Atlas frame keys that do not exist.
- Historical source references without source records.
