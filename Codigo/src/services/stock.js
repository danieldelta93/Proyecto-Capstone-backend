import { conflicto, noEncontrado } from "../utils/errores.js";

// Cambia el stock de un producto y deja el movimiento anotado en el historial.
// delta > 0 entra mercadería; delta < 0 sale. Nunca deja el stock bajo 0:
// la condición "stock + delta >= 0" va dentro del mismo UPDATE, así dos ventas
// al mismo tiempo no pueden vender más de lo que hay.
// Debe llamarse dentro de una transacción (tx).
export async function cambiarStock(tx, { usuarioId, productoId, delta, tipo, ventaId = null, nota = null }) {
  const r = await tx.execute(
    `UPDATE productos
        SET stock = stock + ?, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = ? AND usuario_id = ? AND stock + ? >= 0`,
    [delta, productoId, usuarioId, delta]
  );
  if (r.affectedRows !== 1) {
    const [p] = await tx.query("SELECT nombre, stock FROM productos WHERE id = ? AND usuario_id = ?", [productoId, usuarioId]);
    if (!p) throw noEncontrado("Producto no encontrado");
    throw conflicto(
      "STOCK_INSUFICIENTE",
      `Stock insuficiente de "${p.nombre}": quedan ${p.stock} y se necesitan ${-delta}`,
      { productoId, disponible: Number(p.stock), solicitado: -delta }
    );
  }
  const [fila] = await tx.query("SELECT stock FROM productos WHERE id = ?", [productoId]);
  await tx.execute(
    `INSERT INTO movimientos_stock (usuario_id, producto_id, tipo, cantidad, stock_resultante, venta_id, nota)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, productoId, tipo, delta, Number(fila.stock), ventaId, nota]
  );
}
