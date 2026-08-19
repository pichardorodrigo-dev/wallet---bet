# Como publicar esta app online y conectar tu dominio .ar

Esta guia asume que no tenes experiencia tecnica previa. Vas a necesitar
unos 20-30 minutos y ninguna tarjeta de credito.

## Resumen de lo que vamos a hacer

1. Subir el codigo a GitHub (para que Render lo pueda leer).
2. Crear una cuenta gratis en Render y desplegar la app desde ahi.
3. Conectar tu dominio `.ar` al servicio que Render te crea.

## Paso 1: Subir el proyecto a GitHub

1. Entra a https://github.com y crea una cuenta gratis si no tenes una
   (con tu email).
2. Una vez logueado, arriba a la derecha toca el `+` y elegi
   **New repository**.
3. Ponele un nombre, por ejemplo `wallet-app`. Dejalo en **Public** o
   **Private** (cualquiera de las dos sirve para Render). No marques
   ninguna opcion de "Add README". Toca **Create repository**.
4. En la pantalla que te queda, buscá el link **"uploading an existing
   file"** (aparece en el bloque que dice *"...or push an existing
   repository"* / *quick setup*).
5. Arrastra ahi TODAS las carpetas y archivos que estan dentro del zip que
   te mande (backend/, frontend/, e2e/, legal/, README.md, DEPLOY.md,
   package.json, render.yaml, .gitignore) — **no arrastres el zip
   comprimido**, primero descomprimilo en tu computadora.
6. Abajo de la pagina toca **Commit changes**.

Listo, ya tenes el codigo en GitHub.

## Paso 2: Desplegar en Render

1. Entra a https://render.com y toca **Get Started** — podes crear la
   cuenta con tu cuenta de GitHub (un solo click, mas facil).
2. Una vez adentro, toca **New +** (arriba a la derecha) -> **Blueprint**.
3. Conecta tu cuenta de GitHub si te lo pide, y elegi el repositorio
   `wallet-app` que creaste en el paso 1.
4. Render va a detectar automaticamente el archivo `render.yaml` que ya
   esta en el proyecto y te va a mostrar el servicio que va a crear
   (`wallet-app`, plan **Free**). Toca **Apply** / **Create**.
5. Esperá unos minutos mientras Render instala todo y hace el primer
   build (lo podes ver en tiempo real en la pantalla de "Logs").
6. Cuando termine, arriba vas a ver una URL como
   `https://wallet-app-xxxx.onrender.com` — abrila y ya deberias ver la
   app funcionando, ¡en internet!

Nota: en el plan gratis, si nadie usa la app durante 15 minutos el
servicio "se duerme" y tarda como un minuto en volver a responder la
primera vez que alguien entra despues de eso. Es normal, no es un error.

## Paso 3: Conectar tu dominio .ar

1. En el dashboard de Render, entra al servicio `wallet-app` -> pestaña
   **Settings** -> seccion **Custom Domains** -> **Add Custom Domain**.
2. Escribi tu dominio (por ejemplo `tudominio.com.ar` o
   `www.tudominio.com.ar`) y confirma. Render te va a mostrar uno o dos
   registros DNS para agregar (algo como un `CNAME` apuntando a
   `wallet-app-xxxx.onrender.com`, o un registro `A`/`ALIAS` si es el
   dominio raiz sin `www`).
3. Anda al panel donde administras tu dominio `.ar` (si lo compraste
   directo en NIC Argentina, es https://nic.ar, seccion "Mis dominios" ->
   tu dominio -> DNS/Zona DNS; si lo compraste a traves de un revendedor,
   es el panel de ese revendedor).
4. Cargá ahi el/los registro(s) exactos que te mostro Render en el paso
   anterior (mismo tipo, mismo nombre, mismo valor).
5. Volve a Render: cuando el DNS se propaga (puede tardar desde minutos
   hasta un par de horas) el dominio va a aparecer como **Verified** y
   Render le agrega HTTPS automaticamente. Ahi ya podes entrar a tu app
   desde `https://tudominio.com.ar`.

## Cosas para tener en cuenta (importante)

- **La base de datos no es permanente en el plan gratis.** Este proyecto
  usa un archivo SQLite; en el plan Free de Render el disco no esta
  garantizado entre reinicios del servicio, asi que los usuarios/saldos
  que se creen podrian perderse en algun redeploy o reinicio. Para
  probar y mostrar la app esta perfecto. El dia que quieras usarla en
  serio con datos que no se pueden perder, avisame y migramos a una base
  de datos persistente (Render ofrece Postgres gratis por 30 dias, y
  planes pagos con disco persistente desde ~USD 7/mes).
- **El proveedor de pagos sigue en modo MOCK** (simulado) por defecto.
  Si mas adelante queres conectar MercadoPago de verdad, avisame y
  seguimos la seccion correspondiente del `README.md`.
- Si en algun paso Render o GitHub te piden algo que no entendes o te
  aparece un error, mandame una captura de pantalla y te digo exactamente
  que tocar.
