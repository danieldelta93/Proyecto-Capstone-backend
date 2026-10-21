import { ErrorHttp } from "../utils/errores.js";

export function rutaNoEncontrada(req, res, next) {
  next(new ErrorHttp(404, "RUTA_NO_ENCONTRADA", `No existe ${req.method} ${req.path}`));
}

// Todas las respuestas de error tienen el mismo formato:
//   { "error": { "codigo": "...", "mensaje": "...", "detalles": {...} } }
export function manejarErrores(registrar = console.error) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (err instanceof ErrorHttp) {
      return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles } });
    }
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
      return res.status(400).json({ error: { codigo: "JSON_INVALIDO", mensaje: "El cuerpo de la petición no es un JSON válido" } });
    }
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: { codigo: "CUERPO_MUY_GRANDE", mensaje: "La petición es demasiado grande" } });
    }
    registrar("Error no controlado:", err);
    res.status(500).json({ error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error en el servidor" } });
  };
}
