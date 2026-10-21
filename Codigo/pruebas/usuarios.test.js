import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearEntorno, sqliteDisponible, rechazaCon } from "./ayudas/entorno.js";

describe("usuarios", { skip: !sqliteDisponible }, () => {
  const datos = { correo: "Carmen@Correo.cl", password: "secreto1", nombreNegocio: "Puesto Carmen", nombreDueno: "Carmen" };

  it("registra una cuenta, normaliza el correo y no devuelve la contraseña", async () => {
    const e = crearEntorno();
    const u = await e.s.usuarios.registrar(datos);
    assert.equal(u.correo, "carmen@correo.cl");
    assert.equal(u.nombreNegocio, "Puesto Carmen");
    assert.equal(u.password, undefined);
    assert.equal(u.password_hash, undefined);
  });

  it("guarda la contraseña con hash (nunca en claro)", async () => {
    const e = crearEntorno();
    await e.s.usuarios.registrar(datos);
    const [fila] = await e.db.query("SELECT password_hash FROM usuarios");
    assert.ok(fila.password_hash.startsWith("scrypt$"));
    assert.ok(!fila.password_hash.includes("secreto1"));
  });

  it("rechaza un correo repetido, aunque cambien las mayúsculas", async () => {
    const e = crearEntorno();
    await e.s.usuarios.registrar(datos);
    await assert.rejects(() => e.s.usuarios.registrar({ ...datos, correo: "carmen@correo.CL" }), rechazaCon(409, "CORREO_EXISTENTE"));
  });

  it("valida los datos de registro", async () => {
    const e = crearEntorno();
    await assert.rejects(() => e.s.usuarios.registrar({ ...datos, correo: "no-es-correo" }), rechazaCon(400));
    await assert.rejects(() => e.s.usuarios.registrar({ ...datos, password: "123" }), rechazaCon(400));
    await assert.rejects(() => e.s.usuarios.registrar({ ...datos, nombreNegocio: "  " }), rechazaCon(400));
    await assert.rejects(() => e.s.usuarios.registrar({ ...datos, nombreDueno: undefined }), rechazaCon(400));
  });

  it("inicia sesión con la contraseña correcta", async () => {
    const e = crearEntorno();
    await e.s.usuarios.registrar(datos);
    const u = await e.s.usuarios.autenticar({ correo: " CARMEN@correo.cl ", password: "secreto1" });
    assert.equal(u.nombreDueno, "Carmen");
  });

  it("rechaza contraseña incorrecta o correo desconocido con el mismo mensaje", async () => {
    const e = crearEntorno();
    await e.s.usuarios.registrar(datos);
    const mensaje = async (entrada) => {
      try {
        await e.s.usuarios.autenticar(entrada);
      } catch (err) {
        assert.equal(err.status, 401);
        return err.message;
      }
      assert.fail("debió rechazar el inicio de sesión");
    };
    const mal = await mensaje({ correo: datos.correo, password: "otra" });
    const noExiste = await mensaje({ correo: "x@y.cl", password: "secreto1" });
    assert.equal(mal, noExiste);
  });
});
