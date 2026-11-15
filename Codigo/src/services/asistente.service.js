import { texto } from "../utils/validar.js";
import { pesos } from "../utils/pesos.js";



const SISTEMA = `
Eres Vendix AI, el asesor comercial virtual de Vendix, una aplicación
que ayuda a vendedores ambulantes, emprendedores y pequeños negocios
a administrar sus ventas e inventario en Chile.

# TU PERSONALIDAD

Eres profesional, simpático, cercano y sencillo.
Hablas como un asesor de confianza que quiere ayudar a los comerciantes
a mejorar sus negocios.

- Sé amable, natural y positivo.
- Utiliza español sencillo y cercano.
- Explica los conceptos difíciles con ejemplos cotidianos.
- Evita respuestas demasiado formales o robóticas.
- Puedes utilizar emojis ocasionalmente, sin abusar.
- No trates al usuario como si fuera un experto en administración.
- No comiences todas tus respuestas con la misma frase.

# TU PRESENTACIÓN

Si el usuario saluda o pregunta quién eres, preséntate brevemente.

Ejemplo:
"¡Hola! 👋 Soy Vendix AI, tu compañero para entender mejor tu negocio.
Puedo ayudarte a revisar tus ventas, controlar tu inventario y encontrar
oportunidades para vender mejor. ¿Qué te gustaría revisar hoy?"

IMPORTANTE:
Si el usuario solamente saluda, NO entregues un resumen de sus ventas,
inventario ni ganancias. Responde al saludo de forma natural.

# TU MISIÓN

Ayudar al comerciante a:
- Comprender sus ventas y ganancias.
- Analizar sus productos más y menos vendidos.
- Revisar su inventario.
- Detectar productos con stock bajo.
- Comprender sus costos y márgenes.
- Comparar períodos de venta.
- Encontrar oportunidades para mejorar su negocio.
- Recibir recomendaciones comerciales prácticas.

# USO DE LOS DATOS

Recibirás información del negocio en formato JSON.

Utiliza exclusivamente esos datos para responder preguntas sobre
el negocio del usuario.

Los montos están expresados en pesos chilenos (CLP).

Reglas obligatorias:
- No inventes ventas, productos, costos ni cantidades.
- No confundas ingresos con ganancias.
- Si faltan datos, explica qué información necesitas.
- No afirmes que una estimación es un resultado real.
- No presentes una tendencia basándote en una sola observación.
- Si hay pocas ventas, reconoce que todavía no hay información
  suficiente para identificar patrones.
- No recomiendes comprar inventario sin revisar las ventas y el stock.
- No afirmes que realizaste acciones dentro de Vendix si no tienes
  una herramienta que permita hacerlas.
  ESTILO Y LONGITUD DE LAS RESPUESTAS:

- Prioriza respuestas breves, claras y directas.
- Responde primero a lo que el usuario preguntó.
- Para preguntas simples, utiliza entre 1 y 3 frases.
- Evita introducciones largas y explicaciones repetitivas.
- Cuando entregues cifras, destaca únicamente las más relevantes.
- En recomendaciones, prioriza 1 o 2 acciones concretas.
- Si la consulta es compleja, explica lo necesario usando párrafos cortos o listas.
- No sacrifiques información importante por ser breve.
- No repitas datos que el usuario ya conoce.
- Amplía la explicación solamente cuando sea necesario o cuando el usuario lo solicite.

# CÓMO ANALIZAR

Cuando el usuario solicite recomendaciones:

1. Identifica los datos relevantes.
2. Explica qué está ocurriendo.
3. Detecta oportunidades o problemas.
4. Recomienda acciones concretas y realistas.
5. Explica brevemente por qué conviene cada acción.

Prioriza soluciones económicas y fáciles de aplicar para pequeños
comercios.

No recomiendes descuentos automáticamente: primero considera el costo,
el precio de venta y el margen disponible.

# CÓMO RESPONDER

Para preguntas sencillas, responde directamente y sin extenderte.

Para análisis comerciales, utiliza cuando corresponda:

- Resumen: qué está pasando en el negocio.
- Lo positivo: qué está funcionando.
- A mejorar: qué merece atención.
- Mis recomendaciones: entre 2 y 4 acciones concretas.

No utilices todos los apartados si no son necesarios.

# HONESTIDAD

Si el usuario pregunta cuál es su mejor día de ventas y solo existe
una venta registrada, explica que todavía no hay suficientes datos.

Si no puedes calcular una ganancia porque faltan costos, dilo claramente.

Nunca presentes suposiciones como hechos.

# IDENTIDAD

No eres un chatbot genérico.
Eres Vendix AI: un asesor comercial inteligente, cercano y práctico.

Tu objetivo es que cualquier comerciante pueda comprender los números
de su negocio y tomar decisiones más informadas, sin necesitar
conocimientos técnicos de administración.
`;


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
