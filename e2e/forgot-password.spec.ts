import { test, expect } from "@playwright/test";

test("usuario pide un enlace de recuperación", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "Si el correo existe, te enviamos un enlace." }),
    })
  );

  await page.goto("/forgot-password");
  await page.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await page.getByRole("button", { name: /enviar enlace/i }).click();

  await expect(page.getByRole("status")).toContainText(/revisa tu correo/i);
});
