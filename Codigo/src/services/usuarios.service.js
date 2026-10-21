import { texto, CORREO_RE } from "../utils/validar.js";
import { datosInvalidos, conflicto, noAutorizado, noEncontrado } from "../utils/errores.js";
import { hashPassword, verificarPassword } from "../utils/password.js";

const publico = (f) => ({
  id: Number(f.id),
  correo: f.correo,
  nombreNegocio: f.nombre_negocio,
  nombreDueno: f.nombre_dueno,
});

export function crearUsuariosService(db) {
  return {
    async registrar(datos) {
      const correo = texto(datos.correo, "correo", { max: 190 }).toLowerCase();
      if (!CORREO_RE.test(correo)) throw datosInvalidos("Ingresa un correo válido");
      if (typeof datos.password !== "string" || datos.password.length < 6) {
        throw datosInvalidos("La contraseña debe tener al menos 6 caracteres");
      }
      if (datos.password.length > 200) throw datosInvalidos("La contraseña es demasiado larga");
      const nombreNegocio = texto(datos.nombreNegocio, "nombreNegocio", { max: 120 });
      const nombreDueno = texto(datos.nombreDueno, "nombreDueno", { max: 100 });

      const [existe] = await db.query("SELECT id FROM usuarios WHERE correo = ?", [correo]);
      if (existe) throw conflicto("CORREO_EXISTENTE", "Ya existe una cuenta con ese correo");

      const passwordHash = await hashPassword(datos.password);
      const r = await db.execute(
        "INSERT INTO usuarios (correo, password_hash, nombre_dueno, nombre_negocio) VALUES (?, ?, ?, ?)",
        [correo, passwordHash, nombreDueno, nombreNegocio]
      );
      return this.obtener(r.insertId);
    },

    async autenticar(datos) {
      const correo = typeof datos.correo === "string" ? datos.correo.trim().toLowerCase() : "";
      const password = typeof datos.password === "string" ? datos.password : "";
      const [fila] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
      // mismo mensaje si falla el correo o la contraseña: no se revela cuál de los dos
      if (!fila || !(await verificarPassword(password, fila.password_hash))) {
        throw noAutorizado("Correo o contraseña incorrectos");
      }
      return publico(fila);
    },

    async obtener(id) {
      const [fila] = await db.query("SELECT * FROM usuarios WHERE id = ?", [id]);
      if (!fila) throw noEncontrado("Usuario no encontrado");
      return publico(fila);
    },
  };
}
