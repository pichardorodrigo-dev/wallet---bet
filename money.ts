// Los montos viajan en la API como numero decimal (ej. 150.50) pero se
// guardan siempre en centavos (Int) en la base de datos para evitar
// errores de redondeo con punto flotante.

export function toCents(amount: number): number {
  if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
    throw new Error("Monto invalido");
  }
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}
