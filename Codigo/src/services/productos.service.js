import { texto, entero, opcion } from "../utils/validar.js";
import { datosInvalidos, noEncontrado } from "../utils/errores.js";
import { cambiarStock } from "./stock.js";

const MAX = 2_000_000_000;

const SELECT_PRODUCTO = `
  SELECT p.id, p.nombre, p.descripcion, p.precio_compra, p.precio_venta, p.stock, p.stock_minimo,
         c.nombre AS categoria
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id`;

function aProducto(f) {
  const precioCompra = f.precio_compra === null || f.precio_compra === undefined ? null : Number(f.precio_compra);
  const precioVenta = Number(f.precio_venta);
  return {
    id: Number(f.id),
    nombre: f.nombre,
    descripcion: f.descripcion ?? "",
    categoria: f.categoria ?? "",
    precioCompra,
    precioVenta,
    stock: Number(f.stock),
    stockMinimo: Number(f.stock_minimo),
    gananciaUnitaria: precioCompra === null ? null : precioVenta - precioCompra,
  };
}

async function leer(q, usuarioId, id) {
  const [fila] = await q.query(`${SELECT_PRODUCTO} WHERE p.id = ? AND p.usuario_id = ? AND p.activo = 1`, [id, usuarioId]);
  if (!fila) throw noEncontrado("Producto no encontrado");
  return aProducto(fila);
}

// Busca la categoría por nombre (sin distinguir mayúsculas) y la crea si no existe
async function asegurarCategoria(tx, usuarioId, nombre) {
  if (!nombre) return null;
  const [existente] = await tx.query(
    "SELECT id FROM categorias WHERE usuario_id = ? AND LOWER(nombre) = LOWER(?)",
    [usuarioId, nombre]
  );
  if (existente) return Number(existente.id);
  const r = await tx.execute("INSERT INTO categorias (usuario_id, nombre) VALUES (?, ?)", [usuarioId, nombre]);
  return r.insertId;
}

function validar(d, parcial) {
  const out = {};
  if (!parcial || d.nombre !== undefined) out.nombre = texto(d.nombre, "nombre", { max: 120 });
  if (d.descripcion !== undefined) out.descripcion = texto(d.descripcion, "descripcion", { requerido: false, max: 500 });
  if (d.categoria !== undefined) out.categoria = texto(d.categoria, "categoria", { requerido: false, max: 80 });
  if (!parcial || d.precioVenta !== undefined) out.precioVenta = entero(d.precioVenta, "precioVenta", { min: 0 });
  if (!parcial || d.precioCompra !== undefined) out.precioCompra = entero(d.precioCompra, "precioCompra", { min: 0 });
  if (d.stock !== undefined) out.stock = entero(d.stock, "stock", { min: 0 });
  if (d.stockMinimo !== undefined) out.stockMinimo = entero(d.stockMinimo, "stockMinimo", { min: 0 });
  return out;
}

export function crearProductosService(db) {
  return {
    async listar(usuarioId, filtros = {}) {
      const where = ["p.usuario_id = ?", "p.activo = 1"];
      const params = [usuarioId];
      if (filtros.buscar) {
        const q = `%${String(filtros.buscar).trim().toLowerCase()}%`;
        where.push("(LOWER(p.nombre) LIKE ? OR LOWER(c.nombre) LIKE ?)");
        params.push(q, q);
      }
      if (filtros.categoria) {
        where.push("LOWER(c.nombre) = LOWER(?)");
        params.push(String(filtros.categoria));
      }
      if (filtros.stockBajo === true || filtros.stockBajo === "1" || filtros.stockBajo === "true") {
        where.push("p.stock <= p.stock_minimo");
      }
      const filas = await db.query(`${SELECT_PRODUCTO} WHERE ${where.join(" AND ")} ORDER BY p.nombre`, params);
      return filas.map(aProducto);
    },

    async obtener(usuarioId, id) {
      return leer(db, usuarioId, id);
    },

    async categorias(usuarioId) {
      const filas = await db.query(
        `SELECT DISTINCT c.nombre FROM categorias c
           JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
          WHERE c.usuario_id = ? ORDER BY c.nombre`,
        [usuarioId]
      );
      return filas.map((f) => f.nombre);
    },

    async crear(usuarioId, datos) {
      const v = validar(datos, false);
      const stock = v.stock ?? 0;
      const stockMinimo = v.stockMinimo ?? 3;
      return db.transaction(async (tx) => {
        const categoriaId = await asegurarCategoria(tx, usuarioId, v.categoria);
        const r = await tx.execute(
          `INSERT INTO productos (usuario_id, categoria_id, nombre, descripcion, precio_compra, precio_venta, stock, stock_minimo)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
          [usuarioId, categoriaId, v.nombre, v.descripcion ?? null, v.precioCompra, v.precioVenta, stockMinimo]
        );
        if (stock > 0) {
          await cambiarStock(tx, { usuarioId, productoId: r.insertId, delta: stock, tipo: "inicial" });
        }
        return leer(tx, usuarioId, r.insertId);
      });
    },

    async actualizar(usuarioId, id, datos) {
      const v = validar(datos, true);
      return db.transaction(async (tx) => {
        const actual = await leer(tx, usuarioId, id);
        const sets = [];
        const params = [];
        if (v.nombre !== undefined) { sets.push("nombre = ?"); params.push(v.nombre); }
        if (v.descripcion !== undefined) { sets.push("descripcion = ?"); params.push(v.descripcion); }
        if (v.categoria !== undefined) {
          sets.push("categoria_id = ?");
          params.push(await asegurarCategoria(tx, usuarioId, v.categoria));
        }
        if (v.precioCompra !== undefined) { sets.push("precio_compra = ?"); params.push(v.precioCompra); }
        if (v.precioVenta !== undefined) { sets.push("precio_venta = ?"); params.push(v.precioVenta); }
        if (v.stockMinimo !== undefined) { sets.push("stock_minimo = ?"); params.push(v.stockMinimo); }
        if (sets.length) {
          await tx.execute(
            `UPDATE productos SET ${sets.join(", ")}, actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?`,
            [...params, id, usuarioId]
          );
        }
        // si cambió el stock, queda registrado como "ajuste" en el historial
        if (v.stock !== undefined && v.stock !== actual.stock) {
          await cambiarStock(tx, {
            usuarioId, productoId: id, delta: v.stock - actual.stock, tipo: "ajuste", nota: "Edición del producto",
          });
        }
        return leer(tx, usuarioId, id);
      });
    },

    // "Eliminar" oculta el producto, pero se conserva para que las ventas
    // antiguas sigan mostrándose bien en el historial.
    async eliminar(usuarioId, id) {
      await leer(db, usuarioId, id);
      await db.execute(
        "UPDATE productos SET activo = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?",
        [id, usuarioId]
      );
    },

    // Reposición (compraste más) o ajuste manual (merma, conteo, corrección)
    async ajustarStock(usuarioId, id, datos) {
      const tipo = opcion(datos.tipo, "tipo", ["reposicion", "ajuste"]);
      const cantidad = entero(datos.cantidad, "cantidad", { min: -MAX, max: MAX });
      if (cantidad === 0) throw datosInvalidos("La cantidad no puede ser 0");
      if (tipo === "reposicion" && cantidad < 0) throw datosInvalidos("Una reposición debe ser una cantidad positiva");
      const nota = texto(datos.nota, "nota", { requerido: false, max: 200 });
      const precioCompra = tipo === "reposicion" ? entero(datos.precioCompra, "precioCompra", { min: 0, requerido: false }) : null;
      return db.transaction(async (tx) => {
        await leer(tx, usuarioId, id);
        await cambiarStock(tx, { usuarioId, productoId: id, delta: cantidad, tipo, nota });
        if (precioCompra !== null) {
          await tx.execute(
            "UPDATE productos SET precio_compra = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?",
            [precioCompra, id, usuarioId]
          );
        }
        return leer(tx, usuarioId, id);
      });
    },

    async movimientos(usuarioId, id, limite = 50) {
      await leer(db, usuarioId, id);
      const n = entero(limite, "limite", { min: 1, max: 200 });
      const filas = await db.query(
        `SELECT id, tipo, cantidad, stock_resultante, venta_id, nota, creado_en
           FROM movimientos_stock WHERE producto_id = ? AND usuario_id = ?
          ORDER BY id DESC LIMIT ${n}`,
        [id, usuarioId]
      );
      return filas.map((f) => ({
        id: Number(f.id), tipo: f.tipo, cantidad: Number(f.cantidad), stockResultante: Number(f.stock_resultante),
        ventaId: f.venta_id === null ? null : Number(f.venta_id), nota: f.nota, creadoEn: f.creado_en,
      }));
    },
  };
}
