import { Router } from "express";
import { ah } from "../utils/async.js";
import { entero } from "../utils/validar.js";

const idDe = (req) => entero(req.params.id, "id", { min: 1 });

export function ventasRoutes({ ventas }) {
  const r = Router();
  r.get("/", ah(async (req, res) => res.json(await ventas.listar(req.usuarioId, req.query))));
  r.post("/", ah(async (req, res) => res.status(201).json(await ventas.crear(req.usuarioId, req.body ?? {}))));
  r.get("/:id", ah(async (req, res) => res.json(await ventas.obtener(req.usuarioId, idDe(req)))));
  r.post("/:id/anular", ah(async (req, res) => res.json(await ventas.anular(req.usuarioId, idDe(req)))));
  return r;
}
