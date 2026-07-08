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

test("captures ?ref= and shows a shareable link after signup", async ({ page }) => {
  let capturedBody: Record<string, unknown> | null = null;

  await page.route("**/api/waitlist", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      capturedBody = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, token: "11111111-2222-3333-4444-555555555555" }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
  });

  await page.goto("/?ref=abc123");
  await page.locator("#waitlist input[type=email]").fill("referido@example.com");
  await page.locator("#waitlist button[type=submit]").click();

  await expect(page.getByRole("status").first()).toContainText(/cuéntanos un poco más/i);
  expect((capturedBody as { origen?: string } | null)?.origen).toBe("hero:ref:abc123");

  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page.getByRole("status").first()).toContainText("Te avisaremos apenas lancemos");
  await expect(page.getByLabel("Tu link de invitación")).toHaveValue(
    /ref=11111111-2222-3333-4444-555555555555$/
  );
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
