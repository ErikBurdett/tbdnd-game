import { describe, expect, it, vi } from "vitest";
import { loadNewsFeed, parseChangelogMarkdown, parseNewsFile } from "../news";

const fallback = {
  updatedAt: "2026-08-17",
  items: [
    {
      id: "local-1",
      title: "Local note",
      date: "2026-08-17",
      tag: "Update",
      summary: "Packaged dispatch",
      body: ["Kept offline."],
    },
  ],
};

describe("launcher news", () => {
  it("parses changelog headings into patch cards", () => {
    const items = parseChangelogMarkdown(`# Changelog

## 0.1.0 — 2026-08-16

- First kit.
- Worker scaffold.

## Next

- Not a bullet
`);
    expect(items[0]).toMatchObject({
      title: "0.1.0 — 2026-08-16",
      date: "2026-08-16",
      summary: "First kit.",
    });
    expect(items[0]?.body).toEqual(["First kit.", "Worker scaffold."]);
  });

  it("ignores malformed news file entries", () => {
    expect(parseNewsFile({ items: [{ title: "no id" }, { id: "ok", title: "Ok" }] })).toEqual([
      {
        id: "ok",
        title: "Ok",
        date: "",
        tag: "Dispatch",
        summary: "Ok",
        body: [],
      },
    ]);
  });

  it("uses packaged notes when no GitHub repo is configured", async () => {
    const feed = await loadNewsFeed(fallback, vi.fn(), { repo: "" });
    expect(feed.source).toBe("local");
    expect(feed.items[0]?.id).toBe("local-1");
    expect(feed.notice).toContain("main branch is published");
  });

  it("reads production news.json from GitHub main", async () => {
    const fetchImpl = vi.fn(async () =>
      Promise.resolve({
        ok: true,
        json: async () =>
          Promise.resolve({
            updatedAt: "2026-08-18",
            items: [{ id: "gh-1", title: "From main", summary: "Published" }],
          }),
      }),
    ) as unknown as typeof fetch;

    const feed = await loadNewsFeed(fallback, fetchImpl, {
      repo: "owner/tbdnd-game",
      branch: "main",
    });
    expect(feed.source).toBe("github-main");
    expect(feed.items[0]?.title).toBe("From main");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/owner/tbdnd-game/main/content/launcher/news.json",
      { headers: { Accept: "application/json" } },
    );
  });

  it("falls back locally when GitHub is unreachable", async () => {
    const fetchImpl = vi.fn(async () =>
      Promise.reject(new Error("offline")),
    ) as unknown as typeof fetch;
    const feed = await loadNewsFeed(fallback, fetchImpl, { repo: "owner/tbdnd-game" });
    expect(feed.source).toBe("local");
    expect(feed.notice).toContain("owner/tbdnd-game@main");
  });
});
