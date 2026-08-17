import { expect, type Page, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.indexedDB.deleteDatabase("ancient-world-strategy");
  });
});

async function playDemo(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /govern a people/i })).toBeVisible();
  await expect(page.getByTestId("hall-meta")).toContainText("No sign-in required");
  await expect(page.getByTestId("faction-select").first()).toHaveValue("faction.rome");
  await page.getByTestId("play-demo-hero").click();
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("turn-readout")).toContainText("Turn 1");
  await expect(page.getByTestId("army-army.rome.field")).toBeVisible();
  await expect(page.getByTestId("province-province.latium")).toBeVisible();
  await expect(page.getByTestId("province-count")).toContainText("on the earth");
  await page.getByTestId("province-province.latium").click();
  await expect(page.getByTestId("settlement-title")).toContainText("Latium");
  await expect(page.getByTestId("build-storehouse")).toBeVisible();
  await expect(page.getByTestId("build-training-ground")).toBeVisible();
  await expect(page.getByTestId("build-civic-hall")).toBeVisible();
  await expect(page.getByTestId("research-status")).toContainText("Organized Logistics");
  await expect(page.getByTestId("research-composite-bow-doctrine")).toBeVisible();
  await expect(page.getByTestId("end-turn")).toBeVisible();
  await expect(page.getByTestId("recenter-map")).toBeVisible();
}

test("a new player can start a demo without signing in", async ({ page }) => {
  const started = Date.now();
  await playDemo(page);
  await expect(page.getByRole("heading", { name: "Earth Demo" })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(20_000);
});

test("a player can march from Latium, end a turn, and keep the demo", async ({ page }) => {
  const started = Date.now();
  await page.setViewportSize({ width: 1440, height: 900 });
  await playDemo(page);

  await page.getByTestId("army-army.rome.field").click();
  await expect(page.getByTestId("selection-title")).toHaveText("Rome field army");
  const destination = page.locator("[data-testid^='province-'][data-order]").first();
  await expect(destination).toBeVisible();
  const destinationName = (await destination.getAttribute("data-testid")) ?? "";
  await destination.click();
  await expect(page.getByTestId("queued-order")).toBeVisible();
  await expect(page.getByTestId("army-army.rome.field")).toContainText("Latium");
  expect(destinationName.startsWith("province-province.")).toBe(true);

  await page.getByTestId("end-turn").click();
  await expect(page.getByTestId("turn-readout")).toContainText("Turn 2");
  await expect(page.getByTestId("army-army.rome.field")).not.toContainText("Latium");
  await expect(page.getByTestId("province-province.latium")).toHaveAttribute(
    "data-owner",
    "faction.rome",
  );

  await page.getByRole("button", { name: "10K benchmark" }).click();
  await expect(page.locator(".telemetry-bar")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.getByTestId("army-army.rome.field")).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByTestId("keep-commander-name").fill("Playwright");
  await page.getByTestId("keep-campaign-title").fill("Map Sweep");
  await page.getByTestId("keep-campaign").click();
  await expect(page.getByText("Campaign kept")).toBeVisible();
  await page.getByTestId("return-to-hall").click();

  await expect(page.getByTestId("hall-meta")).toContainText("Signed in as Playwright");
  await expect(page.getByRole("button", { name: /Playwright/ })).toBeVisible();
  await expect(page.getByTestId("save-name")).toHaveText("Map Sweep");
  await expect(page.getByText(/Turn 2/)).toBeVisible();

  const elapsedMs = Date.now() - started;
  console.log(`PLAYTHROUGH_MS=${elapsedMs}`);
  expect(elapsedMs).toBeLessThan(90_000);
});
