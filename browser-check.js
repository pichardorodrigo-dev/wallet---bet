// Prueba end-to-end real en navegador (Playwright + Chromium) contra los
// servidores de desarrollo levantados en :4000 (backend) y :5173 (frontend).
const { chromium } = require("playwright");

function ok(cond, msg) {
  if (!cond) throw new Error(`FALLO: ${msg}`);
  console.log(`OK: ${msg}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium/chrome-linux/chrome",
  }).catch(async () => chromium.launch());

  const stamp = Date.now();
  const aliceEmail = `alice_ui_${stamp}@test.com`;
  const bobEmail = `bob_ui_${stamp}@test.com`;

  // --- Alice: registro, deposito, transferencia ---
  const alice = await browser.newContext();
  const alicePage = await alice.newPage();
  await alicePage.goto("http://localhost:5173/register");
  await alicePage.getByLabel("Nombre completo").fill("Alice UI");
  await alicePage.getByLabel("Email").fill(aliceEmail);
  await alicePage.getByLabel("Contrasena").fill("secreto123");
  await alicePage.getByRole("button", { name: "Crear cuenta" }).click();
  await alicePage.waitForURL("**/");
  ok(await alicePage.getByRole("heading", { name: "Inicio" }).isVisible(), "Alice: registro exitoso, llega al dashboard");

  // Deposito
  await alicePage.getByRole("link", { name: "Cargar saldo" }).click();
  await alicePage.getByLabel("Monto a cargar").fill("1000");
  await alicePage.getByRole("button", { name: "Cargar saldo" }).click();
  await alicePage.getByRole("button", { name: "Simular confirmacion de pago" }).click();
  await alicePage.waitForSelector("text=Se acreditaron");
  ok(true, "Alice: deposito de 1000 confirmado");

  // --- Bob: registro y alta de comercio ---
  const bob = await browser.newContext();
  const bobPage = await bob.newPage();
  await bobPage.goto("http://localhost:5173/register");
  await bobPage.getByLabel("Nombre completo").fill("Bob UI");
  await bobPage.getByLabel("Email").fill(bobEmail);
  await bobPage.getByLabel("Contrasena").fill("secreto123");
  await bobPage.getByRole("button", { name: "Crear cuenta" }).click();
  await bobPage.waitForURL("**/");
  ok(true, "Bob: registro exitoso");

  await bobPage.getByRole("link", { name: "Cuenta de comercio" }).click();
  await bobPage.getByLabel("Nombre del comercio").fill("Tienda de Bob UI");
  await bobPage.getByRole("button", { name: "Activar cuenta de comercio" }).click();
  await bobPage.waitForSelector("text=Guarda tu API secret");
  ok(true, "Bob: cuenta de comercio activada");

  await bobPage.getByLabel("Monto").fill("150");
  await bobPage.getByRole("button", { name: "Crear sesion de checkout de prueba" }).click();
  await bobPage.waitForSelector("text=Sesion creada");
  const checkoutLink = await bobPage.locator('a[href*="/checkout/"]').first().getAttribute("href");
  ok(!!checkoutLink, `Bob: sesion de checkout creada (${checkoutLink})`);

  // --- Alice paga el checkout de Bob ---
  await alicePage.goto(checkoutLink.startsWith("http") ? checkoutLink : `http://localhost:5173${checkoutLink}`);
  await alicePage.waitForSelector("text=Tienda de Bob UI");
  await alicePage.getByRole("button", { name: /Pagar/ }).click();
  await alicePage.waitForSelector("text=Pago confirmado");
  ok(true, "Alice: pago del checkout de Bob confirmado en la UI");

  // Verifico saldo final de Alice en el dashboard
  await alicePage.goto("http://localhost:5173/");
  await alicePage.waitForSelector("text=Saldo disponible");
  const balanceText = await alicePage.locator(".balance-amount").first().textContent();
  ok(balanceText?.includes("850"), `Alice: saldo final refleja el pago (1000 - 150 = 850) (mostro: ${balanceText})`);

  await browser.close();
  console.log("\nTodas las verificaciones de UI pasaron correctamente.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
