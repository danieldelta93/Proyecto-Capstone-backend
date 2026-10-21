import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Base de datos en memoria para las pruebas (usa SQLite, incluido en Node 22.13+).
// Toma el MISMO database/schema.sql que usa MySQL, cambiando solo dos cosas que SQLite
// escribe distinto: AUTO_INCREMENT y el final "ENGINE=InnoDB ...".
let DatabaseSync = null;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  /* esta versión de Node no trae SQLite: las pruebas se omiten */
}
export const sqliteDisponible = DatabaseSync !== null;

const RUTA_SCHEMA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "database", "schema.sql");

export function traducirSchema(sql) {
  return sql
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
    .replace(/\)\s*ENGINE=[^;]*;/g, ");");
}

const limpiar = (params) => params.map((p) => (p === undefined ? null : typeof p === "boolean" ? Number(p) : p));

export function crearDbPrueba() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(traducirSchema(readFileSync(RUTA_SCHEMA, "utf8")));

  const api = {
    async query(sql, params = []) {
      return sqlite.prepare(sql).all(...limpiar(params)).map((f) => ({ ...f }));
    },
    async execute(sql, params = []) {
      const r = sqlite.prepare(sql).run(...limpiar(params));
      return { insertId: Number(r.lastInsertRowid), affectedRows: Number(r.changes) };
    },
  };
  return {
    ...api,
    async transaction(fn) {
      sqlite.exec("BEGIN");
      try {
        const resultado = await fn(api);
        sqlite.exec("COMMIT");
        return resultado;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    cerrar: () => sqlite.close(),
  };
}
