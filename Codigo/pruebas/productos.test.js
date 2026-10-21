import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, sqliteDisponible, rechazaCon } from "./ayudas/entorno.js";

describe("productos", { skip: !sqliteDisponible }, () => {
  it("crea un producto con precio de compra, venta y ganancia por unidad", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { nombre: "Gorro", precioCompra: 3000, precioVenta: 5000, stock: 10 });
    assert.equal(p.gananciaUnitaria, 2000);
    assert.equal(p.categoria, "General");
    assert.equal(p.stock, 10);
  });

  it("anota el stock inicial en el historial de movimientos", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 7 });
    const mov = await e.s.productos.movimientos(uid, p.id);
    assert.equal(mov.length, 1);
    assert.deepEqual([mov[0].tipo, mov[0].cantidad, mov[0].stockResultante], ["inicial", 7, 7]);
  });

  it("reutiliza la categoría sin distinguir mayúsculas", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    await e.producto(uid, { nombre: "A", categoria: "Gorros" });
    await e.producto(uid, { nombre: "B", categoria: "gorros" });
    const filas = await e.db.query("SELECT * FROM categorias");
    assert.equal(filas.length, 1);
    assert.deepEqual(await e.s.productos.categorias(uid), ["Gorros"]);
  });

  it("valida los datos del producto", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    await assert.rejects(() => e.s.productos.crear(uid, { precioCompra: 1, precioVenta: 2 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioVenta: 2 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioCompra: -1, precioVenta: 2 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioCompra: 1.5, precioVenta: 2 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioCompra: 1, precioVenta: 2, stock: -3 }), rechazaCon(400));
  });

  it("lista y filtra por texto, categoría y stock bajo", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    await e.producto(uid, { nombre: "Gorro beanie", categoria: "Gorros", stock: 2, stockMinimo: 5 });
    await e.producto(uid, { nombre: "Polerón", categoria: "Ropa", stock: 20 });
    assert.equal((await e.s.productos.listar(uid)).length, 2);
    assert.deepEqual((await e.s.productos.listar(uid, { buscar: "GORRO" })).map((p) => p.nombre), ["Gorro beanie"]);
    assert.deepEqual((await e.s.productos.listar(uid, { buscar: "ropa" })).map((p) => p.nombre), ["Polerón"]);
    assert.deepEqual((await e.s.productos.listar(uid, { categoria: "gorros" })).map((p) => p.nombre), ["Gorro beanie"]);
    assert.deepEqual((await e.s.productos.listar(uid, { stockBajo: "1" })).map((p) => p.nombre), ["Gorro beanie"]);
  });

  it("actualiza parcialmente y registra un ajuste si cambia el stock", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 10 });
    const nuevo = await e.s.productos.actualizar(uid, p.id, { precioVenta: 1500, stock: 4 });
    assert.equal(nuevo.precioVenta, 1500);
    assert.equal(nuevo.precioCompra, 600); // no tocado
    assert.equal(nuevo.stock, 4);
    const mov = await e.s.productos.movimientos(uid, p.id);
    assert.deepEqual([mov[0].tipo, mov[0].cantidad, mov[0].stockResultante], ["ajuste", -6, 4]);
  });

  it("repone stock y puede actualizar el precio de compra", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 2, precioCompra: 600 });
    const r = await e.s.productos.ajustarStock(uid, p.id, { tipo: "reposicion", cantidad: 8, precioCompra: 700 });
    assert.equal(r.stock, 10);
    assert.equal(r.precioCompra, 700);
  });

  it("no permite un ajuste que deje el stock bajo 0 ni cantidades inválidas", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { stock: 3 });
    await assert.rejects(() => e.s.productos.ajustarStock(uid, p.id, { tipo: "ajuste", cantidad: -5 }), rechazaCon(409, "STOCK_INSUFICIENTE"));
    await assert.rejects(() => e.s.productos.ajustarStock(uid, p.id, { tipo: "ajuste", cantidad: 0 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.ajustarStock(uid, p.id, { tipo: "reposicion", cantidad: -1 }), rechazaCon(400));
    assert.equal((await e.s.productos.obtener(uid, p.id)).stock, 3);
  });

  it("eliminar oculta el producto sin borrar su historial", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid);
    await e.s.productos.eliminar(uid, p.id);
    assert.equal((await e.s.productos.listar(uid)).length, 0);
    await assert.rejects(() => e.s.productos.obtener(uid, p.id), rechazaCon(404));
    const [fila] = await e.db.query("SELECT activo FROM productos WHERE id = ?", [p.id]);
    assert.equal(Number(fila.activo), 0);
  });

  it("cada cuenta solo ve y modifica sus propios productos", async () => {
    const e = crearEntorno();
    const ana = await e.nuevoUsuario();
    const beto = await e.nuevoUsuario();
    const p = await e.producto(ana);
    assert.equal((await e.s.productos.listar(beto)).length, 0);
    await assert.rejects(() => e.s.productos.obtener(beto, p.id), rechazaCon(404));
    await assert.rejects(() => e.s.productos.actualizar(beto, p.id, { nombre: "robado" }), rechazaCon(404));
    await assert.rejects(() => e.s.productos.eliminar(beto, p.id), rechazaCon(404));
    await assert.rejects(() => e.s.productos.ajustarStock(beto, p.id, { tipo: "reposicion", cantidad: 5 }), rechazaCon(404));
    assert.equal((await e.s.productos.obtener(ana, p.id)).nombre, "Producto");
  });
});
