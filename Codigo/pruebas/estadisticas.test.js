import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, escenarioVentas, sqliteDisponible, rechazaCon } from "./ayudas/entorno.js";

describe("estadísticas del dashboard", { skip: !sqliteDisponible }, () => {
  it("resumen de 7 días: ventas, ganancia, margen y variación frente al período anterior", async () => {
    const e = crearEntorno();
    const { uid } = await escenarioVentas(e);
    const r = await e.s.estadisticas.resumen(uid, { dias: 7 });
    assert.equal(r.desde, "2026-10-13");
    assert.equal(r.hasta, "2026-10-19");
    assert.equal(r.ventas, 3); // la venta anulada no cuenta
    assert.equal(r.ingresos, 8500);
    assert.equal(r.ticketPromedio, 2833);
    assert.equal(r.invertido, 5100);
    assert.equal(r.ganancia, 3400);
    assert.equal(r.margenPct, 40);
    assert.equal(r.ventasSinCosto, 0);
    assert.equal(r.periodoAnterior.ingresos, 5000);
    assert.equal(r.variacionIngresosPct, 70);
  });

  it("sin ventas devuelve ceros y variación null", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const r = await e.s.estadisticas.resumen(uid, {});
    assert.deepEqual([r.ventas, r.ingresos, r.ganancia, r.ticketPromedio], [0, 0, 0, 0]);
    assert.equal(r.margenPct, null);
    assert.equal(r.variacionIngresosPct, null);
  });

  it("ventas por día incluye los días sin ventas en cero", async () => {
    const e = crearEntorno();
    const { uid } = await escenarioVentas(e);
    const dias = await e.s.estadisticas.ventasPorDia(uid, { dias: 7 });
    assert.equal(dias.length, 7);
    assert.equal(dias[0].fecha, "2026-10-13");
    assert.equal(dias[6].fecha, "2026-10-19");
    const por = Object.fromEntries(dias.map((d) => [d.fecha, d]));
    assert.deepEqual([por["2026-10-13"].total, por["2026-10-13"].ventas], [0, 0]);
    assert.deepEqual([por["2026-10-14"].total, por["2026-10-14"].ganancia], [3000, 1200]);
    assert.deepEqual([por["2026-10-18"].total, por["2026-10-18"].invertido, por["2026-10-18"].ganancia], [3500, 2100, 1400]);
    assert.equal(por["2026-10-19"].total, 2000); // la anulada no suma
  });

  it("agrupa por semana (desde el lunes) y por mes", async () => {
    const e = crearEntorno();
    const { uid } = await escenarioVentas(e);
    const semanas = await e.s.estadisticas.ventasPorPeriodo(uid, { agrupar: "semana", dias: 14 });
    assert.deepEqual(semanas.map((s) => [s.periodo, s.total]), [["2026-10-05", 5000], ["2026-10-12", 6500], ["2026-10-19", 2000]]);
    const meses = await e.s.estadisticas.ventasPorPeriodo(uid, { agrupar: "mes", dias: 30 });
    // 30 días hacia atrás desde el 19/10 tocan septiembre, que aparece en cero
    assert.deepEqual(meses.map((m) => [m.periodo, m.total]), [["2026-09", 0], ["2026-10", 13500]]);
    await assert.rejects(() => e.s.estadisticas.ventasPorPeriodo(uid, { agrupar: "año" }), rechazaCon(400));
  });

  it("productos más vendidos y los que más ganancia dejan", async () => {
    const e = crearEntorno();
    const { uid, A, B } = await escenarioVentas(e);
    const mas = await e.s.estadisticas.productosTop(uid, { dias: 30 });
    assert.deepEqual(mas.map((p) => [p.nombre, p.cantidad]), [["Producto A", 6], ["Producto B", 3]]);
    assert.deepEqual([mas[0].productoId, mas[0].ingresos, mas[0].ganancia], [A.id, 6000, 2400]);
    const gan = await e.s.estadisticas.productosTop(uid, { dias: 30, orden: "ganancia" });
    assert.deepEqual(gan.map((p) => [p.productoId, p.ganancia]), [[B.id, 3000], [A.id, 2400]]);
    assert.equal((await e.s.estadisticas.productosTop(uid, { dias: 30, limite: 1 })).length, 1);
  });

  it("productos menos vendidos incluye los que no se vendieron nada", async () => {
    const e = crearEntorno();
    const { uid, C } = await escenarioVentas(e);
    const menos = await e.s.estadisticas.productosMenosVendidos(uid, { dias: 30 });
    assert.deepEqual(menos.map((p) => [p.nombre, p.cantidad]), [["Producto C", 0], ["Producto B", 3], ["Producto A", 6]]);
    assert.equal(menos[0].productoId, C.id);
  });

  it("alertas de stock bajo y valor del inventario", async () => {
    const e = crearEntorno();
    const { uid, C } = await escenarioVentas(e);
    const bajo = await e.s.estadisticas.stockBajo(uid);
    assert.deepEqual(bajo.map((p) => [p.productoId, p.stock, p.stockMinimo]), [[C.id, 2, 3]]);
    // A: 100-2-1-3 = 94 ; B: 100-1-2 = 97 ; C: 2   (la venta anulada devolvió su stock)
    const inv = await e.s.estadisticas.valorInventario(uid);
    assert.equal(inv.productos, 3);
    assert.equal(inv.costo, 94 * 600 + 97 * 1500 + 2 * 100);
    assert.equal(inv.gananciaPotencial, 94 * 400 + 97 * 1000 + 2 * 200);
    assert.equal(inv.productosSinCosto, 0);
  });

  it("las ventas con productos sin precio de compra no inflan la ganancia", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { precioCompra: 600, precioVenta: 1000, stock: 50 });
    const q = await e.producto(uid, { nombre: "Antiguo", precioVenta: 2000, stock: 50 });
    await e.db.execute("UPDATE productos SET precio_compra = NULL WHERE id = ?", [q.id]);
    await e.s.ventas.crear(uid, { fecha: "2026-10-19", metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] });
    await e.s.ventas.crear(uid, { fecha: "2026-10-19", metodoPago: "Efectivo", items: [{ productoId: q.id, cantidad: 1 }] });
    const r = await e.s.estadisticas.resumen(uid, { dias: 7 });
    assert.equal(r.ingresos, 3000); // total vendido
    assert.equal(r.invertido, 600);
    assert.equal(r.ganancia, 400); // solo la venta con costo conocido
    assert.equal(r.ventasSinCosto, 1);
    assert.equal((await e.s.estadisticas.valorInventario(uid)).productosSinCosto, 1);
  });

  it("total vendido por día de la semana", async () => {
    const e = crearEntorno();
    const { uid } = await escenarioVentas(e);
    const sem = await e.s.estadisticas.ventasPorDiaSemana(uid, { dias: 90 });
    assert.equal(sem.length, 7);
    const lunes = sem.find((d) => d.dia === "Lunes"); // 19/10 (lunes): 2000
    assert.equal(lunes.total, 2000);
    const domingo = sem.find((d) => d.dia === "Domingo"); // 18/10 y 10/10(sábado no)
    assert.equal(domingo.total, 3500);
  });

  it("cada cuenta ve solo sus propias estadísticas", async () => {
    const e = crearEntorno();
    await escenarioVentas(e);
    const otra = await e.nuevoUsuario();
    const r = await e.s.estadisticas.resumen(otra, { dias: 30 });
    assert.equal(r.ingresos, 0);
    assert.deepEqual(await e.s.estadisticas.productosTop(otra, { dias: 30 }), []);
    assert.deepEqual(await e.s.estadisticas.stockBajo(otra), []);
  });

  it("valida el parámetro de días", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    await assert.rejects(() => e.s.estadisticas.resumen(uid, { dias: 0 }), rechazaCon(400));
    await assert.rejects(() => e.s.estadisticas.resumen(uid, { dias: "abc" }), rechazaCon(400));
    await assert.rejects(() => e.s.estadisticas.resumen(uid, { dias: 5000 }), rechazaCon(400));
  });
});
