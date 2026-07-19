import { test, expect } from "@playwright/test";

test("el CTA de la demo pide email y redirige con token a aureo-demo", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.route("**/api/demo-token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, token: "fake-token-123" }),
    })
  );
  // Evita una navegación real fuera del entorno de test: intercepta la URL
  // de aureo-demo y la sirve localmente en vez de golpear la red real.
  await page.route("**/aureo-demo-six.vercel.app/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>demo</body></html>" })
  );

  await page.goto("/");
  await page.getByRole("button", { name: /explora la demo tú mismo/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await dialog.getByRole("button", { name: /entrar a la demo/i }).click();

  await page.waitForURL(/aureo-demo-six\.vercel\.app\/login\.html\?token=fake-token-123/);
});

test("?demo=expired abre el gate automáticamente con el mensaje de expiración", async ({ page }) => {
  await page.goto("/?demo=expired");
  await expect(page.getByRole("dialog")).toContainText(/tu sesión de demo expiró/i);
});
