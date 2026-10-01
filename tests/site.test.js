import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
test("desktop, mobile, form success/error and admin rendering", async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const port = process.env.VITE_PORT || "65535";
    const baseURL = `http://127.0.0.1:${port}`;
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/index.php?route=content", (r) =>
      r.fulfill({ json: { content: {} } }),
    );
    await page.goto(baseURL);
    assert.equal(await page.locator(".service-card").count(), 6);
    for (const path of [
      "/services/",
      "/solutions/",
      "/process/",
      "/about/",
      "/contact/",
    ]) {
      const response = await page.goto(baseURL + path);
      assert.equal(response.ok(), true);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
    await page.goto(baseURL + "/about/");
    const teamImages = page.locator(".leader-image img");
    assert.equal(await teamImages.count(), 6);
    for (const image of await teamImages.all()) {
      await image.scrollIntoViewIfNeeded();
      assert.equal(await image.isVisible(), true);
      await image.evaluate((element) => element.decode());
      assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
    }
    await page.goto(baseURL);
    await page.screenshot({ path: "/tmp/bobok-desktop.png", fullPage: true });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator("summary").first().click();
    assert.equal(
      await page.locator("details").first().getAttribute("open"),
      "",
    );
    await page.locator("[name=name]").fill("Test Client");
    await page.locator("[name=email]").fill("test@example.com");
    await page.locator("[name=service]").selectOption("Web Application");
    await page
      .locator("[name=message]")
      .fill("Build a custom dashboard for our operations.");
    await page.locator("[name=consent]").check();
    await page.route("**/api/index.php?route=inquiries", (r) =>
      r.fulfill({ status: 503, json: { error: "ระบบยังไม่พร้อมใช้งาน" } }),
    );
    await page.locator('#contact-form button[type="submit"]').click();
    await page.waitForFunction(() =>
      document
        .querySelector("#form-status")
        .textContent.includes("ยังไม่พร้อม"),
    );
    assert.equal(await page.locator("[name=name]").inputValue(), "Test Client");
    await page.route("**/api/index.php?route=inquiries", (r) =>
      r.fulfill({ status: 201, json: { ok: true } }),
    );
    await page.locator('#contact-form button[type="submit"]').click();
    await page.waitForFunction(() =>
      document.querySelector("#form-status").textContent.includes("เรียบร้อย"),
    );
    assert.equal(await page.locator("[name=name]").inputValue(), "");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator(".menu-toggle").click();
    assert.equal(await page.locator("nav").isVisible(), true);
    await page.locator("nav a").first().click();
    assert.equal(
      await page.locator(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await page.screenshot({ path: "/tmp/bobok-mobile.png", fullPage: true });
    await page.route("**/api/index.php?route=session", (r) =>
      r.fulfill({ json: { authenticated: false, csrf: "test" } }),
    );
    await page.goto(`${baseURL}/admin/`);
    assert.equal(await page.locator("#login-panel").isVisible(), true);
    let loginBody;
    await page.route("**/api/index.php?route=login", async (route) => {
      loginBody = JSON.parse(route.request().postData());
      await route.fulfill({ json: { csrf: "next-token" } });
    });
    await page.route("**/api/index.php?route=admin/inquiries&page=1", (route) =>
      route.fulfill({ json: { total: 0, items: [] } }),
    );
    await page.locator('#login [name="email"]').fill("admin@example.com");
    await page.locator('#login [name="password"]').fill("test-password-123");
    await page.locator('#login button').click();
    await page.locator("#dashboard").waitFor({ state: "visible" });
    assert.deepEqual(loginBody, {
      email: "admin@example.com",
      password: "test-password-123",
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
