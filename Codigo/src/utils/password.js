import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Las contraseñas se guardan con scrypt (algoritmo de hash lento y con "sal"
// aleatoria, incluido en Node: no hace falta instalar nada).
const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(password, sal, 64);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export async function verificarPassword(password, guardado) {
  const [tipo, salHex, hashHex] = String(guardado).split("$");
  if (tipo !== "scrypt" || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scryptAsync(password, Buffer.from(salHex, "hex"), esperado.length);
  return timingSafeEqual(calculado, esperado);
}
