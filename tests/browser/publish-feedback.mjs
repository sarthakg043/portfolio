// Isolated editor regression: no authentication or real database writes.
// Run with: node tests/browser/publish-feedback.mjs
import { createServer, transformWithOxc } from "vite";
import { chromium, expect } from "@playwright/test";

const root = process.cwd();
const source = `
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { ArticleEditor } from '/components/admin/article-editor.tsx';
  import { ArticleUpdatedTag } from '/components/blog/article-updated-tag.tsx';
  createRoot(document.getElementById('root')).render(
    <>
      <ArticleEditor article={null} assets={[]} adminPathPrefix="/admin" blogBaseUrl={location.origin + '/blog/'} />
      <section aria-label="Fresh article"><ArticleUpdatedTag isEdited={false} updatedAt="2026-11-08T06:00:00Z" /></section>
      <section aria-label="Edited article"><ArticleUpdatedTag isEdited={true} updatedAt="2026-11-08T06:00:00Z" /></section>
    </>
  );
`;

const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  oxc: { jsx: { runtime: "automatic" } },
  server: { host: "127.0.0.1", port: 0 },
  plugins: [{
    name: "publish-feedback-fixture",
    enforce: "pre",
    configureServer(vite) {
      vite.middlewares.use((req, res, next) => {
        if (req.url === "/__publish") {
          res.setHeader("Content-Type", "text/html");
          res.end('<html><body><div id="root"></div><script type="module" src="/publish-fixture.tsx"></script></body></html>');
        } else if (req.url === "/blog/test-story") {
          res.end("Published story fixture");
        } else next();
      });
    },
    resolveId(id) {
      if (id === "/publish-fixture.tsx") return "\0publish-fixture.tsx";
      if (id === "next/navigation") return "\0fixture-router";
    },
    async load(id) {
      if (id === "\0publish-fixture.tsx") return (await transformWithOxc(source, "fixture.tsx", { lang: "tsx", jsx: { runtime: "automatic" } })).code;
      if (id === "\0fixture-router") return "export function useRouter(){return {replace(){},refresh(){}}}";
      if (id.endsWith("/app/site-admin/articles/actions.ts")) return `
        export async function saveArticleAction(input) {
          window.lastSaveInput = input;
          await new Promise(resolve => { window.finishPublish = resolve; });
          return window.failPublish
            ? { ok: false, error: 'The slug is already in use.' }
            : { ok: true, id: '11111111-1111-4111-8111-111111111111', publishedAt: '2026-11-08T05:00:00Z', updatedAt: '2026-11-08T05:00:00Z' };
        }
      `;
    },
  }],
});

let browser;
try {
  await server.listen();
  const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto(`${origin}/__publish`);
  await expect(page.getByRole("region", { name: "Fresh article" })).not.toContainText("Last updated on");
  await expect(page.getByRole("region", { name: "Edited article" })).toContainText("Last updated on");
  await expect(page.getByRole("region", { name: "Edited article" }).locator("time")).toHaveAttribute("datetime", "2026-11-08T06:00:00Z");
  await page.getByPlaceholder("Article title").fill("Test story");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(page.context().pages()).toHaveLength(1);

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const popupEvent = page.context().waitForEvent("page");
  await page.getByRole("button", { name: "Publish story", exact: true }).click();
  const popup = await popupEvent;
  await expect(page.getByRole("heading", { name: "Publishing your article…" })).toBeVisible();
  await expect(page.locator('form[aria-busy="true"]')).toHaveCount(1);
  await expect(page.locator("form button").filter({ hasText: "Publishing…" })).toBeDisabled();
  await page.waitForFunction(() => typeof window.finishPublish === "function");
  await page.evaluate(() => window.finishPublish());
  await expect(page.getByRole("heading", { name: "Article published", exact: true })).toBeVisible();
  await expect(page.locator('dl[aria-label="Article dates"]')).toContainText("Last updated");
  await expect(page.locator('dl[aria-label="Article dates"]')).toContainText("First published");
  await expect(page.locator('dl[aria-label="Article dates"] time')).toHaveCount(2);
  await expect(popup).toHaveURL(`${origin}/blog/test-story`);
  await expect(page.getByRole("link", { name: "Open published article" })).toHaveAttribute("href", `${origin}/blog/test-story`);
  await popup.close();
  await page.getByRole("button", { name: "Back to editor" }).click();

  await page.evaluate(() => { window.failPublish = true; window.finishPublish = undefined; });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish story", exact: true }).click();
  await page.waitForFunction(() => typeof window.finishPublish === "function");
  await page.evaluate(() => window.finishPublish());
  await expect(page.getByRole("heading", { name: "Publishing failed" })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("The slug is already in use.", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Article title")).toHaveValue("Test story");
  await expect.poll(() => page.context().pages().length).toBe(1);
  expect(await page.evaluate(() => window.lastSaveInput.id)).toBe("11111111-1111-4111-8111-111111111111");

  await page.getByRole("button", { name: "Back to editor" }).click();
  await page.evaluate(() => { window.open = () => null; window.failPublish = false; window.finishPublish = undefined; });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish story", exact: true }).click();
  await page.waitForFunction(() => typeof window.finishPublish === "function");
  await page.evaluate(() => window.finishPublish());
  await expect(page.getByRole("dialog")).toContainText("Your browser blocked the new tab");
  await expect(page.getByRole("link", { name: "Open published article" })).toBeVisible();
  console.log("PASS: publish feedback, article tab, failure recovery, blocked-popup fallback, editor timestamps, and edited-only public tags.");
} finally {
  await browser?.close();
  await server.close();
}
