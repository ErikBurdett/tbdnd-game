import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.indexedDB.deleteDatabase("ancient-world-strategy");
  });
});

test("Aurelian can enter without a password and resume the Consular War as Rome", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /govern a people/i })).toBeVisible();
  await page.getByTestId("enter-aurelian").click();

  await expect(page.getByRole("heading", { name: "Consular War" })).toBeVisible();
  await expect(page.getByTestId("turn-readout")).toContainText("Turn 23");
  await expect(page.getByTestId("army-army.rome.field")).toBeVisible();
  await expect(page.getByTestId("province-province.latium")).toHaveAttribute(
    "data-owner",
    "faction.rome",
  );
  await expect(page.locator("[data-testid^='army-army.levy.']")).toHaveCount(1);
  await expect(page.getByTestId("treasury-readout")).toBeVisible();
  await expect(page.getByTestId("province-count")).toContainText("on the earth");
  await expect(page.getByTestId("faction-faction.rome")).toContainText("you");
  await expect(page.getByTestId("faction-list")).toContainText("Han");
  await expect(page.getByTestId("faction-list")).toContainText("Parthia");
  await expect(page.getByTestId("faction-list")).toContainText("Dacia");
  await expect(page.getByTestId("faction-list")).toContainText("Maya");
});
