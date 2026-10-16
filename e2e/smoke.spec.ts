import { expect, test } from "@playwright/test";

test("storefront home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ramforge/i);
  // The storefront navbar brand should be present on the landing page.
  await expect(page.getByRole("link", { name: /ramforge/i }).first()).toBeVisible();
});
