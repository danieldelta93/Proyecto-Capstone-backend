import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, sqliteDisponible, rechazaCon, HOY } from "./ayudas/entorno.js";

describe("ventas", { skip: !sqliteDisponible }, () => {
  it("registra una venta: calcula el total, descuenta el stock y guarda el costo del momento", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const gorro = await e.producto(uid, { nombre: "Gorro", precioCompra: 3000, precioVenta: 5000, stock: 10 });
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: gorro.id, cantidad: 2 }] });
    assert.equal(venta.total, 10000);
    assert.equal(venta.fecha, HOY);
    assert.equal(venta.estado, "completada");
    assert.equal(venta.invertido, 6000);
    assert.equal(venta.ganancia, 4000);
    assert.deepEqual(
      [venta.items[0].nombre, venta.items[0].cantidad, venta.items[0].precioUnitario, venta.items[0].costoUnitario],
      ["Gorro", 2, 5000, 3000]
    );
    assert.equal((await e.s.productos.obtener(uid, gorro.id)).stock, 8);
    const mov = await e.s.productos.movimientos(uid, gorro.id);
    assert.deepEqual([mov[0].tipo, mov[0].cantidad, mov[0].ventaId], ["venta", -2, venta.id]);
  });

  it("el historial no cambia si después se edita el precio o el costo del producto", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { precioCompra: 600, precioVenta: 1000 });
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Tarjeta", items: [{ productoId: p.id, cantidad: 1 }] });
    await e.s.productos.actualizar(uid, p.id, { precioCompra: 900, precioVenta: 2000, nombre: "Otro nombre" });
    const guardada = await e.s.ventas.obtener(uid, venta.id);
    assert.equal(guardada.total, 1000);
    assert.equal(guardada.ganancia, 400);
    assert.equal(guardada.items[0].nombre, "Producto");
  });

  it("permite vender a un precio distinto al de lista", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { precioCompra: 600, precioVenta: 1000 });
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 3, precioUnitario: 800 }] });
    assert.equal(venta.total, 2400);
    assert.equal(venta.ganancia, 600);
  });

  it("si no alcanza el stock rechaza la venta y no deja nada a medias", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const a = await e.producto(uid, { nombre: "A", stock: 10 });
    const b = await e.producto(uid, { nombre: "B", stock: 1 });
    await assert.rejects(
      () => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: a.id, cantidad: 4 }, { productoId: b.id, cantidad: 2 }] }),
      rechazaCon(409, "STOCK_INSUFICIENTE")
    );
    // se deshizo todo: stock intacto y ninguna venta guardada
    assert.equal((await e.s.productos.obtener(uid, a.id)).stock, 10);
    assert.equal((await e.s.productos.obtener(uid, b.id)).stock, 1);
    assert.equal((await e.s.ventas.listar(uid)).length, 0);
    assert.equal((await e.db.query("SELECT * FROM venta_items")).length, 0);
    assert.equal((await e.s.productos.movimientos(uid, a.id)).length, 1); // solo el "inicial"
  });

  it("valida la venta", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid);
    const ok = { productoId: p.id, cantidad: 1 };
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Cheque", items: [ok] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { items: [ok] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 0 }] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [ok, ok] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", fecha: "2026-13-45", items: [ok] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: 9999, cantidad: 1 }] }), rechazaCon(404));
  });

  it("no se puede vender el producto de otra cuenta ni uno eliminado", async () => {
    const e = crearEntorno();
    const ana = await e.nuevoUsuario();
    const beto = await e.nuevoUsuario();
    const deAna = await e.producto(ana);
    await assert.rejects(() => e.s.ventas.crear(beto, { metodoPago: "Efectivo", items: [{ productoId: deAna.id, cantidad: 1 }] }), rechazaCon(404));
    await e.s.productos.eliminar(ana, deAna.id);
    await assert.rejects(() => e.s.ventas.crear(ana, { metodoPago: "Efectivo", items: [{ productoId: deAna.id, cantidad: 1 }] }), rechazaCon(404));
  });

  it("anular una venta devuelve el stock y no se puede anular dos veces", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 10 });
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 4 }] });
    assert.equal((await e.s.productos.obtener(uid, p.id)).stock, 6);
    const anulada = await e.s.ventas.anular(uid, venta.id);
    assert.equal(anulada.estado, "anulada");
    assert.equal((await e.s.productos.obtener(uid, p.id)).stock, 10);
    const mov = await e.s.productos.movimientos(uid, p.id);
    assert.equal(mov[0].tipo, "anulacion");
    await assert.rejects(() => e.s.ventas.anular(uid, venta.id), rechazaCon(409, "VENTA_YA_ANULADA"));
    assert.equal((await e.s.productos.obtener(uid, p.id)).stock, 10);
  });

  it("otra cuenta no puede ver ni anular la venta", async () => {
    const e = crearEntorno();
    const ana = await e.nuevoUsuario();
    const beto = await e.nuevoUsuario();
    const p = await e.producto(ana);
    const venta = await e.s.ventas.crear(ana, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] });
    await assert.rejects(() => e.s.ventas.obtener(beto, venta.id), rechazaCon(404));
    await assert.rejects(() => e.s.ventas.anular(beto, venta.id), rechazaCon(404));
    assert.equal((await e.s.ventas.listar(beto)).length, 0);
  });

  it("la ganancia queda en null si algún producto no tiene precio de compra", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid);
    await e.db.execute("UPDATE productos SET precio_compra = NULL WHERE id = ?", [p.id]); // producto antiguo
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] });
    assert.equal(venta.items[0].costoUnitario, null);
    assert.equal(venta.invertido, null);
    assert.equal(venta.ganancia, null);
  });

  it("las ventas antiguas siguen mostrando el nombre aunque el producto se elimine", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { nombre: "Chalina" });
    const venta = await e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] });
    await e.s.productos.eliminar(uid, p.id);
    assert.equal((await e.s.ventas.obtener(uid, venta.id)).items[0].nombre, "Chalina");
  });

  it("lista con filtros por fecha, método de pago y estado, la más reciente primero", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 100 });
    const vender = (fecha, metodoPago) => e.s.ventas.crear(uid, { fecha, metodoPago, items: [{ productoId: p.id, cantidad: 1 }] });
    await vender("2026-10-01", "Efectivo");
    const v2 = await vender("2026-10-10", "Tarjeta");
    await vender("2026-10-15", "Efectivo");
    await e.s.ventas.anular(uid, v2.id);
    assert.deepEqual((await e.s.ventas.listar(uid)).map((v) => v.fecha), ["2026-10-15", "2026-10-10", "2026-10-01"]);
    assert.equal((await e.s.ventas.listar(uid, { desde: "2026-10-05", hasta: "2026-10-12" })).length, 1);
    assert.equal((await e.s.ventas.listar(uid, { metodoPago: "Efectivo" })).length, 2);
    assert.equal((await e.s.ventas.listar(uid, { estado: "anulada" })).length, 1);
    assert.equal((await e.s.ventas.listar(uid, { limite: 2 })).length, 2);
    await assert.rejects(() => e.s.ventas.listar(uid, { desde: "ayer" }), rechazaCon(400));
  });
});
