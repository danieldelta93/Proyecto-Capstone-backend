import { Router } from "express";
import { ah } from "../utils/async.js";

export function insightsRoutes({ insights }) {
  const r = Router();
  r.get("/", ah(async (req, res) => res.json(await insights.obtener(req.usuarioId))));
  r.post("/actualizar", ah(async (req, res) => res.json(await insights.actualizar(req.usuarioId))));
  return r;
}
