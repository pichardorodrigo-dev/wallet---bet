import { nanoid } from "nanoid";

// Genera IDs legibles con prefijo por tipo de entidad (mismo estilo que usan
// Stripe/MercadoPago: "usr_...", "acc_...", etc.) para que sean faciles de
// identificar en logs y en la base de datos.
export function createId(prefix: string): string {
  return `${prefix}_${nanoid(20)}`;
}
