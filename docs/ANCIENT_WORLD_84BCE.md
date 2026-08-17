# Ancient world layer — 84 BCE

The default campaign is the inhabited earth in **84 BCE**, about forty years before Caesar’s death. This file is the political-geography contract for that date. It does not claim surveyed borders.

## What is authoritative

| Layer | Source of truth | Notes |
| --- | --- | --- |
| Land presence | Natural Earth 50m, via `pnpm map:build` | Public domain coastlines only |
| Runtime factions and starting owners | `tools/map/earth-84bce-politics.mjs` → `packages/sim-core/src/maps/earth84bce.json` | Reconstructed boxes |
| Content catalog (lore, citations) | `content/core/factions.json`, `content/core/provinces.json` | Schematic theater; IDs differ from runtime `faction.*` |
| Operational fog | `buildWorldReadModel` | Hides armies, food, and unrest. Political owner stays visible |

Do not edit `earth84bce.json` by hand. Change the politics file or the generator, then rebuild. Pack version is `earth.84bce.5`.

## Layers

Every runtime faction has a `layer`:

- **`attested`** — a polity or named people that can be placed in 84 BCE from historical or archaeological evidence, even when the box is a gameplay reconstruction.
- **`cultural`** — a region of peoples where no single state can be attested at this date. IDs use the `faction.culture.*` prefix. These are not invented empires.

Victory counts only attested homeland (`homeOwnerId` is not unorganized and does not start with `faction.culture.`). Cultural land does not harvest unless a storehouse is built. AI does not treat player-held cultural land as an opportunistic prize.

## Playable states

These are attested or tightly reconstructed polities a new player may choose. Each starts with a field army on its capital.

### Mediterranean and Europe

- **Rome** — Republic: Italy, Sicily, Sardinia, Narbonensis, coastal Hispania, Africa, Cyrenaica, Macedonia/Achaea, Asia.
- **Pontus** — Mithridates VI: Pontic coast and the Bosporan Kingdom.
- **Bithynia** — Nicomedes IV, west of Pontus.
- **Cappadocia** — Ariobarzanes I, restored with Roman backing.
- **Armenia** — Artaxiad/Tigranes: Armenian highlands.
- **Iberia** — Caucasian Iberia (Kartli), not Hispania.
- **Dacia** — Burebista’s kingdom on the lower Danube.
- **Noricum** — Celtic kingdom in the eastern Alps.
- **Gallic tribes** — independent Gaul north of Narbonensis; Arvernia is the seat.

### Africa and Arabia

- **Ptolemaic Egypt** — Nile and Cyprus. Cyrenaica is already Roman (96 BCE bequest).
- **Numidia**
- **Mauretania**
- **Kush** — Meroitic Nubia.
- **Garamantes** — Fezzan, seat at Garama.
- **Nabataea**
- **Saba** — South Arabian monarchy, seat at Marib.

### Near East

- **Parthia** — Arsacid Iran and Mesopotamia.
- **Seleucid remnant** — Syria only.
- **Hasmonean Judea**

### Central and South Asia

- **Yuezhi** — recently arrived in Bactria after the Saka displacement.
- **Indo-Greeks** — Gandhara / late Indo-Greek successor space.
- **Shunga** — Magadha.
- **Satavahana** — western Deccan.
- **Pandya** — Tamil south, seat at Madurai.
- **Anuradhapura** — island monarchy on Lanka.

### East Asia

- **Han** — Western Han, including the northern Korean commanderies.
- **Xiongnu** — steppe north of the Han.

## Non-playable attested peoples

Colored on the political map, no starting field army:

- **Europe:** Britons, Hibernians, Germanic tribes, Celtiberians, Thracians.
- **Steppe:** Sarmatians, Scythians, Saka, Wusun, Kangju, Xianbei.
- **Highlands and islands:** Qiang, Zhangzhung, Dian, Samhan, Wa.
- **India:** Kalinga, Chera.
- **Africa:** Gaetuli, Aksumite highlands.

## Cultural regions

Where a state cannot be attested, the pack paints a cultural region instead of numbering the whole continent. Names follow archaeological or ethnolinguistic usage for the late first century BCE. Do not promote these to playable empires.

- **Maya city cultures** — Preclassic lowland cities; seat at El Mirador.
- **Zapotec** — Monte Albán.
- **Andean highlands** — post-Chavín highland cultures.
- **Amazon forest peoples**
- **Woodland cultures** — eastern North American riverine cultures.
- **Nok** — Nigerian forest-savanna.
- **Bantu-speaking peoples** — expanding farming communities in Central/East Africa.
- **Khoisan peoples** — southern foraging peoples.
- **Siberian peoples**
- **Australian peoples**
- **Papuan peoples**
- **Mekong valley cultures**

## Unorganized land

Remaining cells stay **Unorganized peoples**, named `Territory 0001` and up. Typical leftovers are Sahara, Arabia Deserta, interior Iran, boreal Canada, Patagonia, and scattered islands. Do not invent empires there.

## Intentionally not invented

Do not add Aztec, Inca, Polynesian, or other later imperial names to 84 BCE. Do not collapse the Americas, Australia, or Siberia into a single playable “native empire.” Cultural regions are the allowed reconstruction.

## Confidence

All starting borders are **reconstructed gameplay boxes** on a 2° land grid. Named seats (Latium, Luoyang, Magadha, Meroe, Petra, Madurai, Marib, El Mirador) are more confident than the rectangles around them. Refine boxes and names in `earth-84bce-politics.mjs`; keep IDs stable. The renderer aggregates owner blobs at far zoom and draws every cell as the camera closes in.

## Runtime ID map

| Content catalog | Earth pack |
| --- | --- |
| `roman-empire` | `faction.rome` |
| `parthian-empire` | `faction.parthia` |
| `kingdom-of-kush` | `faction.kush` |
| `ptolemaic-egypt` | `faction.ptolemy` |
| `kingdom-of-armenia` | `faction.armenia` |
| `seleucid-remnant` | `faction.seleucid` |
