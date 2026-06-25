import { test, expect } from "@playwright/test";

test("usuario se une a la waitlist desde el hero", async ({ page }) => {
  // Interceptar la API para no tocar Supabase
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );

  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await hero.getByRole("button", { name: /unirme/i }).click();

  await expect(page.getByRole("status")).toContainText(/te avisaremos/i);
});

test("muestra error con email inválido devuelto por la API", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Ingresa un correo válido." }) })
  );
  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("x@y.com");
  await hero.getByRole("button", { name: /unirme/i }).click();
  // Scope to #waitlist to avoid conflict with Next.js route announcer (role="alert")
  await expect(hero.getByRole("alert")).toContainText(/correo válido/i);
});
