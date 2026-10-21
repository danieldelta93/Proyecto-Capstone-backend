import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, escenarioVentas, sqliteDisponible, rechazaCon } from "./ayudas/entorno.js";

describe("asistente", { skip: !sqliteDisponible }, () => {
  const preguntar = (e, uid, pregunta) => e.s.asistente.preguntar(uid, { pregunta });

  it("sin clave de IA responde con reglas sobre los datos reales", async () => {
    const e = crearEntorno();
    const { uid } = await escenarioVentas(e);

    let r = await preguntar(e, uid, "¿Cuánto gané esta semana?");
    assert.equal(r.origen, "reglas");
    assert.match(r.respuesta, /invertiste \$5\.100/);
    assert.match(r.respuesta, /ganaste \$3\.400/);
    assert.match(r.respuesta, /40%/);

    r = await preguntar(e, uid, "¿Qué producto me deja más ganancia?");
    assert.match(r.respuesta, /Producto B/);
    assert.match(r.respuesta, /\$3\.000/);

    r = await preguntar(e, uid, "¿Qué producto debo comprar más?");
    assert.match(r.respuesta, /Producto C/);

    r = await preguntar(e, uid, "¿Qué productos tienen stock bajo?");
    assert.match(r.respuesta, /Producto C \(2 un\.\)/);

    r = await preguntar(e, uid, "¿Cuánto vendí esta semana?");
    assert.match(r.respuesta, /\$8\.500 en 3 ventas/);
    assert.match(r.respuesta, /70% más que la semana anterior/);

    r = await preguntar(e, uid, "¿Cuál es mi mejor día de ventas?");
    assert.match(r.respuesta, /sábado.*\$5\.000/); // el 10/10 (sábado) se vendieron $5.000

    r = await preguntar(e, uid, "¿Cuál es mi producto más vendido?");
    assert.match(r.respuesta, /Producto A.*6 unidades/);

    r = await preguntar(e, uid, "¿Qué producto se vende menos?");
    assert.match(r.respuesta, /Producto C/);

    r = await preguntar(e, uid, "¿Cuánto vale mi inventario?");
    assert.match(r.respuesta, /mercadería/);
  });

  it("responde con orientación cuando no entiende la pregunta", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    const r = await preguntar(e, uid, "hola, ¿qué tal?");
    assert.match(r.respuesta, /Puedo ayudarte con tus ventas e inventario/);
  });

  it("sin ventas no inventa cifras", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    assert.match((await preguntar(e, uid, "¿Cuánto gané esta semana?")).respuesta, /No registras ventas/);
    assert.match((await preguntar(e, uid, "¿Cuál es mi mejor día de ventas?")).respuesta, /Todavía no hay ventas/);
  });

  it("valida la pregunta", async () => {
    const e = crearEntorno();
    const uid = await e.nuevoUsuario();
    await assert.rejects(() => preguntar(e, uid, ""), rechazaCon(400));
    await assert.rejects(() => preguntar(e, uid, "x".repeat(501)), rechazaCon(400));
  });

  it("con clave de IA arma la petición al proveedor y usa su respuesta", async () => {
    const llamadas = [];
    const fetchFn = async (url, opciones) => {
      llamadas.push({ url, opciones });
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "  Respuesta de la IA  " } }] }) };
    };
    const e = crearEntorno({ fetchFn });
    e.config.llm.apiKey = "clave-secreta";
    const { uid } = await escenarioVentas(e);
    const r = await preguntar(e, uid, "¿Cómo voy?");
    assert.deepEqual(r, { respuesta: "Respuesta de la IA", origen: "ia" });

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, "https://llm.test/v1/chat/completions");
    assert.equal(llamadas[0].opciones.headers.Authorization, "Bearer clave-secreta");
    const cuerpo = JSON.parse(llamadas[0].opciones.body);
    assert.equal(cuerpo.model, "modelo-prueba");
    assert.equal(cuerpo.messages[0].role, "system");
    assert.match(cuerpo.messages[1].content, /¿Cómo voy\?/);
    assert.match(cuerpo.messages[1].content, /Producto A/); // lleva los datos del negocio
    assert.ok(!cuerpo.messages[1].content.includes("_ventasPorProducto")); // y no los datos internos
  });

  it("si el proveedor de IA falla, responde con reglas y registra el error", async () => {
    const errores = [];
    const fetchFn = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const e = crearEntorno({ fetchFn, registrarError: (...a) => errores.push(a.join(" ")) });
    e.config.llm.apiKey = "clave";
    const uid = await e.nuevoUsuario();
    const r = await preguntar(e, uid, "¿Qué productos tienen stock bajo?");
    assert.equal(r.origen, "reglas");
    assert.equal(errores.length, 1);
    assert.match(errores[0], /500/);
  });
});
