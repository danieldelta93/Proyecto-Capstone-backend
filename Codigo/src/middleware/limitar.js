import { ErrorHttp } from "../utils/errores.js";

// Limita los intentos por IP (frena la adivinación de contraseñas).
// Es en memoria: sirve para un solo servidor, que es el caso de este proyecto.
export function limitarIntentos({ ventanaMs = 15 * 60 * 1000, max = 20 } = {}) {
  const intentos = new Map();
  return (req, res, next) => {
    const ahora = Date.now();
    const clave = req.ip || "desconocida";
    const actual = intentos.get(clave);
    if (!actual || ahora > actual.reinicio) {
      intentos.set(clave, { cuenta: 1, reinicio: ahora + ventanaMs });
      return next();
    }
    actual.cuenta += 1;
    if (actual.cuenta > max) {
      return next(new ErrorHttp(429, "DEMASIADOS_INTENTOS", "Demasiados intentos, espera unos minutos e inténtalo de nuevo"));
    }
    next();
  };
}
