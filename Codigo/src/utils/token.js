import jwt from "jsonwebtoken";

export function firmarToken(usuario, secreto, expira) {
  return jwt.sign({ sub: String(usuario.id) }, secreto, { expiresIn: expira, algorithm: "HS256" });
}

export function verificarToken(token, secreto) {
  return jwt.verify(token, secreto, { algorithms: ["HS256"] });
}
