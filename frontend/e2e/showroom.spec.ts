import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function login(page: Page, role = "buyer") {
  await page.goto("/");
  await page.getByLabel("Email address").fill(`${role}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vehicle inventory" }),
  ).toBeVisible();
  await expect(page.locator(".vehicle-card")).toHaveCount(6);
}

test("registration, buyer permissions, purchase and sold-out controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Email address").fill("newbuyer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("NewPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vehicle inventory" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add vehicle" })).toHaveCount(
    0,
  );
  const camry = page
    .locator(".vehicle-card")
    .filter({ hasText: "Camry Hybrid" });
  await expect(camry).toContainText("4 in stock");
  await camry.getByRole("button", { name: "Purchase vehicle" }).click();
  await expect(camry).toContainText("3 in stock");
  await expect(page.getByRole("status")).toContainText("purchased");
  await expect(
    page.getByRole("button", { name: "Out of stock" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});

test("search, combined filters and empty state", async ({ page }) => {
  await login(page);
  await page.getByLabel("Make", { exact: true }).fill("toy");
  await page.getByLabel("Min price (₹)").fill("4800000");
  await page.getByLabel("Max price (₹)").fill("4800000");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await expect(page.locator(".vehicle-card")).toContainText("Camry Hybrid");
  await page.getByRole("button", { name: "Electric", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No vehicles found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(6);
});

test("admin adds, edits, restocks and deletes a vehicle", async ({ page }) => {
  await login(page, "admin");
  await page.getByRole("button", { name: "Add vehicle" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Make", { exact: true }).fill("Honda");
  await dialog.getByLabel("Model", { exact: true }).fill("City Test");
  await dialog.getByLabel("Price (₹)", { exact: true }).fill("1500000.50");
  await dialog.getByLabel("Initial quantity").fill("1");
  await dialog.getByRole("button", { name: "Save vehicle" }).click();
  const card = page.locator(".vehicle-card").filter({ hasText: "City Test" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Price (₹)", { exact: true }).fill("1600000.25");
  await dialog.getByRole("button", { name: "Save vehicle" }).click();
  await expect(card).toContainText("16,00,000.25");
  await card.getByRole("button", { name: "Restock", exact: true }).click();
  await dialog.getByLabel("Units to add").fill("2");
  await dialog.getByRole("button", { name: "Add stock" }).click();
  await expect(card).toContainText("3 in stock");
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Delete vehicle", exact: true })
    .click();
  await expect(card).toHaveCount(0);
});

test("invalid credentials show a useful error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("buyer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
});

test("expired sessions return to sign-in", async ({ page }) => {
  await login(page);
  await page.route("**/api/vehicles/search?*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"detail":"Invalid or expired token"}',
    }),
  );
  await page.getByRole("button", { name: "SUV", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("session expired");
});

test("capture desktop, mobile and login screenshots", async ({ page }) => {
  mkdirSync("../docs/screenshots", { recursive: true });
  await page.goto("/");
  await page.screenshot({
    path: "../docs/screenshots/login.png",
    fullPage: true,
  });
  await login(page, "admin");
  await page.screenshot({
    path: "../docs/screenshots/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "../docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Add vehicle" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
