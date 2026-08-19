# Prueba end-to-end en navegador

Script de verificacion manual que ejercita el flujo completo en un navegador
real (Playwright): registro de dos usuarios, deposito simulado, alta de
cuenta de comercio, creacion de una sesion de checkout y pago desde la
billetera del pagador.

## Uso

1. Instala dependencias: `npm install` (dentro de esta carpeta) y luego
   `npx playwright install chromium` si no tenes Chromium de Playwright
   instalado.
2. Levanta el backend (`cd ../backend && npm run dev`) y el frontend
   (`cd ../frontend && npm run dev`) en paralelo.
3. Corre `npm run check` desde esta carpeta.

Si todo esta bien vas a ver una lista de "OK: ..." y el mensaje final
"Todas las verificaciones de UI pasaron correctamente."
