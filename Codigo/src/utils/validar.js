import { datosInvalidos } from "./errores.js";

const VACIO = (v) => v === undefined || v === null || v === "";

export function texto(valor, campo, { min = 1, max = 255, requerido = true } = {}) {
  if (VACIO(valor)) {
    if (requerido) throw datosInvalidos(`${campo} es obligatorio`);
    return null;
  }
  if (typeof valor !== "string") throw datosInvalidos(`${campo} debe ser texto`);
  const t = valor.trim();
  if (t.length < min) throw datosInvalidos(`${campo} es obligatorio`);
  if (t.length > max) throw datosInvalidos(`${campo} no puede tener más de ${max} caracteres`);
  return t;
}

export function entero(valor, campo, { min = 0, max = 2_000_000_000, requerido = true } = {}) {
  if (VACIO(valor)) {
    if (requerido) throw datosInvalidos(`${campo} es obligatorio`);
    return null;
  }
  const n = typeof valor === "string" ? Number(valor.trim()) : valor;
  if (typeof n !== "number" || !Number.isInteger(n)) throw datosInvalidos(`${campo} debe ser un número entero`);
  if (n < min || n > max) throw datosInvalidos(`${campo} debe estar entre ${min} y ${max}`);
  return n;
}

export function opcion(valor, campo, opciones, { requerido = true } = {}) {
  if (VACIO(valor)) {
    if (requerido) throw datosInvalidos(`${campo} es obligatorio`);
    return null;
  }
  if (!opciones.includes(valor)) throw datosInvalidos(`${campo} debe ser uno de: ${opciones.join(", ")}`);
  return valor;
}

// Fecha en formato AAAA-MM-DD
export function fechaISO(valor, campo, { requerido = true } = {}) {
  if (VACIO(valor)) {
    if (requerido) throw datosInvalidos(`${campo} es obligatorio`);
    return null;
  }
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw datosInvalidos(`${campo} debe tener el formato AAAA-MM-DD`);
  }
  const d = new Date(valor + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valor) {
    throw datosInvalidos(`${campo} no es una fecha válida`);
  }
  return valor;
}

export const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
