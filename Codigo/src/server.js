import "dotenv/config";
import { cargarConfig, validarConfig } from "./config.js";
import { crearDbMysql } from "./db/mysql.js";
import { crearApp } from "./app.js";

const config = cargarConfig();
validarConfig(config);

const db = crearDbMysql(config);
const app = crearApp({ db, config });

const servidor = app.listen(config.puerto, () => {
  console.log(`Vendix API lista en http://localhost:${config.puerto}/api  (base de datos: ${config.bd.nombre})`);
});

// Cierre ordenado (Ctrl+C)
const cerrar = () => {
  servidor.close(async () => {
    await db.cerrar();
    process.exit(0);
  });
};
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
