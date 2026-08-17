# Data-Pack and Modding Direction

The vertical slice is not a public mod SDK, but architecture should avoid blocking one.

## Initial safe model

A content pack contains declarative data and assets:

```text
pack.json
factions/
units/
buildings/
research/
events/
missions/
locales/
assets/
```

The pack manifest declares:

- Stable pack ID.
- Version.
- Required engine/content schema version.
- Dependencies.
- Load order constraints.
- License/author.
- Definitions and asset manifests.
- Compatibility notes.

## ID namespaces

Mods use a namespace:

```text
author-or-pack:type.id
```

Core content may use `core:`.

Do not allow two packs to silently replace the same definition. Overrides require explicit declarations.

## Rules

Start with data parameters and authored templates. Do not execute arbitrary JS in the browser.

A future scripting layer should be:

- Deterministic.
- Sandboxed.
- Versioned.
- Resource-limited.
- Serializable.
- Forbidden from network/storage except through capability APIs.
- Testable headlessly.

## Save integration

Saves record pack IDs and versions. Missing dependencies produce a resolution screen and preserve the original save.

## Development benefit

Even before public modding, data packs make the core game easier to test:

- Tiny fixture pack.
- Performance pack.
- Historical theater pack.
- Fantasy-heavy test pack.
- Broken-reference validation pack.
