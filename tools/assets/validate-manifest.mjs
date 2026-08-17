import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const manifestArgument = process.argv[2];
if (!manifestArgument) {
  console.error("Usage: node tools/assets/validate-manifest.mjs <manifest.json>");
  process.exit(2);
}

const root = process.cwd();
const manifestPath = path.resolve(root, manifestArgument);
const issues = [];

function issue(location, message) {
  issues.push(`${location}: ${message}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeProjectPath(candidate) {
  if (typeof candidate !== "string" || candidate.length === 0 || path.isAbsolute(candidate)) {
    return false;
  }
  const resolved = path.resolve(root, candidate);
  const relative = path.relative(root, resolved);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function pngDimensions(filePath) {
  const bytes = await readFile(filePath);
  const signature = "89504e470d0a1a0a";
  if (bytes.subarray(0, 8).toString("hex") !== signature || bytes.length < 24) {
    return undefined;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

async function validateFileRecord(file, location, expectedDimensions) {
  if (!isRecord(file)) {
    issue(location, "must be an object");
    return;
  }
  if (!isSafeProjectPath(file.path)) {
    issue(`${location}.path`, "must be a repository-relative path without traversal");
    return;
  }
  if (typeof file.role !== "string" || file.role.length === 0) {
    issue(`${location}.role`, "must be a non-empty string");
  }
  if (typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)) {
    issue(`${location}.sha256`, "must be a lowercase SHA-256 digest");
  }

  const absolutePath = path.resolve(root, file.path);
  try {
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) {
      issue(`${location}.path`, `${file.path} is not a file`);
      return;
    }
    const actualHash = await sha256(absolutePath);
    if (actualHash !== file.sha256) {
      issue(`${location}.sha256`, `expected ${file.sha256}, found ${actualHash}`);
    }
    if (file.path.toLowerCase().endsWith(".png") && expectedDimensions) {
      const dimensions = await pngDimensions(absolutePath);
      if (!dimensions) {
        issue(`${location}.path`, "has .png extension but no PNG signature/IHDR");
      } else if (
        dimensions.width !== expectedDimensions.width ||
        dimensions.height !== expectedDimensions.height
      ) {
        issue(
          `${location}.path`,
          `manifest says ${expectedDimensions.width}x${expectedDimensions.height}, PNG is ${dimensions.width}x${dimensions.height}`,
        );
      }
    }
  } catch (error) {
    issue(
      `${location}.path`,
      `cannot read ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

let raw;
try {
  raw = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  console.error(`Unable to read manifest ${manifestArgument}:`, error);
  process.exit(1);
}

if (!isRecord(raw)) {
  issue("manifest", "must be an object");
} else {
  if (raw.manifestVersion !== 1) {
    issue("manifestVersion", "must equal 1");
  }
  if (!Array.isArray(raw.assets)) {
    issue("assets", "must be an array");
  } else {
    const assetIds = new Set();
    const licenseRegister = await readFile(
      path.resolve(root, "LICENSES/THIRD_PARTY_ASSET_REGISTER.csv"),
      "utf8",
    );

    for (const [assetIndex, asset] of raw.assets.entries()) {
      const base = `assets[${assetIndex}]`;
      if (!isRecord(asset)) {
        issue(base, "must be an object");
        continue;
      }
      if (typeof asset.id !== "string" || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(asset.id)) {
        issue(`${base}.id`, "must be a stable lowercase dotted/kebab ID");
      } else if (assetIds.has(asset.id)) {
        issue(`${base}.id`, `duplicate asset ID ${asset.id}`);
      } else {
        assetIds.add(asset.id);
      }

      const sheet = asset.sheet;
      if (!isRecord(sheet)) {
        issue(`${base}.sheet`, "must be an object");
        continue;
      }
      for (const field of ["width", "height", "frameWidth", "frameHeight", "frameCount"]) {
        if (!Number.isInteger(sheet[field]) || sheet[field] <= 0) {
          issue(`${base}.sheet.${field}`, "must be a positive integer");
        }
      }
      if (
        Number.isInteger(sheet.width) &&
        Number.isInteger(sheet.height) &&
        Number.isInteger(sheet.frameWidth) &&
        Number.isInteger(sheet.frameHeight) &&
        (sheet.frameWidth > sheet.width || sheet.frameHeight > sheet.height)
      ) {
        issue(`${base}.sheet`, "frame dimensions cannot exceed sheet dimensions");
      }

      const expectedDimensions = { width: sheet.width, height: sheet.height };
      for (const [fileIndex, file] of (Array.isArray(asset.sourceFiles)
        ? asset.sourceFiles
        : []
      ).entries()) {
        await validateFileRecord(file, `${base}.sourceFiles[${fileIndex}]`, expectedDimensions);
      }
      if (!Array.isArray(asset.sourceFiles) || asset.sourceFiles.length === 0) {
        issue(`${base}.sourceFiles`, "must contain at least one file");
      }
      for (const [fileIndex, file] of (Array.isArray(asset.runtimeFiles)
        ? asset.runtimeFiles
        : []
      ).entries()) {
        await validateFileRecord(file, `${base}.runtimeFiles[${fileIndex}]`, expectedDimensions);
      }
      if (!Array.isArray(asset.runtimeFiles) || asset.runtimeFiles.length === 0) {
        issue(`${base}.runtimeFiles`, "must contain at least one file");
      }

      if (
        !isRecord(asset.pivot) ||
        asset.pivot.x < 0 ||
        asset.pivot.x > 1 ||
        asset.pivot.y < 0 ||
        asset.pivot.y > 1
      ) {
        issue(`${base}.pivot`, "x and y must be normalized values from 0 through 1");
      }
      if (!Array.isArray(asset.frames) || asset.frames.length !== sheet.frameCount) {
        issue(`${base}.frames`, `must contain exactly frameCount (${sheet.frameCount}) entries`);
      } else {
        const frameNames = new Set();
        for (const [frameIndex, frame] of asset.frames.entries()) {
          if (!isRecord(frame) || typeof frame.name !== "string" || frameNames.has(frame.name)) {
            issue(`${base}.frames[${frameIndex}].name`, "must be a unique non-empty name");
          } else {
            frameNames.add(frame.name);
          }
          if (!isRecord(frame) || frame.index !== frameIndex) {
            issue(`${base}.frames[${frameIndex}].index`, `expected contiguous index ${frameIndex}`);
          }
        }
        for (const [animationIndex, animation] of (Array.isArray(asset.animations)
          ? asset.animations
          : []
        ).entries()) {
          if (!isRecord(animation) || !Array.isArray(animation.frameNames)) {
            issue(`${base}.animations[${animationIndex}]`, "must contain frameNames");
            continue;
          }
          for (const frameName of animation.frameNames) {
            if (!frameNames.has(frameName)) {
              issue(
                `${base}.animations[${animationIndex}].frameNames`,
                `unknown frame ${frameName}`,
              );
            }
          }
        }
      }

      if (
        typeof asset.licenseRecordId !== "string" ||
        !licenseRegister.includes(asset.licenseRecordId)
      ) {
        issue(
          `${base}.licenseRecordId`,
          "must reference a row in LICENSES/THIRD_PARTY_ASSET_REGISTER.csv",
        );
      }
    }
  }
}

if (issues.length > 0) {
  console.error(`Asset manifest validation failed with ${issues.length} issue(s):`);
  for (const value of issues) {
    console.error(`- ${value}`);
  }
  process.exit(1);
}

console.log(`Validated ${raw.assets.length} asset record(s) in ${manifestArgument}.`);
