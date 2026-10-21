import { crearDbPrueba, sqliteDisponible } from "./db-sqlite.js";
import { crearServicios } from "../../src/services/index.js";

export { sqliteDisponible };
export const HOY = "2026-10-19"; // un lunes

export function crearEntorno({ fetchFn, registrarError } = {}) {
  const db = crearDbPrueba();
  const config = {
    zonaHoraria: "America/Santiago",
    llm: { apiKey: "", baseUrl: "https://llm.test/v1", modelo: "modelo-prueba" },
  };
  const s = crearServicios(db, config, { hoy: () => HOY, fetchFn, registrarError });
  let n = 0;
  return {
    db, s, config,
    async nuevoUsuario(correo = `usuario${++n}@prueba.cl`) {
      const u = await s.usuarios.registrar({ correo, password: "secreto1", nombreNegocio: "Negocio", nombreDueno: "Dueño" });
      return u.id;
    },
    producto(usuarioId, extra = {}) {
      return s.productos.crear(usuarioId, {
        nombre: "Producto", categoria: "General", precioCompra: 600, precioVenta: 1000, stock: 10, stockMinimo: 3, ...extra,
      });
    },
  };
}

// Escenario con ventas en varias fechas para probar estadísticas y asistente
export async function escenarioVentas(e) {
  const uid = await e.nuevoUsuario();
  const A = await e.producto(uid, { nombre: "Producto A", precioCompra: 600, precioVenta: 1000, stock: 100 });
  const B = await e.producto(uid, { nombre: "Producto B", precioCompra: 1500, precioVenta: 2500, stock: 100 });
  const C = await e.producto(uid, { nombre: "Producto C", precioCompra: 100, precioVenta: 300, stock: 2, stockMinimo: 3 });
  const vender = (fecha, items, metodoPago = "Efectivo") => e.s.ventas.crear(uid, { fecha, metodoPago, items });
  await vender("2026-10-19", [{ productoId: A.id, cantidad: 2 }]);
  await vender("2026-10-18", [{ productoId: B.id, cantidad: 1 }, { productoId: A.id, cantidad: 1 }], "Tarjeta");
  await vender("2026-10-14", [{ productoId: A.id, cantidad: 3 }]);
  await vender("2026-10-10", [{ productoId: B.id, cantidad: 2 }], "Transferencia");
  const anulada = await vender("2026-10-19", [{ productoId: A.id, cantidad: 5 }]);
  await e.s.ventas.anular(uid, anulada.id);
  return { uid, A, B, C };
}

export const rechazaCon = (status, codigo) => (e) => e.status === status && (codigo === undefined || e.codigo === codigo);
