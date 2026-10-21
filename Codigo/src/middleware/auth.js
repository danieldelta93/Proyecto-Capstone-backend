import { verificarToken } from "../utils/token.js";
import { noAutorizado } from "../utils/errores.js";

// Exige "Authorization: Bearer <token>" y deja el id del usuario en req.usuarioId
export function autenticar(config) {
  return (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token) return next(noAutorizado("Debes iniciar sesión"));
    try {
      req.usuarioId = Number(verificarToken(token, config.jwt.secreto).sub);
      next();
    } catch {
      next(noAutorizado("Tu sesión no es válida o expiró, inicia sesión de nuevo"));
    }
  };
}
