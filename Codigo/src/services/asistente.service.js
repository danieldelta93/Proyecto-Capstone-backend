import { texto } from "../utils/validar.js";
import { pesos } from "../utils/pesos.js";

// Asistente de recomendaciones. Funciona en dos modos:
//  1) Con LLM_API_KEY configurada: le manda a un modelo de IA (cualquier proveedor
//     compatible con "chat completions" de OpenAI) un resumen de los datos del negocio
//     y su pregunta. La clave vive solo en el servidor, nunca en el frontend.
//  2) Sin clave (o si el proveedor falla): responde con reglas sobre los datos reales.

const SISTEMA =
  "Eres el asistente de Vendix, una app de ventas e inventario para vendedores ambulantes y pequeños negocios " +
  "en Chile. Responde en español simple, breve y amable, sin tecnicismos. Usa SOLO los datos del negocio que se " +
  "te entregan en JSON; si no alcanzan para responder, dilo y explica qué dato falta. Los montos están en pesos " +
  "chilenos. No inventes cifras ni des consejos legales o tributarios.";

const sinTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function responderConReglas(pregunta, c) {
  const q = sinTildes(pregunta);

  if (/mas ganancia|producto.*(ganancia|gano)|(ganancia|gano).*producto/.test(q)) {
    const mejor = c.productosMasGanancia.find((p) => p.ganancia > 0);
    if (!mejor) return "Todavía no puedo calcularlo: necesito ventas de productos con precio de compra registrado.";
    return `En los últimos 30 días, el producto que más ganancia te dejó fue "${mejor.nombre}": ${pesos(mejor.ganancia)} (vendiste ${mejor.cantidad} unidades).`;
  }

  if (/gane|ganancia|invert/.test(q)) {
    const r = c.ultimos7;
    if (r.ingresos === 0) return "No registras ventas en los últimos 7 días, así que todavía no hay ganancia que calcular.";
    if (r.invertido === 0 && r.ganancia === 0 && r.ventasSinCosto > 0) {
      return "Todavía no puedo calcularlo: agrega el precio de compra a tus productos y te digo cuánto inviertes y cuánto ganas.";
    }
    const aviso = r.ventasSinCosto
      ? ` Ojo: no conté ${r.ventasSinCosto} venta${r.ventasSinCosto === 1 ? "" : "s"} porque algún producto no tiene precio de compra.`
      : "";
    return `En los últimos 7 días invertiste ${pesos(r.invertido)} en la mercadería que vendiste y ganaste ${pesos(r.ganancia)}` +
      (r.margenPct !== null ? ` (margen de ${Math.round(r.margenPct)}%).` : ".") + aviso;
  }

  if (/comprar|reponer|restock|repongo/.test(q)) {
    if (!c.stockBajo.length) return "Tu stock está bien por ahora, no veo productos urgentes por reponer.";
    const vendido = new Map(c._ventasPorProducto.map((p) => [p.productoId, p.cantidad]));
    const elegido = [...c.stockBajo].sort(
      (a, b) => (vendido.get(b.productoId) ?? 0) / (b.stock + 1) - (vendido.get(a.productoId) ?? 0) / (a.stock + 1)
    )[0];
    const v = vendido.get(elegido.productoId) ?? 0;
    return `Te recomiendo reponer "${elegido.nombre}": quedan ${elegido.stock} unidades (tu mínimo es ${elegido.stockMinimo})` +
      (v ? ` y vendiste ${v} en los últimos 30 días.` : ".");
  }

  if (/mejor dia/.test(q)) {
    const mejor = [...c.ventasPorDiaSemana].sort((a, b) => b.total - a.total)[0];
    if (!mejor || mejor.total === 0) return "Todavía no hay ventas suficientes para saber cuál es tu mejor día.";
    return `Tu mejor día de ventas es el ${mejor.dia.toLowerCase()}: ${pesos(mejor.total)} en total en los últimos 90 días.`;
  }

  if (/stock bajo|agotando|agotar|poco stock|quedan pocos/.test(q)) {
    if (!c.stockBajo.length) return "Ningún producto está bajo el mínimo de stock ahora mismo.";
    return "Estos productos están con stock bajo: " + c.stockBajo.map((p) => `${p.nombre} (${p.stock} un.)`).join(", ") + ".";
  }

  if (/menos vendido|se vende menos|vende menos|menos se vende|peor|no se vende|no vendo/.test(q)) {
    const p = c.menosVendidos[0];
    if (!p) return "Todavía no tienes productos registrados.";
    return `En los últimos 30 días, el producto que menos se vendió es "${p.nombre}" (${p.cantidad} unidades).`;
  }

  if (/mas vendido|mejor producto|que mas vendo|se vende mas|vende mas|mas se vende/.test(q)) {
    const p = c.masVendidos[0];
    if (!p) return "Todavía no hay suficientes ventas registradas para saberlo.";
    return `Tu producto más vendido de los últimos 30 días es "${p.nombre}", con ${p.cantidad} unidades.`;
  }

  if (/cuanto vendi|semana/.test(q)) {
    const r = c.ultimos7;
    let t = `En los últimos 7 días vendiste ${pesos(r.ingresos)} en ${r.ventas} venta${r.ventas === 1 ? "" : "s"}.`;
    if (r.variacionIngresosPct !== null) {
      t += ` Eso es ${r.variacionIngresosPct >= 0 ? "un" : ""} ${Math.abs(r.variacionIngresosPct)}% ${r.variacionIngresosPct >= 0 ? "más" : "menos"} que la semana anterior.`;
    }
    return t;
  }

  if (/inventario|mercaderia|cuanto tengo/.test(q)) {
    const i = c.inventario;
    if (i.productosConCosto === 0) return "Para calcular el valor de tu inventario necesito el precio de compra de tus productos.";
    return `Tienes ${pesos(i.costo)} en mercadería (a precio de compra). Si la vendes toda, ganarías ${pesos(i.gananciaPotencial)}.` +
      (i.productosSinCosto ? ` No incluye ${i.productosSinCosto} producto${i.productosSinCosto === 1 ? "" : "s"} sin precio de compra.` : "");
  }

  return "Puedo ayudarte con tus ventas e inventario. Prueba preguntando qué producto debes reponer, cuál es tu mejor día de ventas, cuánto ganaste esta semana o qué productos tienen stock bajo.";
}

async function consultarLLM({ pregunta, contexto, llm, fetchFn }) {
  const { _ventasPorProducto, ...datos } = contexto; // lo interno no se envía
  const respuesta = await fetchFn(`${llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${llm.apiKey}` },
    body: JSON.stringify({
      model: llm.modelo,
      temperature: 0.2,
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: `Datos del negocio (JSON):\n${JSON.stringify(datos)}\n\nPregunta del comerciante: ${pregunta}` },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!respuesta.ok) throw new Error(`El proveedor de IA respondió ${respuesta.status}`);
  const json = await respuesta.json();
  const contenido = json?.choices?.[0]?.message?.content;
  if (typeof contenido !== "string" || !contenido.trim()) throw new Error("Respuesta vacía del proveedor de IA");
  return contenido.trim();
}

export function crearAsistenteService({ estadisticas, hoy, llm, fetchFn = globalThis.fetch, registrarError = console.error }) {
  async function construirContexto(usuarioId) {
    const [ultimos7, ultimos30, masVendidos, menosVendidos, productosMasGanancia, stockBajo, inventario, ventasPorDiaSemana, ventasPorProducto] =
      await Promise.all([
        estadisticas.resumen(usuarioId, { dias: 7 }),
        estadisticas.resumen(usuarioId, { dias: 30 }),
        estadisticas.productosTop(usuarioId, { dias: 30, limite: 5 }),
        estadisticas.productosMenosVendidos(usuarioId, { dias: 30, limite: 5 }),
        estadisticas.productosTop(usuarioId, { dias: 30, limite: 5, orden: "ganancia" }),
        estadisticas.stockBajo(usuarioId),
        estadisticas.valorInventario(usuarioId),
        estadisticas.ventasPorDiaSemana(usuarioId, { dias: 90 }),
        estadisticas.productosTop(usuarioId, { dias: 30, limite: 100 }),
      ]);
    return {
      hoy: hoy(), ultimos7, ultimos30, masVendidos, menosVendidos, productosMasGanancia,
      stockBajo, inventario, ventasPorDiaSemana, _ventasPorProducto: ventasPorProducto,
    };
  }

  return {
    async preguntar(usuarioId, datos) {
      const pregunta = texto(datos.pregunta, "pregunta", { max: 500 });
      const contexto = await construirContexto(usuarioId);
      if (llm?.apiKey) {
        try {
          return { respuesta: await consultarLLM({ pregunta, contexto, llm, fetchFn }), origen: "ia" };
        } catch (error) {
          registrarError("El asistente de IA falló, se responde con reglas:", error.message);
        }
      }
      return { respuesta: responderConReglas(pregunta, contexto), origen: "reglas" };
    },
  };
}
