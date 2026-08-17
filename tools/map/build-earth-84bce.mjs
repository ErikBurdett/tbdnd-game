/**
 * Builds a full-earth province graph for 84 BCE from Natural Earth 50m land.
 * Political control is reconstructed gameplay geography, not surveyed borders.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FACTIONS, NAMED_PLACES, OWNER_BOXES, UNORGANIZED } from "./earth-84bce-politics.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = join(ROOT, "tools/map/cache/ne_50m_land.geojson");
const OUTPUT = join(ROOT, "packages/sim-core/src/maps/earth84bce.json");
const LAND_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson";

const CELL = 2;
const LAT_MIN = -54;
const LAT_MAX = 72;
const LON_MIN = -180;
const LON_MAX = 180;
const MAP_SCALE = 16;
const MAP_LAT_TOP = 75;
const SEA_LINK_CELLS = 3;

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(lon, lat, polygon) {
  if (!polygon[0] || !pointInRing(lon, lat, polygon[0])) {
    return false;
  }
  for (const hole of polygon.slice(1)) {
    if (pointInRing(lon, lat, hole)) {
      return false;
    }
  }
  return true;
}

function ringBBox(ring) {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < west) {
      west = lon;
    }
    if (lon > east) {
      east = lon;
    }
    if (lat < south) {
      south = lat;
    }
    if (lat > north) {
      north = lat;
    }
  }
  return { west, east, south, north };
}

function collectLandPolygons(geojson) {
  const polygons = [];
  for (const feature of geojson.features ?? []) {
    const geometry = feature.geometry;
    if (!geometry) {
      continue;
    }
    if (geometry.type === "Polygon") {
      polygons.push({
        coordinates: geometry.coordinates,
        bbox: ringBBox(geometry.coordinates[0] ?? []),
      });
    } else if (geometry.type === "MultiPolygon") {
      for (const coordinates of geometry.coordinates) {
        polygons.push({
          coordinates,
          bbox: ringBBox(coordinates[0] ?? []),
        });
      }
    }
  }
  return polygons;
}

function isLand(lon, lat, polygons) {
  for (const polygon of polygons) {
    const { bbox } = polygon;
    if (lon < bbox.west || lon > bbox.east || lat < bbox.south || lat > bbox.north) {
      continue;
    }
    if (pointInPolygon(lon, lat, polygon.coordinates)) {
      return true;
    }
  }
  return false;
}

function cellIsLand(col, row, polygons) {
  const lon0 = LON_MIN + col * CELL;
  const lat1 = LAT_MAX - row * CELL;
  const samples = [
    [lon0 + CELL * 0.5, lat1 - CELL * 0.5],
    [lon0 + CELL * 0.25, lat1 - CELL * 0.25],
    [lon0 + CELL * 0.75, lat1 - CELL * 0.25],
    [lon0 + CELL * 0.25, lat1 - CELL * 0.75],
    [lon0 + CELL * 0.75, lat1 - CELL * 0.75],
  ];
  return samples.some(([lon, lat]) => isLand(lon, lat, polygons));
}

function ownerFor(lon, lat) {
  let ownerId = UNORGANIZED;
  for (const box of OWNER_BOXES) {
    if (lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north) {
      ownerId = box.ownerId;
    }
  }
  return ownerId;
}

function mapX(lon) {
  return Math.round((lon - LON_MIN) * MAP_SCALE);
}

function mapY(lat) {
  return Math.round((MAP_LAT_TOP - lat) * MAP_SCALE);
}

async function loadLand() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    const response = await fetch(LAND_URL);
    if (!response.ok) {
      throw new Error(`Failed to download Natural Earth land: ${response.status}`);
    }
    const text = await response.text();
    await mkdir(dirname(CACHE), { recursive: true });
    await writeFile(CACHE, text);
    return JSON.parse(text);
  }
}

const land = await loadLand();
const polygons = collectLandPolygons(land);
const cols = Math.round((LON_MAX - LON_MIN) / CELL);
const rows = Math.round((LAT_MAX - LAT_MIN) / CELL);
const cells = [];

for (let row = 0; row < rows; row += 1) {
  for (let col = 0; col < cols; col += 1) {
    if (!cellIsLand(col, row, polygons)) {
      continue;
    }
    const lon = LON_MIN + (col + 0.5) * CELL;
    const lat = LAT_MAX - (row + 0.5) * CELL;
    cells.push({
      col,
      row,
      lon: Number(lon.toFixed(2)),
      lat: Number(lat.toFixed(2)),
      ownerId: ownerFor(lon, lat),
    });
  }
}

const usedIds = new Set();
const byKey = new Map();
let serial = 1;
const provinces = cells.map((cell) => {
  const id = `province.t-${String(serial).padStart(4, "0")}`;
  serial += 1;
  usedIds.add(id);
  const province = {
    id,
    name: `Territory ${id.slice(-4)}`,
    named: false,
    ownerId: cell.ownerId,
    col: cell.col,
    row: cell.row,
    lon: cell.lon,
    lat: cell.lat,
    neighborIds: [],
    food: 20 + ((cell.col * 17 + cell.row * 13) % 25),
    unrest: (cell.col * 7 + cell.row * 5) % 16,
    x: mapX(cell.lon - CELL / 2),
    y: mapY(cell.lat + CELL / 2),
    w: CELL * MAP_SCALE,
    h: CELL * MAP_SCALE,
    labelX: mapX(cell.lon),
    labelY: mapY(cell.lat),
  };
  byKey.set(`${cell.col},${cell.row}`, province);
  return province;
});

function nearestProvince(lon, lat, allowNamed = false) {
  let best;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const province of provinces) {
    if (!allowNamed && province.named) {
      continue;
    }
    const dist = (province.lon - lon) ** 2 + (province.lat - lat) ** 2;
    if (dist < bestDist) {
      best = province;
      bestDist = dist;
    }
  }
  return best;
}

for (const place of NAMED_PLACES) {
  const target =
    nearestProvince(place.lon, place.lat) ?? nearestProvince(place.lon, place.lat, true);
  if (!target || target.named || (usedIds.has(place.id) && target.id !== place.id)) {
    continue;
  }
  usedIds.delete(target.id);
  usedIds.add(place.id);
  target.id = place.id;
  target.name = place.name;
  target.named = true;
  target.ownerId = place.ownerId;
}

const offsets = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
for (const province of provinces) {
  for (const [dc, dr] of offsets) {
    const neighbor = byKey.get(`${province.col + dc},${province.row + dr}`);
    if (neighbor) {
      province.neighborIds.push(neighbor.id);
    }
  }
}

const coastal = provinces.filter((province) => {
  return offsets.some(([dc, dr]) => !byKey.get(`${province.col + dc},${province.row + dr}`));
});
for (let i = 0; i < coastal.length; i += 1) {
  const a = coastal[i];
  for (let j = i + 1; j < coastal.length; j += 1) {
    const b = coastal[j];
    const chebyshev = Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
    if (chebyshev > 1 && chebyshev <= SEA_LINK_CELLS) {
      if (!a.neighborIds.includes(b.id)) {
        a.neighborIds.push(b.id);
      }
      if (!b.neighborIds.includes(a.id)) {
        b.neighborIds.push(a.id);
      }
    }
  }
}

for (const province of provinces) {
  province.neighborIds = [...new Set(province.neighborIds)].sort();
}

const idSet = new Set(provinces.map((province) => province.id));
for (const faction of FACTIONS) {
  if (faction.capitalId && !idSet.has(faction.capitalId)) {
    const fallback = provinces.find((province) => province.ownerId === faction.id);
    faction.capitalId = fallback?.id ?? provinces[0]?.id ?? "";
  }
}

const pack = {
  schemaVersion: 1,
  dateLabel: "84 BCE",
  source: {
    name: "Natural Earth 50m land",
    url: LAND_URL,
    license: "public domain",
    note: "Land presence only. Political assignment is a reconstructed 84 BCE gameplay layer.",
  },
  cellDegrees: CELL,
  mapScale: MAP_SCALE,
  lonMin: LON_MIN,
  lonMax: LON_MAX,
  latMin: LAT_MIN,
  latMax: LAT_MAX,
  latTop: MAP_LAT_TOP,
  mapWidth: Math.round((LON_MAX - LON_MIN) * MAP_SCALE),
  mapHeight: Math.round((MAP_LAT_TOP - LAT_MIN) * MAP_SCALE),
  factions: FACTIONS,
  provinces,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(pack)}\n`);

const counts = {};
for (const province of provinces) {
  counts[province.ownerId] = (counts[province.ownerId] ?? 0) + 1;
}
const summary = Object.entries(counts)
  .sort((left, right) => right[1] - left[1])
  .map(([id, count]) => `${id.replace("faction.", "")}:${count}`)
  .join(" ");
console.log(
  `Wrote ${provinces.length} provinces (${provinces.filter((province) => province.named).length} named) to ${OUTPUT}`,
);
console.log(summary);
