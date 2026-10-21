// Error con código HTTP y un código interno que el frontend puede reconocer.
export class ErrorHttp extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const datosInvalidos = (mensaje, detalles) => new ErrorHttp(400, "DATOS_INVALIDOS", mensaje, detalles);
export const noAutorizado = (mensaje) => new ErrorHttp(401, "NO_AUTORIZADO", mensaje);
export const noEncontrado = (mensaje) => new ErrorHttp(404, "NO_ENCONTRADO", mensaje);
export const conflicto = (codigo, mensaje, detalles) => new ErrorHttp(409, codigo, mensaje, detalles);
