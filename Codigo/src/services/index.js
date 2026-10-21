import { hoyISO } from "../utils/fechas.js";
import { crearUsuariosService } from "./usuarios.service.js";
import { crearProductosService } from "./productos.service.js";
import { crearVentasService } from "./ventas.service.js";
import { crearEstadisticasService } from "./estadisticas.service.js";
import { crearAsistenteService } from "./asistente.service.js";

// Arma todos los servicios. `hoy` y `fetchFn` se pueden reemplazar (lo usan las pruebas).
export function crearServicios(db, config, { hoy, fetchFn, registrarError } = {}) {
  const reloj = hoy ?? (() => hoyISO(config.zonaHoraria));
  const estadisticas = crearEstadisticasService(db, { hoy: reloj });
  return {
    usuarios: crearUsuariosService(db),
    productos: crearProductosService(db),
    ventas: crearVentasService(db, { hoy: reloj }),
    estadisticas,
    asistente: crearAsistenteService({ estadisticas, hoy: reloj, llm: config.llm, fetchFn, registrarError }),
  };
}
