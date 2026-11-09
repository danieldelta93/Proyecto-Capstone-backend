import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Pruebas de las sesiones (tokens JWT). Necesitan la librería "jsonwebtoken" (se instala con npm install);
// si no está disponible, estas pruebas se omiten.
let firmarToken, verificarToken, autenticar, disponible = false;
try {
  ({ firmarToken, verificarToken } = await import("../src/utils/token.js"));
  ({ autenticar } = await import("../src/middleware/auth.js"));
  disponible = true;
} catch {
  /* sin jsonwebtoken instalada */
}

const SECRETO = "s".repeat(40);
const base64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("sesiones (token JWT)", { skip: !disponible }, () => {
  const pasar = (headers) =>
    new Promise((resolve) => {
      const req = { headers };
      autenticar({ jwt: { secreto: SECRETO } })(req, {}, (err) => resolve({ err, req }));
    });

  it("un token válido identifica a la cuenta", () => {
    const token = firmarToken({ id: 7 }, SECRETO, "1h");
    assert.equal(verificarToken(token, SECRETO).sub, "7");
  });

  it("rechaza un token firmado con otra clave", () => {
    const token = firmarToken({ id: 7 }, "otra-clave-distinta-de-40-caracteres-o-mas", "1h");
    assert.throws(() => verificarToken(token, SECRETO));
  });

  it("rechaza un token manipulado (cambiar a qué cuenta pertenece)", () => {
    const [cabecera, , firma] = firmarToken({ id: 7 }, SECRETO, "1h").split(".");
    const falso = [cabecera, base64url({ sub: "1", iat: Math.floor(Date.now() / 1000) }), firma].join(".");
    assert.throws(() => verificarToken(falso, SECRETO));
  });

  it("rechaza un token vencido", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const vencido = jwt.sign({ sub: "7", exp: Math.floor(Date.now() / 1000) - 60 }, SECRETO, { algorithm: "HS256" });
    assert.throws(() => verificarToken(vencido, SECRETO));
  });

  it('rechaza un token sin firma ("alg: none")', () => {
    const sinFirma = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: "7" })}.`;
    assert.throws(() => verificarToken(sinFirma, SECRETO));
  });

  it("el middleware exige sesión y solo deja pasar tokens válidos", async () => {
    for (const headers of [{}, { authorization: "" }, { authorization: "Bearer" }, { authorization: "Basic abc" }, { authorization: "Bearer token-falso" }]) {
      const { err } = await pasar(headers);
      assert.equal(err?.status, 401, JSON.stringify(headers));
    }
    const token = firmarToken({ id: 12 }, SECRETO, "1h");
    const { err, req } = await pasar({ authorization: `Bearer ${token}` });
    assert.equal(err, undefined);
    assert.equal(req.usuarioId, 12);
  });
});
