# Billetera Virtual y Pasarela de Pagos

Aplicacion full-stack de ejemplo: una billetera digital (cuentas, saldo,
transferencias entre usuarios, carga y retiro de fondos) y una pasarela de
pagos para que comercios cobren a sus clientes a traves de esa billetera.

Pensada como base solida para iterar hacia un MVP real: el motor de
billetera (ledger, transacciones atomicas) y la pasarela de pagos para
comercios son logica propia y funcionan de punta a punta; la carga de saldo
externa usa un proveedor de pagos plugable (mock por defecto, con soporte
real para MercadoPago Checkout Pro en modo sandbox).

## Stack

- **Backend:** Node.js + TypeScript + Express, `better-sqlite3` (SQLite,
  sin dependencias de infraestructura externa) con SQL directo (sin ORM,
  ver nota tecnica abajo).
- **Frontend:** React + TypeScript + Vite, React Router.
- **Autenticacion:** JWT (usuarios) + API keys (comercios, header
  `x-api-key`), al estilo Stripe/MercadoPago.

### Nota tecnica: por que no Prisma

Se empezo a construir con Prisma, pero el entorno de desarrollo usado para
armar este proyecto no tenia salida de red hacia `binaries.prisma.sh` (donde
Prisma descarga sus motores nativos), asi que `prisma generate` y `migrate`
fallaban. Se migro a `better-sqlite3` con SQL explicito y un pequeno
"repository layer" (`backend/src/repositories/`) que cumple el mismo rol.
Si en tu entorno si tenes esa salida de red y preferis un ORM, migrar a
Prisma o Drizzle es sencillo: el esquema esta documentado 1:1 en
`backend/src/db.ts`.

## Estructura del proyecto

```
wallet-app/
  backend/     API REST (Express) + base de datos SQLite
  frontend/    App React (dashboard, transferencias, checkout)
  e2e/         Script de verificacion end-to-end en navegador (Playwright)
```

## Como correrlo

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # ya viene configurado para funcionar sin credenciales externas
npm run dev             # http://localhost:4000
```

La base de datos SQLite (`backend/dev.db`) se crea sola en el primer
arranque, no hace falta ninguna migracion manual.

Para probar que todo el flujo funciona sin abrir el navegador:

```bash
npm run smoke
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

El frontend proxea `/api` hacia `http://localhost:4000` (ver
`frontend/vite.config.ts`), asi que con ambos corriendo ya podes registrarte
y usar la app completa desde el navegador.

### 3. Prueba end-to-end en navegador (opcional)

Con el backend y el frontend corriendo:

```bash
cd e2e
npm install
npm run check
```

## Flujo principal

1. Un usuario se registra (`/register`) y automaticamente obtiene una
   cuenta de billetera con saldo $0.
2. Carga saldo (`/deposit`). Con el proveedor `MOCK` (por defecto) se
   simula la confirmacion del pago con un boton; con `MERCADOPAGO`
   configurado, se redirige al checkout real de MercadoPago en sandbox.
3. Puede transferir saldo a otro usuario por email (`/transfer`) o
   retirarlo (`/withdraw`).
4. Cualquier usuario puede activar una **cuenta de comercio**
   (`/merchant`), lo que le da credenciales de API (`apiKey`/`apiSecret`).
5. Desde el backend de ese comercio (simulado en la misma pantalla para
   la demo) se crea una **sesion de checkout** con
   `POST /api/merchants/checkout-sessions` (autenticado con `x-api-key`).
   Esto devuelve un `checkoutUrl` publico.
6. El cliente final abre ese `checkoutUrl`, inicia sesion en su billetera
   si hace falta, y confirma el pago. El monto se debita de su cuenta y se
   acredita en la cuenta del comercio de forma atomica.
7. El comercio recibe una notificacion webhook (`checkout_session.paid`)
   firmada con HMAC-SHA256 usando su `apiSecret`, para poder verificar que
   la notificacion es autentica.

## Arquitectura de datos

Todos los montos se guardan en **centavos** (enteros) para evitar errores
de redondeo con punto flotante; la API los expone como numeros decimales.

- `users` — credenciales y datos de perfil.
- `accounts` — una cuenta de billetera por usuario o por comercio
  (`type`: `USER` | `MERCHANT` | `SYSTEM`), con `balance_cents`.
- `transactions` — el libro mayor (ledger): cada movimiento de fondos
  (deposito, retiro, transferencia, pago) queda registrado con cuenta de
  origen/destino, monto y timestamp. Es el historial que ve el usuario y
  la fuente de verdad para auditoria.
- `merchants` — comercios, con `api_key`/`api_secret` (hash) y
  `webhook_url` opcional.
- `checkout_sessions` — "intents" de pago creados por un comercio
  (equivalente a un Payment Intent de Stripe o una preference de
  MercadoPago), con estado `PENDING` → `PAID` / `EXPIRED` / `CANCELLED`.
- `deposit_intents` / `payouts` — cargas y retiros de fondos, con
  referencia al proveedor externo usado.

Toda operacion que mueve dinero entre cuentas pasa por
`walletService.moveFunds()`, que hace debito + credito + registro de
`Transaction` dentro de una unica transaccion SQL atomica (o todo se
aplica, o no se aplica nada).

## Proveedor de pagos: MOCK vs MercadoPago real

Configurable con `PAYMENT_PROVIDER` en `backend/.env`:

- **`MOCK`** (default): no requiere credenciales. El deposito se confirma
  con un boton en la UI ("Simular confirmacion de pago"). Ideal para
  desarrollar y probar todo el flujo sin depender de servicios externos.
- **`MERCADOPAGO`**: usa el Checkout Pro de MercadoPago en modo sandbox.
  Necesitas:
  1. Una cuenta de developer en https://www.mercadopago.com.ar/developers/panel/app
     y un `MERCADOPAGO_ACCESS_TOKEN` de prueba.
  2. Una URL publica para el webhook (en desarrollo, algo como
     `ngrok http 4000` y despues `MERCADOPAGO_WEBHOOK_URL=https://xxxx.ngrok.app/api/webhooks/mercadopago`).
  3. Setear `PAYMENT_PROVIDER=MERCADOPAGO` en `.env` y reiniciar el backend.

El codigo de la integracion esta en
`backend/src/services/paymentProviders/mercadoPagoProvider.ts` y usa la
API REST de MercadoPago directamente (sin SDK adicional) para que sea facil
de leer y adaptar.

## Que falta para producción (importante)

Este proyecto es una base tecnica solida, pero para operar con dinero real
en Argentina hace falta bastante mas trabajo regulatorio y de seguridad que
no esta cubierto aca:

- **Registro como PSP ante el BCRA** (Proveedor de Servicios de Pago que
  ofrece Cuentas de Pago) antes de poder operar. Ver
  `legal/marco-regulatorio-fintech-argentina.md` en el proyecto de Claude
  asociado a esta conversacion para el detalle regulatorio completo
  (reguladores, requisitos, plazos, responsabilidad legal).
- **KYC/AML real:** verificacion de identidad, matriz de riesgo, oficial
  de cumplimiento, Reportes de Operaciones Sospechosas ante la UIF. Este
  prototipo no valida identidad de ningun tipo.
- **Retiros/payouts reales:** este demo marca los retiros como
  `COMPLETED` al instante sin mover dinero de verdad. Una integracion real
  requiere un proveedor de transferencias bancarias (CBU/alias) o la API
  de payouts de MercadoPago.
- **PCI-DSS** si en algun momento se procesan numeros de tarjeta
  directamente (con el proveedor MercadoPago actual no hace falta, porque
  la captura de la tarjeta ocurre en el checkout hosteado de MercadoPago).
- **Seguridad:** rate limiting, rotacion de secretos, 2FA, logs de
  auditoria, deteccion de fraude — nada de esto esta implementado.
- **Idempotencia de webhooks:** el webhook de MercadoPago deberia
  deduplicar por `payment.id` de forma mas robusta ante reintentos.

## Variables de entorno (backend)

Ver `backend/.env.example` para el detalle completo. Las relevantes:

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Ruta del archivo SQLite (default `file:./dev.db`) |
| `JWT_SECRET` | Secreto para firmar tokens de sesion |
| `PAYMENT_PROVIDER` | `MOCK` o `MERCADOPAGO` |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de sandbox de MercadoPago |
| `MERCADOPAGO_WEBHOOK_URL` | URL publica para recibir notificaciones |
| `FRONTEND_URL` | Usada para generar links de checkout y redirecciones |
