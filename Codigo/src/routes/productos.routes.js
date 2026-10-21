import { Router } from "express";
import { ah } from "../utils/async.js";
import { entero } from "../utils/validar.js";

const idDe = (req) => entero(req.params.id, "id", { min: 1 });

export function productosRoutes({ productos }) {
  const r = Router();

  r.get("/", ah(async (req, res) => res.json(await productos.listar(req.usuarioId, req.query))));
  r.post("/", ah(async (req, res) => res.status(201).json(await productos.crear(req.usuarioId, req.body ?? {}))));

  // va antes de "/:id" para que "categorias" no se confunda con un id
  r.get("/categorias", ah(async (req, res) => res.json(await productos.categorias(req.usuarioId))));

  r.get("/:id", ah(async (req, res) => res.json(await productos.obtener(req.usuarioId, idDe(req)))));
  r.put("/:id", ah(async (req, res) => res.json(await productos.actualizar(req.usuarioId, idDe(req), req.body ?? {}))));
  r.delete("/:id", ah(async (req, res) => {
    await productos.eliminar(req.usuarioId, idDe(req));
    res.status(204).end();
  }));

  r.post("/:id/stock", ah(async (req, res) => res.json(await productos.ajustarStock(req.usuarioId, idDe(req), req.body ?? {}))));
  r.get("/:id/movimientos", ah(async (req, res) => res.json(await productos.movimientos(req.usuarioId, idDe(req), req.query.limite))));

  return r;
}
