import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Las contraseñas se guardan con scrypt (algoritmo de hash lento y con "sal"
// aleatoria, incluido en Node: no hace falta instalar nada).
// Formato guardado:  scrypt$<sal en hex (16 bytes)>$<hash en hex (64 bytes)>
const scryptAsync = promisify(scrypt);
const LARGO_SAL = 16;
const LARGO_HASH = 64;

export async function hashPassword(password) {
  const sal = randomBytes(LARGO_SAL);
  const hash = await scryptAsync(password, sal, LARGO_HASH);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export async function verificarPassword(password, guardado) {
  if (typeof password !== "string" || typeof guardado !== "string") return false;
  const [tipo, salHex, hashHex] = guardado.split("$");
  // un valor guardado con otro formato o dañado nunca debe validar (antes, un hash vacío comparaba "nada con nada")
  if (tipo !== "scrypt" || !/^[0-9a-f]+$/i.test(salHex ?? "") || !/^[0-9a-f]+$/i.test(hashHex ?? "")) return false;
  const sal = Buffer.from(salHex, "hex");
  const esperado = Buffer.from(hashHex, "hex");
  if (sal.length !== LARGO_SAL || esperado.length !== LARGO_HASH) return false;
  const calculado = await scryptAsync(password, sal, LARGO_HASH);
  return timingSafeEqual(calculado, esperado);
}
