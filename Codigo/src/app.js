import express from "express";
import cors from "cors";
import { crearServicios } from "./services/index.js";
import { autenticar } from "./middleware/auth.js";
import { rutaNoEncontrada, manejarErrores } from "./middleware/errores.js";
import { authRoutes } from "./routes/auth.routes.js";
import { productosRoutes } from "./routes/productos.routes.js";
import { ventasRoutes } from "./routes/ventas.routes.js";
import { estadisticasRoutes } from "./routes/estadisticas.routes.js";
import { asistenteRoutes } from "./routes/asistente.routes.js";

// Crea la aplicación Express. Recibe la base de datos y la configuración
// (así se puede probar con otra base de datos).
export function crearApp({ db, config, opciones = {} }) {
  const app = express();
  const servicios = crearServicios(db, config, opciones);
  const auth = autenticar(config);

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigenes }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/salud", async (req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ ok: true, baseDeDatos: "conectada" });
    } catch {
      res.status(503).json({ ok: false, baseDeDatos: "sin conexión" });
    }
  });

  app.use("/api/auth", authRoutes(servicios, config, auth));
  app.use("/api/productos", auth, productosRoutes(servicios));
  app.use("/api/ventas", auth, ventasRoutes(servicios));
  app.use("/api/estadisticas", auth, estadisticasRoutes(servicios));
  app.use("/api/asistente", auth, asistenteRoutes(servicios));

  app.use(rutaNoEncontrada);
  app.use(manejarErrores());
  return app;
}
