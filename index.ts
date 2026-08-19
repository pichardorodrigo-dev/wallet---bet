import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Wallet backend escuchando en http://localhost:${config.port}`);
  console.log(`Proveedor de pagos activo: ${config.paymentProvider}`);
});
