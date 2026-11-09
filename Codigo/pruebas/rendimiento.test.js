import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, sqliteDisponible, HOY } from "./ayudas/entorno.js";
import { sumarDias } from "../src/utils/fechas.js";

// Pruebas de rendimiento: con un negocio "grande" (1.000 productos y 5.000 ventas con 10.000 ítems en los
// últimos 90 días) las consultas más pesadas del panel deben seguir respondiendo rápido.
// Los límites son generosos a propósito (para que no fallen en un computador lento); el tiempo medido
// de cada consulta queda anotado en el resultado de la prueba.
const LIMITE_CONSULTA_MS = 1500;
const LIMITE_VENTA_MS = 100; // promedio por venta registrada

describe("rendimiento", { skip: !sqliteDisponible }, () => {
  let e, uid, ids;

  before(async () => {
    e = crearEntorno();
    uid = await e.nuevoUsuario();
    await e.db.transaction(async (tx) => {
      ids = [];
      for (let i = 1; i <= 1000; i++) {
        const r = await tx.execute(
          "INSERT INTO productos (usuario_id, nombre, precio_compra, precio_venta, stock, stock_minimo) VALUES (?, ?, ?, ?, ?, ?)",
          [uid, `Producto ${String(i).padStart(4, "0")}`, 500 + (i % 50) * 10, 1000 + (i % 50) * 20, 20 + (i % 30), 5]
        );
        ids.push(r.insertId);
      }
      for (let v = 0; v < 5000; v++) {
        const r = await tx.execute(
          "INSERT INTO ventas (usuario_id, fecha, total, metodo_pago, estado) VALUES (?, ?, ?, ?, 'completada')",
          [uid, sumarDias(HOY, -(v % 90)), 3000 + (v % 20) * 100, ["Efectivo", "Transferencia", "Tarjeta"][v % 3]]
        );
        for (const pid of [ids[(v * 7) % ids.length], ids[(v * 13 + 1) % ids.length]]) {
          await tx.execute(
            "INSERT INTO venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario) VALUES (?, ?, 'Producto', ?, 1500, 900)",
            [r.insertId, pid, 1 + (v % 3)]
          );
        }
      }
    });
  });

  const medir = async (t, nombre, fn, limite = LIMITE_CONSULTA_MS) => {
    const inicio = performance.now();
    const resultado = await fn();
    const ms = performance.now() - inicio;
    t.diagnostic(`${nombre}: ${ms.toFixed(1)} ms`);
    assert.ok(ms < limite, `${nombre} tardó ${ms.toFixed(0)} ms (límite ${limite} ms)`);
    return resultado;
  };

  it("listar 1.000 productos", async (t) => {
    const r = await medir(t, "productos.listar (1.000 productos)", () => e.s.productos.listar(uid));
    assert.equal(r.length, 1000);
  });

  it("buscar productos por texto", async (t) => {
    const r = await medir(t, "productos.listar con búsqueda", () => e.s.productos.listar(uid, { buscar: "Producto 05" }));
    assert.ok(r.length >= 10);
  });

  it("historial de ventas (las 200 más recientes con sus ítems)", async (t) => {
    const r = await medir(t, "ventas.listar (límite 200)", () => e.s.ventas.listar(uid, { limite: 200 }));
    assert.equal(r.length, 200);
    assert.equal(r[0].items.length, 2);
  });

  it("resumen del panel a 30 y a 90 días (5.000 ventas)", async (t) => {
    const r30 = await medir(t, "estadisticas.resumen 30 días", () => e.s.estadisticas.resumen(uid, { dias: 30 }));
    const r90 = await medir(t, "estadisticas.resumen 90 días", () => e.s.estadisticas.resumen(uid, { dias: 90 }));
    assert.ok(r30.ventas > 0 && r90.ventas > r30.ventas);
    assert.equal(r90.ventas, 5000);
  });

  it("ventas por día, por semana y por mes", async (t) => {
    const dia = await medir(t, "ventasPorDia 90 días", () => e.s.estadisticas.ventasPorDia(uid, { dias: 90 }));
    assert.equal(dia.length, 90);
    await medir(t, "ventasPorPeriodo (semana)", () => e.s.estadisticas.ventasPorPeriodo(uid, { agrupar: "semana", dias: 90 }));
    await medir(t, "ventasPorPeriodo (mes)", () => e.s.estadisticas.ventasPorPeriodo(uid, { agrupar: "mes", dias: 90 }));
  });

  it("productos más y menos vendidos", async (t) => {
    const mas = await medir(t, "productosTop (más vendidos)", () => e.s.estadisticas.productosTop(uid, { dias: 90, limite: 5 }));
    assert.equal(mas.length, 5);
    await medir(t, "productosTop (por ganancia)", () => e.s.estadisticas.productosTop(uid, { dias: 90, limite: 5, orden: "ganancia" }));
    const menos = await medir(t, "productosMenosVendidos", () => e.s.estadisticas.productosMenosVendidos(uid, { dias: 90, limite: 5 }));
    assert.equal(menos.length, 5);
  });

  it("alertas de stock bajo y valor del inventario", async (t) => {
    await medir(t, "estadisticas.stockBajo", () => e.s.estadisticas.stockBajo(uid));
    const inv = await medir(t, "estadisticas.valorInventario", () => e.s.estadisticas.valorInventario(uid));
    assert.equal(inv.productos, 1000);
  });

  it("el asistente responde con un negocio grande", async (t) => {
    const r = await medir(t, "asistente.preguntar (arma todo el contexto)", () => e.s.asistente.preguntar(uid, { pregunta: "¿Cuánto gané esta semana?" }), 3000);
    assert.match(r.respuesta, /ganaste/);
  });

  it("registrar 200 ventas seguidas con descuento de stock", async (t) => {
    const inicio = performance.now();
    for (let i = 0; i < 200; i++) {
      await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: ids[i], cantidad: 1 }, { productoId: ids[i + 300], cantidad: 2 }] });
    }
    const promedio = (performance.now() - inicio) / 200;
    t.diagnostic(`ventas.crear: ${promedio.toFixed(2)} ms por venta (promedio de 200)`);
    assert.ok(promedio < LIMITE_VENTA_MS, `${promedio.toFixed(1)} ms por venta (límite ${LIMITE_VENTA_MS} ms)`);
  });
});
