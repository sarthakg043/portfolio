import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("portfolio renders all migrated project and writing data", async ({ page }) => {
  await page.goto("/portfolio/frontend");

  await expect(page.getByRole("heading", { name: "Sarthak Gupta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "bharatdns", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "status-update-mail-ai-agent", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "System Prompts and Prompting Types: Mastering AI's Hidden Playbook",
    })
  ).toBeVisible();
  await expect(page.locator('img[alt="Sarthak Gupta"]')).toHaveAttribute(
    "src",
    /supabase\.co\/storage\/v1\/object\/public\/portfolio-assets\//
  );
  await expect(page.locator('img[alt$="project preview"]')).toHaveCount(4);
});

test("portfolio stays within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portfolio/cyber");

  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("blog supports theme switching and has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("http://blog.localhost:3000/");

  await expect(
    page.getByRole("heading", { name: "Ideas are better when they are written down." })
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);

  const initialTheme = await page.locator("html").getAttribute("class");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect
    .poll(() => page.locator("html").getAttribute("class"))
    .not.toBe(initialTheme);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const seriousViolations = accessibility.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical"
  );
  expect(seriousViolations).toEqual([]);
});

test("admin redirects an unauthenticated visitor to GitHub login", async ({ page }) => {
  await page.goto("http://admin.localhost:3000/");

  await expect(page).toHaveURL("http://admin.localhost:3000/login");
  await expect(page.getByRole("heading", { name: "Author access" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
});
