// Crea la base de datos de Vendix y sus tablas a partir de database/schema.sql.
//
//   npm run db:init                  crea la base y las tablas (si aún no existen)
//   npm run db:init -- --reiniciar   BORRA todas las tablas y las vuelve a crear (se pierden los datos)
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import { cargarConfig } from "../src/config.js";

const config = cargarConfig();
const nombre = config.bd.nombre;
if (!/^[A-Za-z0-9_]+$/.test(nombre)) {
  console.error("DB_NAME solo puede tener letras, números y guion bajo.");
  process.exit(1);
}
const reiniciar = process.argv.includes("--reiniciar");

const schema = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "database", "schema.sql"), "utf8");
const sentencias = schema
  .replace(/--.*$/gm, "") // quita los comentarios
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

let conexion;
try {
  conexion = await mysql.createConnection({
    host: config.bd.host,
    port: config.bd.puerto,
    user: config.bd.usuario,
    password: config.bd.password,
    charset: "utf8mb4",
  });
} catch (error) {
  console.error(`No pude conectarme a MySQL en ${config.bd.host}:${config.bd.puerto} (${error.message}).`);
  console.error("Revisa que MySQL esté encendido y que DB_USER y DB_PASSWORD del archivo .env sean correctos.");
  process.exit(1);
}

try {
  await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conexion.query(`USE \`${nombre}\``);

  const [existe] = await conexion.query("SHOW TABLES LIKE 'usuarios'");
  if (existe.length && !reiniciar) {
    console.log(`La base "${nombre}" ya tiene las tablas de Vendix. No hice cambios.`);
    console.log('Si quieres borrarlas y empezar de cero: npm run db:init -- --reiniciar');
    process.exit(0);
  }
  if (reiniciar) {
    for (const t of ["movimientos_stock", "venta_items", "ventas", "productos", "categorias", "usuarios"]) {
      await conexion.query(`DROP TABLE IF EXISTS \`${t}\``);
    }
    console.log("Tablas anteriores borradas.");
  }
  for (const sentencia of sentencias) await conexion.query(sentencia);
  console.log(`Listo: base "${nombre}" creada con ${sentencias.filter((s) => /^CREATE TABLE/i.test(s)).length} tablas.`);
} catch (error) {
  console.error("Error al crear la base de datos:", error.message);
  process.exitCode = 1;
} finally {
  await conexion.end();
}
