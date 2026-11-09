import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, sqliteDisponible, rechazaCon } from "./ayudas/entorno.js";
import { hashPassword, verificarPassword } from "../src/utils/password.js";
import { cargarConfig, validarConfig } from "../src/config.js";
import { limitarIntentos } from "../src/middleware/limitar.js";
import { manejarErrores } from "../src/middleware/errores.js";
import { ErrorHttp } from "../src/utils/errores.js";

// Pruebas de seguridad: que los datos de una cuenta no se puedan ver ni tocar desde otra, que lo que
// escribe el usuario no se ejecute como SQL, y que las contraseñas y los errores no filtren información.
describe("seguridad", { skip: !sqliteDisponible }, () => {
  const ATAQUES_SQL = ["' OR 1=1 --", "'; DROP TABLE productos; --", "\" OR \"\"=\"", "%' UNION SELECT * FROM usuarios --"];

  it("la búsqueda no ejecuta texto como SQL ni deja ver datos de otras cuentas", async () => {
    const e = crearEntorno();
    const ana = await e.nuevoUsuario();
    const beto = await e.nuevoUsuario();
    await e.producto(ana, { nombre: "Secreto de Ana" });
    await e.producto(beto, { nombre: "Gorro de Beto" });
    for (const ataque of ATAQUES_SQL) {
      const r = await e.s.productos.listar(beto, { buscar: ataque, categoria: ataque });
      assert.deepEqual(r, [], `la búsqueda "${ataque}" no debe devolver nada`);
    }
    // un SQL mal armado con "' OR 1=1 --" devolvería todos los productos; aquí no devuelve ninguno
    assert.deepEqual(await e.s.productos.listar(beto, { buscar: "' OR 1=1 --" }), []);
    assert.equal((await e.db.query("SELECT COUNT(*) AS n FROM productos"))[0].n, 2); // las tablas siguen intactas
  });

  it("los textos con comillas o comandos SQL se guardan tal cual, sin ejecutarse", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const p = await e.producto(uid, { nombre: "x'); DROP TABLE ventas; --", categoria: "'; DELETE FROM usuarios; --" });
    assert.equal(p.nombre, "x'); DROP TABLE ventas; --");
    assert.equal((await e.db.query("SELECT COUNT(*) AS n FROM usuarios"))[0].n, 1);
    assert.equal((await e.db.query("SELECT COUNT(*) AS n FROM ventas"))[0].n, 0); // la tabla sigue existiendo
  });

  it("el inicio de sesión no se puede saltar con inyección SQL", async () => {
    const e = crearEntorno();
    await e.nuevoUsuario("ana@prueba.cl");
    for (const correo of ["' OR '1'='1", "ana@prueba.cl' --", "ana@prueba.cl' OR 1=1 --"]) {
      await assert.rejects(() => e.s.usuarios.autenticar({ correo, password: "' OR '1'='1" }), rechazaCon(401));
    }
  });

  it("no se puede operar con ids de otra cuenta (productos, ventas y movimientos)", async () => {
    const e = crearEntorno();
    const ana = await e.nuevoUsuario();
    const beto = await e.nuevoUsuario();
    const p = await e.producto(ana);
    const venta = await e.s.ventas.crear(ana, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] });
    await assert.rejects(() => e.s.productos.movimientos(beto, p.id), rechazaCon(404));
    await assert.rejects(() => e.s.ventas.anular(beto, venta.id), rechazaCon(404));
    await assert.rejects(() => e.s.ventas.crear(beto, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 1 }] }), rechazaCon(404));
    assert.equal((await e.s.productos.obtener(ana, p.id)).stock, 9); // los intentos de Beto no cambiaron el stock de Ana
  });

  it("rechaza datos con tipo o tamaño inesperado", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const base = { precioCompra: 1, precioVenta: 2 };
    await assert.rejects(() => e.s.productos.crear(uid, { ...base, nombre: "n".repeat(121) }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { ...base, nombre: { $gt: "" } }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { ...base, nombre: ["a"] }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioCompra: "abc", precioVenta: 2 }), rechazaCon(400));
    await assert.rejects(() => e.s.productos.crear(uid, { nombre: "X", precioCompra: 1, precioVenta: 3_000_000_000 }), rechazaCon(400));
    const p = await e.producto(uid);
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: [{ productoId: p.id, cantidad: 100001 }] }), rechazaCon(400));
    await assert.rejects(() => e.s.ventas.crear(uid, { metodoPago: "Efectivo", items: "no es una lista" }), rechazaCon(400));
    await assert.rejects(() => e.s.asistente.preguntar(uid, { pregunta: { a: 1 } }), rechazaCon(400));
  });

  it("las contraseñas se guardan con sal: la misma clave genera hashes distintos y ambos verifican", async () => {
    const h1 = await hashPassword("secreto1");
    const h2 = await hashPassword("secreto1");
    assert.notEqual(h1, h2);
    assert.ok(await verificarPassword("secreto1", h1));
    assert.ok(await verificarPassword("secreto1", h2));
    assert.equal(await verificarPassword("otra", h1), false);
  });

  it("un hash guardado dañado o de otro tipo nunca valida", async () => {
    for (const malo of ["", "texto-plano", "scrypt$", "scrypt$zz$zz", "md5$abc$def", null, undefined]) {
      assert.equal(await verificarPassword("secreto1", malo), false);
    }
  });

  it("el servidor no arranca con una clave de sesión débil", () => {
    assert.throws(() => validarConfig(cargarConfig({ JWT_SECRET: "corta" })), /JWT_SECRET/);
    assert.throws(() => validarConfig(cargarConfig({})), /JWT_SECRET/);
    assert.doesNotThrow(() => validarConfig(cargarConfig({ JWT_SECRET: "x".repeat(32) })));
  });

  it("el límite de intentos frena la fuerza bruta, separa por IP y se reinicia", async () => {
    const limite = limitarIntentos({ ventanaMs: 40, max: 3 });
    const intento = (ip) => new Promise((resolve) => limite({ ip }, {}, (err) => resolve(err)));
    assert.equal(await intento("1.1.1.1"), undefined);
    assert.equal(await intento("1.1.1.1"), undefined);
    assert.equal(await intento("1.1.1.1"), undefined);
    const bloqueado = await intento("1.1.1.1");
    assert.ok(bloqueado instanceof ErrorHttp);
    assert.equal(bloqueado.status, 429);
    assert.equal(await intento("2.2.2.2"), undefined); // otra IP no se ve afectada
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(await intento("1.1.1.1"), undefined); // pasó la ventana: vuelve a permitir
  });

  it("los errores inesperados no filtran detalles internos al cliente", () => {
    const registrado = [];
    const middleware = manejarErrores((...a) => registrado.push(a));
    let estado, cuerpo;
    const res = { status(n) { estado = n; return this; }, json(o) { cuerpo = o; } };
    middleware(new Error("Access denied for user 'root'@'localhost' (password: YES)"), {}, res, () => {});
    assert.equal(estado, 500);
    assert.equal(cuerpo.error.codigo, "ERROR_INTERNO");
    const texto = JSON.stringify(cuerpo);
    assert.ok(!texto.includes("root") && !texto.includes("password") && !texto.includes("stack"));
    assert.equal(registrado.length, 1); // sí queda registrado en el servidor para poder investigarlo
  });
});
