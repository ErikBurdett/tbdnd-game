# Historical and Fantasy Content Policy

## Purpose

The campaign should be grounded enough to reward historical curiosity without pretending that uncertain reconstructions are exact or that fantasy inventions are historical claims.

## Content classes

Every relevant record uses one classification:

- `attested`: supported by reliable historical/archaeological evidence appropriate to the claim.
- `reconstructed`: a reasoned scholarly or gameplay reconstruction with uncertainty.
- `cultural-region`: a named people or archaeological culture used when no single 84 BCE state can be attested. Runtime IDs are `faction.culture.*`. Not a playable empire.
- `composite`: combines multiple real examples into one playable representation.
- `invented-historical`: fictional person/place/institution designed to fit the setting.
- `fantasy-divergence`: explicitly supernatural or counterfactual.
- `anachronistic-gameplay`: knowingly moved/combined for playability.

## Provenance fields

Recommended metadata:

```ts
interface Provenance {
  classification: HistoricalClassification;
  confidence: "high" | "medium" | "low" | "not-applicable";
  sourceIds: string[];
  note?: string;
  divergencePoint?: string;
}
```

Sources are separate records with author/title/publisher/date/URL or citation details and license where data is imported.

## Design rules

- Do not label speculative political boundaries as precise fact.
- Do not equate ancient peoples directly with modern national identities without context.
- Distinguish polity, ethnicity, language, religion, legal status, and culture.
- Avoid treating a culture as one personality trait or gameplay bonus.
- Represent internal diversity and contested authority.
- Do not copy D&D proper nouns, setting lore, stat blocks, creature text, spell lists, or branded visual identity.
- Use original magic traditions grounded in local themes without asserting invented rituals were historical.
- Content warnings and sensitivity review are appropriate for slavery, war, disease, execution, and religious conflict.
- Balance changes do not need to masquerade as historical claims.

## Starting-date workflow

Before shipping a faction or province:

1. Define the gameplay claim.
2. Identify what must be historically true for it.
3. Gather at least one strong source; use multiple for disputed or central claims.
4. Mark confidence and disputes.
5. Separate gameplay abstractions.
6. Record fantasy divergence.
7. Have a human review names, chronology, geography, and cultural framing.

## Fictional characters

Fictional characters should:

- Be labeled internally as invented.
- Use plausible naming guidance with sources.
- Avoid impersonating an attested figure unless the design explicitly uses that figure.
- Not be cited by the game as historical evidence.

## In-game presentation

The player does not need academic apparatus in every tooltip, but the codex should offer:

- “Historical basis.”
- “Gameplay abstraction.”
- “Fantasy divergence.”
- Key source notes.
- Confidence/dispute language.

## Research quality tiers

- Tier A: primary sources in responsible translation, peer-reviewed scholarship, major academic reference works, official datasets.
- Tier B: reputable museum/university publications and specialist syntheses.
- Tier C: high-quality general history used as orientation.
- Tier D: community resources used only to locate stronger sources.

Central factual claims should not rely only on Tier D.
