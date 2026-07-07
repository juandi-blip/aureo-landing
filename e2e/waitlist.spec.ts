import { test, expect } from "@playwright/test";

test("usuario se une a la waitlist y completa su perfil", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );

  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await hero.getByRole("button", { name: /^unirme$/i }).click();

  await expect(hero.getByRole("status")).toContainText(/cuéntanos un poco más/i);

  await hero.getByLabel("Nombre").fill("Prueba Usuario");
  await hero.getByLabel("Tipo de negocio").selectOption("Ferretería");
  await hero.getByLabel("Ciudad").fill("Bogotá");
  await hero.getByRole("button", { name: /completar perfil/i }).click();

  await expect(hero.getByRole("status")).toContainText(/te avisaremos apenas lancemos/i);
});

test("usuario puede omitir el paso de detalle", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );

  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("prueba2@aureo.app");
  await hero.getByRole("button", { name: /^unirme$/i }).click();

  await expect(hero.getByRole("status")).toContainText(/cuéntanos un poco más/i);
  await hero.getByRole("button", { name: /ahora no/i }).click();

  await expect(hero.getByRole("status")).toContainText(/te avisaremos apenas lancemos/i);
});

test("muestra error con email inválido devuelto por la API", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Ingresa un correo válido." }) })
  );
  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("x@y.com");
  await hero.getByRole("button", { name: /^unirme$/i }).click();
  // Scope to #waitlist to avoid conflict with Next.js route announcer (role="alert")
  await expect(hero.getByRole("alert")).toContainText(/correo válido/i);
});
