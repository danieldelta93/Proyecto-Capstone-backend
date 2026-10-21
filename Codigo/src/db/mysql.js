import mysql from "mysql2/promise";

// Conexión a MySQL. Entrega una interfaz mínima que usan todos los servicios:
//   db.query(sql, params)        -> filas (SELECT)
//   db.execute(sql, params)      -> { insertId, affectedRows } (INSERT/UPDATE/DELETE)
//   db.transaction(async tx => ...)  -> ejecuta varias operaciones juntas: o se
//                                       guardan todas o no se guarda ninguna.
export function crearDbMysql(config) {
  const pool = mysql.createPool({
    host: config.bd.host,
    port: config.bd.puerto,
    user: config.bd.usuario,
    password: config.bd.password,
    database: config.bd.nombre,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
    decimalNumbers: true, // SUM() devuelve número, no texto
    dateStrings: true, // las fechas llegan como "AAAA-MM-DD"
  });

  const envolver = (conexion) => ({
    async query(sql, params = []) {
      const [filas] = await conexion.query(sql, params);
      return filas;
    },
    async execute(sql, params = []) {
      const [r] = await conexion.query(sql, params);
      return { insertId: r.insertId, affectedRows: r.affectedRows };
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
          /* la conexión ya se perdió: no hay nada más que deshacer */
        }
        throw error;
      } finally {
        conexion.release();
      }
    },
    cerrar: () => pool.end(),
  };
}
