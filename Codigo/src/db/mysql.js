
import mysql from "mysql2/promise";
import fs from "node:fs";

export function crearDbMysql(config) {
  const ssl = config.bd.ssl
    ? {
        ca: fs.readFileSync(config.bd.sslCa),
        minVersion: "TLSv1.2",
      }
    : undefined;

  const pool = mysql.createPool({
    host: config.bd.host,
    port: config.bd.puerto,
    user: config.bd.usuario,
    password: config.bd.password,
    database: config.bd.nombre,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
    decimalNumbers: true,
    dateStrings: true,
    ...(ssl ? { ssl } : {}),
  });

  const envolver = (conexion) => ({
    async query(sql, params = []) {
      const [filas] = await conexion.query(sql, params);
      return filas;
    },
    async execute(sql, params = []) {
      const [r] = await conexion.query(sql, params);
      return {
        insertId: r.insertId,
        affectedRows: r.affectedRows,
      };
    },
  });

  return {
    ...envolver(pool),

    async transaction(fn) {
      const conexion = await pool.getConnection();

      try {
        await conexion.beginTransaction();
        const resultado = await fn(envolver(conexion));
        await conexion.commit();
        return resultado;
      } catch (error) {
        try {
          await conexion.rollback();
        } catch {
          // La conexión ya se perdió.
        }
        throw error;
      } finally {
        conexion.release();
      }
    },

    cerrar: () => pool.end(),
  };
}
