# `@ancient/battle-sim`

A deterministic, renderer-independent prototype for formation-authoritative battles.

The authoritative simulation stores formations in dense typed arrays. Thousands of soldiers can be derived as visual slots without becoming thousands of AI agents, physics bodies, or save-game entities. Changing visual density cannot change battle outcomes.

This package intentionally starts with movement and representation contracts, not a finished combat model. Add contact, morale, missiles, and routing behind deterministic phase functions and property tests.
