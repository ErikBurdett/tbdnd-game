export interface NewsItem {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  body: string[];
}

export interface NewsFeed {
  source: "github-main" | "local";
  updatedAt: string;
  items: NewsItem[];
  notice?: string;
}

interface NewsFile {
  updatedAt?: string;
  items?: unknown;
}

const DEFAULT_GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO?.trim() ?? "";
const DEFAULT_GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH?.trim() || "main";

export interface NewsLoadOptions {
  repo?: string;
  branch?: string;
}

export function parseChangelogMarkdown(markdown: string): NewsItem[] {
  const blocks = markdown.split(/^## /m).slice(1);
  const items: NewsItem[] = [];
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const heading = lines[0];
    if (!heading) {
      continue;
    }
    const [titlePart, datePart] = heading.split("—").map((part) => part.trim());
    const body = lines
      .slice(1)
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim());
    items.push({
      id: slugify(titlePart ?? heading),
      title: heading,
      date: datePart ?? "",
      tag: "Patch",
      summary: body[0] ?? heading,
      body,
    });
  }
  return items;
}

export function parseNewsFile(value: unknown): NewsItem[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return [];
  }
  const items: NewsItem[] = [];
  for (const entry of value.items) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.title !== "string") {
      continue;
    }
    items.push({
      id: entry.id,
      title: entry.title,
      date: typeof entry.date === "string" ? entry.date : "",
      tag: typeof entry.tag === "string" ? entry.tag : "Dispatch",
      summary: typeof entry.summary === "string" ? entry.summary : entry.title,
      body: Array.isArray(entry.body)
        ? entry.body.filter((line): line is string => typeof line === "string")
        : [],
    });
  }
  return items;
}

export async function loadNewsFeed(
  fallback: NewsFile,
  fetchImpl: typeof fetch = fetch,
  options: NewsLoadOptions = {},
): Promise<NewsFeed> {
  const repo = options.repo ?? DEFAULT_GITHUB_REPO;
  const branch = options.branch ?? DEFAULT_GITHUB_BRANCH;
  if (repo.length === 0) {
    return localFeed(
      fallback,
      "GitHub production notes will appear here after the main branch is published. Showing the local dispatch desk.",
    );
  }

  const jsonUrl = rawGitHubUrl(repo, branch, "content/launcher/news.json");
  const changelogUrl = rawGitHubUrl(repo, branch, "CHANGELOG.md");

  try {
    const newsResponse = await fetchImpl(jsonUrl, { headers: { Accept: "application/json" } });
    if (newsResponse.ok) {
      const parsed: unknown = await newsResponse.json();
      const items = parseNewsFile(parsed);
      if (items.length > 0) {
        return {
          source: "github-main",
          updatedAt:
            isRecord(parsed) && typeof parsed.updatedAt === "string" ? parsed.updatedAt : today(),
          items,
        };
      }
    }
  } catch {
    // Fall through to changelog, then local.
  }

  try {
    const changelogResponse = await fetchImpl(changelogUrl, { headers: { Accept: "text/plain" } });
    if (changelogResponse.ok) {
      const items = parseChangelogMarkdown(await changelogResponse.text());
      if (items.length > 0) {
        return { source: "github-main", updatedAt: today(), items };
      }
    }
  } catch {
    // Use the packaged fallback.
  }

  return localFeed(
    fallback,
    `Could not read ${repo}@${branch}. Showing packaged notes until main is reachable.`,
  );
}

function localFeed(fallback: NewsFile, notice: string): NewsFeed {
  return {
    source: "local",
    updatedAt: typeof fallback.updatedAt === "string" ? fallback.updatedAt : today(),
    items: parseNewsFile(fallback),
    notice,
  };
}

function rawGitHubUrl(repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "note"
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
