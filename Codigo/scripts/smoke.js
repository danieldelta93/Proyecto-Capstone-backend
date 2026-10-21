// Prueba de humo: recorre las funciones principales de la API contra el servidor
// que está corriendo (npm run dev) y muestra ✔ o ✘ en cada paso.
//
//   npm run smoke                      (usa http://localhost:3000/api)
//   API_URL=http://otra-direccion/api npm run smoke
//
// Crea una cuenta nueva con un correo aleatorio, así que se puede repetir sin problemas.
const BASE = process.env.API_URL || "http://localhost:3000/api";
let token = "";
let fallos = 0;

async function llamar(metodo, ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, datos: texto ? JSON.parse(texto) : null };
}

async function paso(nombre, fn) {
  try {
    await fn();
    console.log(`  ✔ ${nombre}`);
  } catch (error) {
    fallos += 1;
    console.log(`  ✘ ${nombre}\n      ${error.message}`);
  }
}
const esperar = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

console.log(`Probando ${BASE}\n`);
const correo = `humo${Date.now()}@prueba.cl`;
let productoId, ventaId;

await paso("la API y la base de datos responden", async () => {
  const r = await llamar("GET", "/salud");
  esperar(r.status === 200 && r.datos.ok, `respondió ${r.status}: ${JSON.stringify(r.datos)}`);
});
await paso("registrar una cuenta", async () => {
  const r = await llamar("POST", "/auth/registro", { correo, password: "secreto1", nombreNegocio: "Negocio de prueba", nombreDueno: "Prueba" });
  esperar(r.status === 201 && r.datos.token, `respondió ${r.status}: ${JSON.stringify(r.datos)}`);
  token = r.datos.token;
});
await paso("iniciar sesión", async () => {
  const r = await llamar("POST", "/auth/login", { correo, password: "secreto1" });
  esperar(r.status === 200 && r.datos.token, `respondió ${r.status}`);
});
await paso("crear un producto (compra $3.000, venta $5.000)", async () => {
  const r = await llamar("POST", "/productos", { nombre: "Gorro", categoria: "Gorros", precioCompra: 3000, precioVenta: 5000, stock: 10, stockMinimo: 3 });
  esperar(r.status === 201 && r.datos.gananciaUnitaria === 2000, `respondió ${r.status}: ${JSON.stringify(r.datos)}`);
  productoId = r.datos.id;
});
await paso("registrar una venta de 3 unidades", async () => {
  const r = await llamar("POST", "/ventas", { metodoPago: "Efectivo", items: [{ productoId, cantidad: 3 }] });
  esperar(r.status === 201 && r.datos.total === 15000 && r.datos.ganancia === 6000, `respondió ${r.status}: ${JSON.stringify(r.datos)}`);
  ventaId = r.datos.id;
});
await paso("el stock bajó a 7", async () => {
  const r = await llamar("GET", `/productos/${productoId}`);
  esperar(r.datos.stock === 7, `stock = ${r.datos.stock}`);
});
await paso("no deja vender más de lo que hay (409)", async () => {
  const r = await llamar("POST", "/ventas", { metodoPago: "Efectivo", items: [{ productoId, cantidad: 100 }] });
  esperar(r.status === 409 && r.datos.error.codigo === "STOCK_INSUFICIENTE", `respondió ${r.status}`);
});
await paso("el resumen del panel suma la venta", async () => {
  const r = await llamar("GET", "/estadisticas/resumen?dias=7");
  esperar(r.datos.ingresos === 15000 && r.datos.ganancia === 6000, JSON.stringify(r.datos));
});
await paso("ventas por día devuelve 7 días", async () => {
  const r = await llamar("GET", "/estadisticas/ventas-por-dia?dias=7");
  esperar(r.datos.length === 7, `devolvió ${r.datos.length}`);
});
await paso("productos más vendidos", async () => {
  const r = await llamar("GET", "/estadisticas/productos-mas-vendidos");
  esperar(r.datos[0]?.cantidad === 3, JSON.stringify(r.datos));
});
await paso("el asistente responde", async () => {
  const r = await llamar("POST", "/asistente/preguntar", { pregunta: "¿Cuánto gané esta semana?" });
  esperar(r.status === 200 && r.datos.respuesta, `respondió ${r.status}`);
});
await paso("anular la venta devuelve el stock", async () => {
  const a = await llamar("POST", `/ventas/${ventaId}/anular`);
  esperar(a.datos.estado === "anulada", "no quedó anulada");
  const p = await llamar("GET", `/productos/${productoId}`);
  esperar(p.datos.stock === 10, `stock = ${p.datos.stock}`);
});
await paso("sin sesión no se puede entrar (401)", async () => {
  const guardado = token;
  token = "";
  const r = await llamar("GET", "/productos");
  token = guardado;
  esperar(r.status === 401, `respondió ${r.status}`);
});
await paso("otra cuenta no ve los productos ajenos", async () => {
  const guardado = token;
  const r1 = await llamar("POST", "/auth/registro", { correo: `otro${Date.now()}@prueba.cl`, password: "secreto1", nombreNegocio: "Otro", nombreDueno: "Otro" });
  token = r1.datos.token;
  const r2 = await llamar("GET", "/productos");
  token = guardado;
  esperar(r2.datos.length === 0, `veía ${r2.datos.length} productos`);
});

console.log(fallos ? `\n${fallos} paso(s) fallaron.` : "\nTodo OK ✔");
process.exit(fallos ? 1 : 0);
