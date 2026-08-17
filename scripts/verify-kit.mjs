import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "START_HERE.md",
  "README.md",
  "PROJECT_CONFIG.md",
  "VALIDATION_REPORT.md",
  "docs/ARCHITECTURE.md",
  "docs/SCALE_MODEL.md",
  "docs/VERTICAL_SLICE.md",
  "docs/PERFORMANCE_BUDGETS.md",
  "prompts/00-master-bootstrap.md",
  ".cursor/hooks.json",
  ".cursor/hooks/format-edited.mjs",
  ".github/workflows/ci.yml",
  ".vscode/settings.json",
  "benchmarks/README.md",
  "benchmarks/result-template.json",
  "scripts/bootstrap.sh",
  "scripts/bootstrap.ps1",
  "apps/client/package.json",
  "packages/sim-core/package.json",
  "packages/battle-sim/package.json",
  "packages/game-data/package.json",
  "tools/assets/validate-manifest.mjs",
];
const issues = [];

for (const relative of required) {
  try {
    const metadata = await stat(path.join(root, relative));
    if (!metadata.isFile()) {
      issues.push(`${relative} is not a file`);
    }
  } catch {
    issues.push(`${relative} is missing`);
  }
}

const skillsRoot = path.join(root, ".cursor/skills");
let skillCount = 0;
for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }
  skillCount += 1;
  const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
  let source;
  try {
    source = await readFile(skillPath, "utf8");
  } catch {
    issues.push(`.cursor/skills/${entry.name}/SKILL.md is missing`);
    continue;
  }
  if (!source.startsWith("---\n")) {
    issues.push(`.cursor/skills/${entry.name}/SKILL.md lacks YAML frontmatter`);
  }
  if (!source.includes(`name: ${entry.name}\n`)) {
    issues.push(`.cursor/skills/${entry.name}/SKILL.md name does not match its directory`);
  }
  if (!/^description:\s+\S+/m.test(source)) {
    issues.push(`.cursor/skills/${entry.name}/SKILL.md lacks a description`);
  }
}
if (skillCount < 10) {
  issues.push(`expected at least 10 focused Cursor skills, found ${skillCount}`);
}

const agentsRoot = path.join(root, ".cursor/agents");
let agentCount = 0;
for (const entry of await readdir(agentsRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) {
    continue;
  }
  agentCount += 1;
  const name = entry.name.slice(0, -3);
  const source = await readFile(path.join(agentsRoot, entry.name), "utf8");
  if (!source.startsWith("---\n")) {
    issues.push(`.cursor/agents/${entry.name} lacks YAML frontmatter`);
  }
  if (!source.includes(`name: ${name}\n`)) {
    issues.push(`.cursor/agents/${entry.name} name does not match its filename`);
  }
  if (!/^description:\s+\S+/m.test(source)) {
    issues.push(`.cursor/agents/${entry.name} lacks a description`);
  }
}
if (agentCount !== 3) {
  issues.push(`expected exactly 3 focused custom subagents, found ${agentCount}`);
}

const rulesRoot = path.join(root, ".cursor/rules");
const ruleEntries = await readdir(rulesRoot, { withFileTypes: true });
const invalidRuleFiles = ruleEntries.filter(
  (entry) => entry.isFile() && !entry.name.endsWith(".mdc"),
);
for (const entry of invalidRuleFiles) {
  issues.push(`.cursor/rules/${entry.name} must use the .mdc extension`);
}

const jsonFiles = [
  "package.json",
  "apps/client/package.json",
  "packages/sim-core/package.json",
  "packages/battle-sim/package.json",
  "packages/game-data/package.json",
  ".cursor/hooks.json",
  ".vscode/extensions.json",
  ".vscode/settings.json",
  "art/asset-manifest.example.json",
  "benchmarks/result-template.json",
];
for (const relative of jsonFiles) {
  try {
    JSON.parse(await readFile(path.join(root, relative), "utf8"));
  } catch (error) {
    issues.push(
      `${relative} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (issues.length > 0) {
  console.error(`Kit verification failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  `Kit structure passed verification (${skillCount} skills, ${agentCount} custom subagents, ${jsonFiles.length} JSON files).`,
);
