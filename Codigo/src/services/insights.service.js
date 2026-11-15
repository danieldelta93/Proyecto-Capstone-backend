import { createHash } from "node:crypto";

const INTERVALO_MINIMO_MS = 2 * 60 * 1000;
const MAX_CACHE = 500;

const hash = (valor) => createHash("sha256").update(JSON.stringify(valor)).digest("hex");

function crearHallazgos({ resumen, top, menos, stockBajo, inventario, productos }) {
  const tarjetas = [];

  if (stockBajo.length) {
    tarjetas.push({
      id: "stock-bajo",
      tipo: "alerta",
      titulo: stockBajo.length === 1 ? "Producto con stock bajo" : "Productos con stock bajo",
      descripcion: stockBajo.map((p) => `${p.nombre}: quedan ${p.stock} (mínimo ${p.stockMinimo})`).join("; "),
      accion: "Revisa estos productos y evalúa reponerlos según su movimiento y el dinero disponible.",
      prioridad: "alta",
      evidencia: stockBajo,
    });
  }

  const idsVendidos = new Set(top.map((p) => p.productoId).filter((id) => id !== null));
  const sinVentas = menos
    .filter((p) => p.cantidad === 0 && productos.some((x) => x.id === p.productoId && x.stock > 0))
    .slice(0, 3);

  if (sinVentas.length) {
    tarjetas.push({
      id: "productos-sin-ventas",
      tipo: "oportunidad",
      titulo: "Productos sin ventas recientes",
      descripcion: sinVentas.map((p) => p.nombre).join(", "),
      accion: "Prueba mostrarlos junto a productos que sí se venden. Antes de ofrecer descuentos, revisa el margen.",
      prioridad: "media",
      evidencia: sinVentas,
    });
  }

  if (resumen.ventas > 0) {
    tarjetas.push({
      id: "resumen-periodo",
      tipo: "resumen",
      titulo: "Tu negocio en los últimos 7 días",
      descripcion: `${resumen.ventas} venta(s), ingresos de ${resumen.ingresos} pesos y ganancia estimada de ${resumen.ganancia} pesos.`,
      accion: resumen.ventasSinCosto > 0
        ? `Hay ${resumen.ventasSinCosto} venta(s) con productos sin costo de compra registrado; completa esos costos para mejorar el cálculo.`
        : "Sigue registrando tus ventas para comparar resultados con más información.",
      prioridad: "baja",
      evidencia: { ventas: resumen.ventas, ingresos: resumen.ingresos, invertido: resumen.invertido, ganancia: resumen.ganancia, margenPct: resumen.margenPct, ventasSinCosto: resumen.ventasSinCosto },
    });
  }

  const mejorProducto = top.find((p) => p.cantidad > 0 && p.ganancia > 0);
  if (mejorProducto) {
    tarjetas.push({
      id: "producto-destacado",
      tipo: "recomendacion",
      titulo: "Producto que aporta ganancias",
      descripcion: `${mejorProducto.nombre}: ${mejorProducto.cantidad} unidad(es) vendidas y ${mejorProducto.ganancia} pesos de ganancia estimada en 30 días.`,
      accion: "Revisa cuánto stock queda y mantén actualizado su costo de compra para seguir midiendo su rentabilidad.",
      prioridad: "media",
      evidencia: mejorProducto,
    });
  }

  if (!tarjetas.length) {
    tarjetas.push({
      id: "primeros-pasos",
      tipo: "recomendacion",
      titulo: "Empecemos a conocer tu negocio",
      descripcion: "Todavía no hay suficientes movimientos para detectar oportunidades concretas.",
      accion: "Registra tus productos con precio de compra y venta, y anota cada venta. Con esos datos podremos entregarte recomendaciones más útiles.",
      prioridad: "baja",
      evidencia: { productos: inventario.productos, productosConCosto: inventario.productosConCosto },
    });
  }

  return tarjetas;
}

async function mejorarConIA(tarjetas, llm, fetchFn) {
  if (!llm?.apiKey || !llm?.baseUrl || !llm?.modelo) return { tarjetas, origen: "reglas" };

  try {
    const respuesta = await fetchFn(`${llm.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${llm.apiKey}` },
      body: JSON.stringify({
        model: llm.modelo,
        messages: [
          {
            role: "system",
            content: "Eres Vendix AI, un asesor comercial simpático y sencillo para pequeños negocios de Chile. Reescribe las descripciones y acciones de las tarjetas para que sean claras, cercanas y prácticas. Usa exclusivamente la evidencia recibida. No inventes cifras, causas, tendencias ni productos. Conserva exactamente los campos id, tipo, titulo, prioridad y evidencia. Devuelve únicamente un JSON válido con la forma {\"tarjetas\":[{\"id\":\"...\",\"descripcion\":\"...\",\"accion\":\"...\"}]}.",
          },
          { role: "user", content: JSON.stringify({ tarjetas: tarjetas.map(({ id, tipo, titulo, descripcion, accion, prioridad, evidencia }) => ({ id, tipo, titulo, descripcion, accion, prioridad, evidencia })) }) },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!respuesta.ok) throw new Error(`Proveedor IA respondió ${respuesta.status}`);
    const json = await respuesta.json();
    let contenido = json?.choices?.[0]?.message?.content;
    if (typeof contenido !== "string") throw new Error("Respuesta vacía de IA");
    contenido = contenido.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(contenido);
    if (!Array.isArray(parsed.tarjetas)) throw new Error("Formato de IA inválido");

    const mejoras = new Map(parsed.tarjetas.map((t) => [t.id, t]));
    const resultado = tarjetas.map((t) => {
      const mejora = mejoras.get(t.id);
      return {
        ...t,
        descripcion: typeof mejora?.descripcion === "string" && mejora.descripcion.trim() ? mejora.descripcion.trim().slice(0, 500) : t.descripcion,
        accion: typeof mejora?.accion === "string" && mejora.accion.trim() ? mejora.accion.trim().slice(0, 500) : t.accion,
      };
    });
    return { tarjetas: resultado, origen: "ia" };
  } catch {
    return { tarjetas, origen: "reglas" };
  }
}

export function crearInsightsService({ estadisticas, productos, hoy, llm, fetchFn = globalThis.fetch, registrarError = console.error, relojMs = Date.now }) {
  const cache = new Map();

  async function obtenerSnapshot(usuarioId) {
    const [resumen, top, menos, stockBajo, inventario, listaProductos] = await Promise.all([
      estadisticas.resumen(usuarioId, { dias: 7 }),
      estadisticas.productosTop(usuarioId, { dias: 30, limite: 5 }),
      estadisticas.productosMenosVendidos(usuarioId, { dias: 30, limite: 100 }),
      estadisticas.stockBajo(usuarioId),
      estadisticas.valorInventario(usuarioId),
      productos.listar(usuarioId),
    ]);

    const productosRelevantes = listaProductos.map((p) => ({
      id: p.id, nombre: p.nombre, precioCompra: p.precioCompra, precioVenta: p.precioVenta,
      stock: p.stock, stockMinimo: p.stockMinimo,
    }));
    const datos = { resumen, top, menos, stockBajo, inventario, productos: productosRelevantes };
    return { datos, huella: hash(datos) };
  }

  async function generar(usuarioId, { forzar = false } = {}) {
    const ahora = relojMs();
    const anterior = cache.get(usuarioId);
    const { datos, huella } = await obtenerSnapshot(usuarioId);

    if (!forzar && anterior?.huella === huella) {
      return { ...anterior.resultado, actualizado: false, pendienteActualizacion: false };
    }

    if (anterior && ahora - anterior.generadoMs < INTERVALO_MINIMO_MS) {
      return { ...anterior.resultado, actualizado: false, pendienteActualizacion: true };
    }

    const base = crearHallazgos(datos);
    let resultado;
    try {
      const mejorado = await mejorarConIA(base, llm, fetchFn);
      resultado = { generadoEn: hoy(), origen: mejorado.origen, tarjetas: mejorado.tarjetas };
    } catch (error) {
      registrarError("No se pudo generar Vendix Insights:", error.message);
      resultado = { generadoEn: hoy(), origen: "reglas", tarjetas: base };
    }

    cache.set(usuarioId, { huella, generadoMs: ahora, resultado });
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);

    return { ...resultado, actualizado: true, pendienteActualizacion: false };
  }

  return {
    obtener: (usuarioId) => generar(usuarioId),
    actualizar: (usuarioId) => generar(usuarioId, { forzar: true }),
  };
}
