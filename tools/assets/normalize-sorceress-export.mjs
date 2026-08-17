import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const [inputPath, outputPath, assetId] = process.argv.slice(2);
if (!inputPath || !outputPath || !assetId) {
  console.error(
    "Usage: node tools/assets/normalize-sorceress-export.mjs <sorceress.json> <normalized.json> <asset-id>",
  );
  process.exit(2);
}

const source = JSON.parse(await readFile(inputPath, "utf8"));
const rawFrames = Array.isArray(source.frames)
  ? source.frames
  : source.frames && typeof source.frames === "object"
    ? Object.entries(source.frames).map(([name, value]) => ({ name, ...value }))
    : undefined;

if (!rawFrames || rawFrames.length === 0) {
  console.error(
    "The export has no recognizable frames array/object. Inspect the actual Sorceress output and extend this adapter; do not guess field meanings.",
  );
  process.exit(1);
}

const normalized = {
  adapterVersion: 1,
  assetId,
  sourceSchemaKeys: Object.keys(source).sort(),
  frames: rawFrames.map((frame, index) => ({
    index,
    sourceName: typeof frame.name === "string" ? frame.name : String(index),
    x: frame.x ?? frame.frame?.x ?? null,
    y: frame.y ?? frame.frame?.y ?? null,
    width: frame.width ?? frame.w ?? frame.frame?.w ?? null,
    height: frame.height ?? frame.h ?? frame.frame?.h ?? null,
  })),
  reviewRequired: true,
  reviewNotes: [
    "Confirm all coordinates against the exported PNG.",
    "Rename frames to the project convention before runtime atlas generation.",
    "Copy no license assumptions from the conversion tool.",
  ],
};

await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
console.log(`Wrote normalized review file to ${outputPath}.`);
