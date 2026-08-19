/* Smoke test end-to-end: levanta la app en memoria (supertest-like via fetch
 * a un servidor real en un puerto de prueba) y ejercita el flujo completo:
 * registro de dos usuarios, deposito mock, transferencia entre ellos,
 * alta de comercio, checkout session y pago. Sirve como verificacion rapida
 * de que el backend funciona de punta a punta. Correr con `npm run smoke`.
 */
import { createApp } from "./app";

const PORT = 4099;
const BASE = `http://localhost:${PORT}/api`;

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FALLO: ${msg}`);
  console.log(`OK: ${msg}`);
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no-JSON (${res.status}): ${text}`);
  }
}

async function main() {
  const app = createApp();
  const server = app.listen(PORT);

  try {
    // 1. Registro de dos usuarios
    const email1 = `alice_${Date.now()}@test.com`;
    const email2 = `bob_${Date.now()}@test.com`;

    const r1 = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email1, password: "secreto123", fullName: "Alice Test" }),
    });
    const d1 = await json(r1);
    assert(r1.status === 201, `registro usuario 1 -> 201 (fue ${r1.status})`);
    const token1 = d1.token;

    const r2 = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email2, password: "secreto123", fullName: "Bob Test" }),
    });
    const d2 = await json(r2);
    assert(r2.status === 201, `registro usuario 2 -> 201 (fue ${r2.status})`);
    const token2 = d2.token;

    // 2. Alice deposita 1000 (proveedor MOCK) y confirma
    const dep = await fetch(`${BASE}/deposits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ amount: 1000 }),
    });
    const depData = await json(dep);
    assert(dep.status === 201, `crear deposito -> 201 (fue ${dep.status})`);

    const confirm = await fetch(`${BASE}/deposits/${depData.id}/simulate-confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(confirm.status === 200, `confirmar deposito -> 200 (fue ${confirm.status})`);

    const meAfterDeposit = await json(
      await fetch(`${BASE}/wallet/me`, { headers: { Authorization: `Bearer ${token1}` } })
    );
    assert(meAfterDeposit.account.balance === 1000, `saldo de Alice tras deposito = 1000 (fue ${meAfterDeposit.account.balance})`);

    // 3. Alice transfiere 300 a Bob
    const transfer = await fetch(`${BASE}/transfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ toEmail: email2, amount: 300 }),
    });
    assert(transfer.status === 201, `transferencia -> 201 (fue ${transfer.status})`);

    const aliceBalance = await json(
      await fetch(`${BASE}/wallet/me`, { headers: { Authorization: `Bearer ${token1}` } })
    );
    const bobBalance = await json(
      await fetch(`${BASE}/wallet/me`, { headers: { Authorization: `Bearer ${token2}` } })
    );
    assert(aliceBalance.account.balance === 700, `saldo de Alice tras transferencia = 700 (fue ${aliceBalance.account.balance})`);
    assert(bobBalance.account.balance === 300, `saldo de Bob tras transferencia = 300 (fue ${bobBalance.account.balance})`);

    // 4. Bob se registra como comercio y crea una sesion de checkout
    const merchantReg = await fetch(`${BASE}/merchants/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ name: "Tienda de Bob" }),
    });
    const merchantData = await json(merchantReg);
    assert(merchantReg.status === 201, `registro de comercio -> 201 (fue ${merchantReg.status})`);

    const sessionRes = await fetch(`${BASE}/merchants/checkout-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": merchantData.apiKey },
      body: JSON.stringify({ amount: 150, description: "Compra de prueba" }),
    });
    const sessionData = await json(sessionRes);
    assert(sessionRes.status === 201, `crear checkout session -> 201 (fue ${sessionRes.status})`);

    // 5. Alice paga la sesion de checkout con su billetera
    const pay = await fetch(`${BASE}/checkout-sessions/${sessionData.id}/pay`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(pay.status === 200, `pagar checkout session -> 200 (fue ${pay.status})`);

    const aliceFinal = await json(
      await fetch(`${BASE}/wallet/me`, { headers: { Authorization: `Bearer ${token1}` } })
    );
    const merchantFinal = await json(
      await fetch(`${BASE}/merchants/me`, { headers: { Authorization: `Bearer ${token2}` } })
    );
    assert(aliceFinal.account.balance === 550, `saldo final de Alice = 550 (fue ${aliceFinal.account.balance})`);
    assert(merchantFinal.balance === 150, `saldo final del comercio = 150 (fue ${merchantFinal.balance})`);

    console.log("\nTodos los checks pasaron correctamente.");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
