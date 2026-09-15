import { test, expect } from "@playwright/test";

test("Nav CTAs llevan a /login y /registro", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("banner");
  await expect(nav.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  await expect(nav.getByRole("link", { name: "Empieza gratis" })).toHaveAttribute("href", "/registro");
});

test("Hero CTA lleva a /registro", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Empieza tu prueba gratis" })).toHaveAttribute("href", "/registro");
});

test("cada tarjeta de precio lleva a /registro con su plan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Iniciar prueba gratis" }).first().scrollIntoViewIfNeeded();
  const links = page.getByRole("link", { name: "Iniciar prueba gratis" });
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs.sort()).toEqual([
    "/registro?plan=logistica",
    "/registro?plan=pro",
    "/registro?plan=starter",
  ]);
});
