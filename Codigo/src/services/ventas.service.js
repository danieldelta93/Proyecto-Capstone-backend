import { entero, opcion, fechaISO } from "../utils/validar.js";
import { datosInvalidos, noEncontrado, conflicto } from "../utils/errores.js";
import { cambiarStock } from "./stock.js";

const METODOS = ["Efectivo", "Transferencia", "Tarjeta"];

// Une las ventas con sus ítems y calcula invertido y ganancia.
// Si algún ítem no tiene precio de compra, invertido y ganancia quedan en null
// (no se inventa un valor).
async function armarVentas(q, filas) {
  if (!filas.length) return [];
  const ids = filas.map((f) => Number(f.id));
  const items = await q.query(
    `SELECT id, venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario
       FROM venta_items WHERE venta_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    ids
  );
  const porVenta = new Map();
  items.forEach((i) => {
    const lista = porVenta.get(Number(i.venta_id)) ?? [];
    lista.push({
      productoId: i.producto_id === null ? null : Number(i.producto_id),
      nombre: i.nombre_producto,
      cantidad: Number(i.cantidad),
      precioUnitario: Number(i.precio_unitario),
      costoUnitario: i.costo_unitario === null ? null : Number(i.costo_unitario),
      subtotal: Number(i.cantidad) * Number(i.precio_unitario),
    });
    porVenta.set(Number(i.venta_id), lista);
  });
  return filas.map((f) => {
    const lista = porVenta.get(Number(f.id)) ?? [];
    const completo = lista.length > 0 && lista.every((i) => i.costoUnitario !== null);
    const total = Number(f.total);
    const invertido = completo ? lista.reduce((a, i) => a + i.cantidad * i.costoUnitario, 0) : null;
    return {
      id: Number(f.id),
      fecha: f.fecha,
      total,
      metodoPago: f.metodo_pago,
      estado: f.estado,
      creadoEn: f.creado_en,
      items: lista,
      invertido,
      ganancia: invertido === null ? null : total - invertido,
    };
  });
}

const SELECT_VENTA = "SELECT id, fecha, total, metodo_pago, estado, creado_en FROM ventas";

export function crearVentasService(db, { hoy }) {
  async function obtener(q, usuarioId, id) {
    const filas = await q.query(`${SELECT_VENTA} WHERE id = ? AND usuario_id = ?`, [id, usuarioId]);
    if (!filas.length) throw noEncontrado("Venta no encontrada");
    return (await armarVentas(q, filas))[0];
  }

  return {
    async crear(usuarioId, datos) {
      const metodoPago = opcion(datos.metodoPago, "metodoPago", METODOS);
      const fecha = fechaISO(datos.fecha, "fecha", { requerido: false }) ?? hoy();
      if (!Array.isArray(datos.items) || datos.items.length === 0) {
        throw datosInvalidos("La venta debe tener al menos un producto");
      }
      if (datos.items.length > 100) throw datosInvalidos("Una venta no puede tener más de 100 productos distintos");

      const pedidos = datos.items.map((it, i) => ({
        productoId: entero(it?.productoId, `items[${i}].productoId`, { min: 1 }),
        cantidad: entero(it?.cantidad, `items[${i}].cantidad`, { min: 1, max: 100000 }),
        // opcional: precio distinto al de lista (por ejemplo, si negociaste con el cliente)
        precioUnitario: entero(it?.precioUnitario, `items[${i}].precioUnitario`, { min: 0, requerido: false }),
      }));
      if (new Set(pedidos.map((p) => p.productoId)).size !== pedidos.length) {
        throw datosInvalidos("Hay un producto repetido: agrégalo una sola vez con la cantidad total");
      }

      return db.transaction(async (tx) => {
        const ids = pedidos.map((p) => p.productoId);
        const productos = await tx.query(
          `SELECT id, nombre, precio_venta, precio_compra FROM productos
            WHERE usuario_id = ? AND activo = 1 AND id IN (${ids.map(() => "?").join(",")})`,
          [usuarioId, ...ids]
        );
        const porId = new Map(productos.map((p) => [Number(p.id), p]));
        const faltante = ids.find((id) => !porId.has(id));
        if (faltante !== undefined) throw noEncontrado(`El producto ${faltante} no existe`);

        const lineas = pedidos.map((p) => {
          const prod = porId.get(p.productoId);
          return {
            ...p,
            nombre: prod.nombre,
            precio: p.precioUnitario ?? Number(prod.precio_venta),
            costo: prod.precio_compra === null ? null : Number(prod.precio_compra),
          };
        });
        const total = lineas.reduce((a, l) => a + l.cantidad * l.precio, 0);

        const r = await tx.execute(
          "INSERT INTO ventas (usuario_id, fecha, total, metodo_pago, estado) VALUES (?, ?, ?, ?, 'completada')",
          [usuarioId, fecha, total, metodoPago]
        );
        for (const l of lineas) {
          await tx.execute(
            `INSERT INTO venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [r.insertId, l.productoId, l.nombre, l.cantidad, l.precio, l.costo]
          );
          // descuenta el stock; si no alcanza, lanza error y se deshace toda la venta
          await cambiarStock(tx, {
            usuarioId, productoId: l.productoId, delta: -l.cantidad, tipo: "venta", ventaId: r.insertId,
          });
        }
        return obtener(tx, usuarioId, r.insertId);
      });
    },

    async obtener(usuarioId, id) {
      return obtener(db, usuarioId, id);
    },

    async listar(usuarioId, filtros = {}) {
      const desde = fechaISO(filtros.desde, "desde", { requerido: false });
      const hasta = fechaISO(filtros.hasta, "hasta", { requerido: false });
      const metodo = opcion(filtros.metodoPago, "metodoPago", METODOS, { requerido: false });
      const estado = opcion(filtros.estado, "estado", ["completada", "anulada"], { requerido: false });
      const limite = entero(filtros.limite, "limite", { min: 1, max: 500, requerido: false }) ?? 200;
      const where = ["usuario_id = ?"];
      const params = [usuarioId];
      if (desde) { where.push("fecha >= ?"); params.push(desde); }
      if (hasta) { where.push("fecha <= ?"); params.push(hasta); }
      if (metodo) { where.push("metodo_pago = ?"); params.push(metodo); }
      if (estado) { where.push("estado = ?"); params.push(estado); }
      const filas = await db.query(
        `${SELECT_VENTA} WHERE ${where.join(" AND ")} ORDER BY fecha DESC, id DESC LIMIT ${limite}`,
        params
      );
      return armarVentas(db, filas);
    },

    // Anular = la venta no se borra: queda marcada y el stock vuelve al inventario
    async anular(usuarioId, id) {
      return db.transaction(async (tx) => {
        const [venta] = await tx.query("SELECT id, estado FROM ventas WHERE id = ? AND usuario_id = ?", [id, usuarioId]);
        if (!venta) throw noEncontrado("Venta no encontrada");
        if (venta.estado === "anulada") throw conflicto("VENTA_YA_ANULADA", "Esa venta ya estaba anulada");
        const items = await tx.query(
          "SELECT producto_id, cantidad FROM venta_items WHERE venta_id = ? AND producto_id IS NOT NULL",
          [id]
        );
        for (const it of items) {
          await cambiarStock(tx, {
            usuarioId, productoId: Number(it.producto_id), delta: Number(it.cantidad), tipo: "anulacion", ventaId: id,
          });
        }
        await tx.execute(
          "UPDATE ventas SET estado = 'anulada', anulada_en = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?",
          [id, usuarioId]
        );
        return obtener(tx, usuarioId, id);
      });
    },
  };
}
