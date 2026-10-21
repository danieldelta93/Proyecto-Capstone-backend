import { entero, opcion } from "../utils/validar.js";
import { rangoDias, sumarDias, inicioSemana, diaSemana, NOMBRES_DIAS } from "../utils/fechas.js";

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

export function crearEstadisticasService(db, { hoy }) {
  const dias = (v, porDefecto, max = 366) => entero(v, "dias", { min: 1, max, requerido: false }) ?? porDefecto;

  // Agrega, por día, lo vendido, lo invertido y la ganancia. Solo cuentan las ventas
  // "completadas". invertido y ganancia solo consideran los ítems con precio de compra.
  async function agregadoPorDia(usuarioId, desde, hasta) {
    const ventas = await db.query(
      `SELECT fecha, COUNT(*) AS ventas, SUM(total) AS total
         FROM ventas
        WHERE usuario_id = ? AND estado = 'completada' AND fecha BETWEEN ? AND ?
        GROUP BY fecha`,
      [usuarioId, desde, hasta]
    );
    const items = await db.query(
      `SELECT v.fecha AS fecha,
              SUM(CASE WHEN i.costo_unitario IS NOT NULL THEN i.cantidad * i.precio_unitario ELSE 0 END) AS ingresos_con_costo,
              SUM(CASE WHEN i.costo_unitario IS NOT NULL THEN i.cantidad * i.costo_unitario ELSE 0 END) AS invertido,
              COUNT(DISTINCT CASE WHEN i.costo_unitario IS NULL THEN v.id END) AS ventas_sin_costo
         FROM ventas v JOIN venta_items i ON i.venta_id = v.id
        WHERE v.usuario_id = ? AND v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
        GROUP BY v.fecha`,
      [usuarioId, desde, hasta]
    );
    const mapa = new Map();
    for (const d of rangoDias(desde, hasta)) {
      mapa.set(d, { fecha: d, ventas: 0, total: 0, ingresosConCosto: 0, invertido: 0, ventasSinCosto: 0 });
    }
    ventas.forEach((f) => Object.assign(mapa.get(f.fecha), { ventas: num(f.ventas), total: num(f.total) }));
    items.forEach((f) =>
      Object.assign(mapa.get(f.fecha), {
        ingresosConCosto: num(f.ingresos_con_costo),
        invertido: num(f.invertido),
        ventasSinCosto: num(f.ventas_sin_costo),
      })
    );
    return [...mapa.values()].map((d) => ({ ...d, ganancia: d.ingresosConCosto - d.invertido }));
  }

  const sumar = (lista) =>
    lista.reduce(
      (a, d) => ({
        ventas: a.ventas + d.ventas,
        total: a.total + d.total,
        ingresosConCosto: a.ingresosConCosto + d.ingresosConCosto,
        invertido: a.invertido + d.invertido,
        ventasSinCosto: a.ventasSinCosto + d.ventasSinCosto,
      }),
      { ventas: 0, total: 0, ingresosConCosto: 0, invertido: 0, ventasSinCosto: 0 }
    );

  const ordenes = {
    mas: "cantidad DESC, nombre ASC",
    ganancia: "ganancia DESC, nombre ASC",
  };

  return {
    // Resumen del período + comparación con el período anterior de igual largo (tendencia)
    async resumen(usuarioId, { dias: d } = {}) {
      const n = dias(d, 7);
      const hasta = hoy();
      const desde = sumarDias(hasta, -(n - 1));
      const antHasta = sumarDias(desde, -1);
      const antDesde = sumarDias(antHasta, -(n - 1));
      const act = sumar(await agregadoPorDia(usuarioId, desde, hasta));
      const ant = sumar(await agregadoPorDia(usuarioId, antDesde, antHasta));
      const ganancia = act.ingresosConCosto - act.invertido;
      return {
        desde, hasta, dias: n,
        ventas: act.ventas,
        ingresos: act.total,
        ticketPromedio: act.ventas ? Math.round(act.total / act.ventas) : 0,
        invertido: act.invertido,
        ganancia,
        margenPct: act.ingresosConCosto > 0 ? Math.round((ganancia / act.ingresosConCosto) * 1000) / 10 : null,
        ventasSinCosto: act.ventasSinCosto,
        periodoAnterior: { desde: antDesde, hasta: antHasta, ventas: ant.ventas, ingresos: ant.total },
        variacionIngresosPct: ant.total > 0 ? Math.round(((act.total - ant.total) / ant.total) * 1000) / 10 : null,
      };
    },

    // Una fila por día (los días sin ventas aparecen en cero)
    async ventasPorDia(usuarioId, { dias: d } = {}) {
      const n = dias(d, 7);
      const hasta = hoy();
      const filas = await agregadoPorDia(usuarioId, sumarDias(hasta, -(n - 1)), hasta);
      return filas.map((f) => ({
        fecha: f.fecha, ventas: f.ventas, total: f.total, invertido: f.invertido, ganancia: f.ganancia,
      }));
    },

    // Volumen de ventas por día, semana (desde el lunes) o mes
    async ventasPorPeriodo(usuarioId, { agrupar, dias: d } = {}) {
      const modo = opcion(agrupar, "agrupar", ["dia", "semana", "mes"], { requerido: false }) ?? "dia";
      const n = dias(d, 30);
      const hasta = hoy();
      const filas = await agregadoPorDia(usuarioId, sumarDias(hasta, -(n - 1)), hasta);
      if (modo === "dia") {
        return filas.map((f) => ({ periodo: f.fecha, ventas: f.ventas, total: f.total, invertido: f.invertido, ganancia: f.ganancia }));
      }
      const grupos = new Map();
      for (const f of filas) {
        const clave = modo === "semana" ? inicioSemana(f.fecha) : f.fecha.slice(0, 7);
        const g = grupos.get(clave) ?? { periodo: clave, ventas: 0, total: 0, invertido: 0, ganancia: 0 };
        g.ventas += f.ventas; g.total += f.total; g.invertido += f.invertido; g.ganancia += f.ganancia;
        grupos.set(clave, g);
      }
      return [...grupos.values()];
    },

    // Productos más vendidos (o los que más ganancia dejan) en el período
    async productosTop(usuarioId, { dias: d, limite, orden } = {}) {
      const n = dias(d, 30);
      const max = entero(limite, "limite", { min: 1, max: 100, requerido: false }) ?? 5;
      const modo = opcion(orden, "orden", ["mas", "ganancia"], { requerido: false }) ?? "mas";
      const hasta = hoy();
      const filas = await db.query(
        `SELECT i.producto_id AS producto_id, MAX(i.nombre_producto) AS nombre,
                SUM(i.cantidad) AS cantidad,
                SUM(i.cantidad * i.precio_unitario) AS ingresos,
                SUM(CASE WHEN i.costo_unitario IS NOT NULL THEN i.cantidad * (i.precio_unitario - i.costo_unitario) ELSE 0 END) AS ganancia
           FROM venta_items i JOIN ventas v ON v.id = i.venta_id
          WHERE v.usuario_id = ? AND v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
          GROUP BY i.producto_id
          ORDER BY ${ordenes[modo]}
          LIMIT ${max}`,
        [usuarioId, sumarDias(hasta, -(n - 1)), hasta]
      );
      return filas.map((f) => ({
        productoId: f.producto_id === null ? null : Number(f.producto_id),
        nombre: f.nombre, cantidad: num(f.cantidad), ingresos: num(f.ingresos), ganancia: num(f.ganancia),
      }));
    },

    // Productos menos vendidos: incluye los que no vendieron nada en el período
    async productosMenosVendidos(usuarioId, { dias: d, limite } = {}) {
      const n = dias(d, 30);
      const max = entero(limite, "limite", { min: 1, max: 100, requerido: false }) ?? 5;
      const hasta = hoy();
      const filas = await db.query(
        `SELECT p.id AS producto_id, p.nombre AS nombre,
                COALESCE(s.cantidad, 0) AS cantidad, COALESCE(s.ingresos, 0) AS ingresos
           FROM productos p
           LEFT JOIN (
                 SELECT i.producto_id AS producto_id, SUM(i.cantidad) AS cantidad,
                        SUM(i.cantidad * i.precio_unitario) AS ingresos
                   FROM venta_items i JOIN ventas v ON v.id = i.venta_id
                  WHERE v.usuario_id = ? AND v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
                  GROUP BY i.producto_id
           ) s ON s.producto_id = p.id
          WHERE p.usuario_id = ? AND p.activo = 1
          ORDER BY cantidad ASC, p.nombre ASC
          LIMIT ${max}`,
        [usuarioId, sumarDias(hasta, -(n - 1)), hasta, usuarioId]
      );
      return filas.map((f) => ({
        productoId: Number(f.producto_id), nombre: f.nombre, cantidad: num(f.cantidad), ingresos: num(f.ingresos),
      }));
    },

    // Alertas de stock bajo: stock actual <= stock mínimo
    async stockBajo(usuarioId) {
      const filas = await db.query(
        `SELECT id, nombre, stock, stock_minimo FROM productos
          WHERE usuario_id = ? AND activo = 1 AND stock <= stock_minimo
          ORDER BY stock ASC, nombre ASC`,
        [usuarioId]
      );
      return filas.map((f) => ({
        productoId: Number(f.id), nombre: f.nombre, stock: Number(f.stock), stockMinimo: Number(f.stock_minimo),
      }));
    },

    // Dinero que tienes hoy en mercadería (a precio de compra) y lo que ganarías si la vendes toda
    async valorInventario(usuarioId) {
      const [f] = await db.query(
        `SELECT COUNT(*) AS productos,
                SUM(CASE WHEN precio_compra IS NOT NULL THEN 1 ELSE 0 END) AS con_costo,
                SUM(CASE WHEN precio_compra IS NOT NULL THEN precio_compra * stock ELSE 0 END) AS costo,
                SUM(CASE WHEN precio_compra IS NOT NULL THEN (precio_venta - precio_compra) * stock ELSE 0 END) AS ganancia_potencial
           FROM productos WHERE usuario_id = ? AND activo = 1`,
        [usuarioId]
      );
      return {
        productos: num(f.productos),
        productosConCosto: num(f.con_costo),
        productosSinCosto: num(f.productos) - num(f.con_costo),
        costo: num(f.costo),
        gananciaPotencial: num(f.ganancia_potencial),
      };
    },

    // Total vendido según el día de la semana (para saber cuál es tu mejor día)
    async ventasPorDiaSemana(usuarioId, { dias: d } = {}) {
      const n = dias(d, 90);
      const hasta = hoy();
      const filas = await agregadoPorDia(usuarioId, sumarDias(hasta, -(n - 1)), hasta);
      const totales = NOMBRES_DIAS.map((nombre) => ({ dia: nombre, ventas: 0, total: 0 }));
      filas.forEach((f) => {
        const t = totales[diaSemana(f.fecha)];
        t.ventas += f.ventas;
        t.total += f.total;
      });
      return totales;
    },
  };
}
